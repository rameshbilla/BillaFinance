const Imap = require('imap');
const { simpleParser } = require('mailparser');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// 1. Download your service account key from Firebase Console -> Project Settings -> Service Accounts
// 2. Save it as 'service-account.json' in this folder
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'service-account.json');

// --- CREDENTIALS (As provided by user) ---
const GMAIL_CONFIG = {
    user: 'billdesigns0007@gmail.com',
    password: 'billa@007', // IMPORTANT: Use an "App Password" from Google Account settings if 2FA is enabled
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
};

// --- INITIALIZE FIREBASE ---
if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    const serviceAccount = require(SERVICE_ACCOUNT_FILE);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.error('Error: service-account.json not found in the scripts folder.');
    console.log('Please download it from Firebase Console -> Project Settings -> Service Accounts.');
    process.exit(1);
}

const db = admin.firestore();
const billsCollection = db.collection('bills');

const imap = new Imap(GMAIL_CONFIG);

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

imap.once('ready', function () {
    openInbox(function (err, box) {
        if (err) throw err;
        
        // Search for bill related emails from the last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const searchCriteria = [
            ['SINCE', sixtyDaysAgo], 
            ['OR', ['OR', ['BODY', 'TSSPDCL'], ['BODY', 'BillDesk']], ['BODY', 'Total Amount']]
        ];

        imap.search(searchCriteria, function (err, results) {
            if (err) throw err;
            if (!results || results.length === 0) {
                console.log('No new bills found.');
                imap.end();
                return;
            }

            console.log(`Found ${results.length} potential bill emails. Processing...`);

            const f = imap.fetch(results, { bodies: '' });
            f.on('message', function (msg, seqno) {
                msg.on('body', function (stream, info) {
                    simpleParser(stream, async (err, mail) => {
                        if (err) return;

                        // Skip PDFs as requested by user
                        if (mail.attachments && mail.attachments.length > 0) {
                            const hasPdf = mail.attachments.some(att => att.contentType === 'application/pdf');
                            if (hasPdf) {
                                console.log(`Skipping email ${seqno} because it contains a PDF.`);
                                return;
                            }
                        }

                        const text = mail.text || '';
                        
                        // --- EXTRACTION REGEX PATTERNS ---
                        // 9-digit USC Number (Telangana/Andhra standard)
                        const uscRegex = /(\d{9})/;
                        // Amount (handles Rs. 500, Amount: 500, Total: 500.00 etc)
                        const amountRegex = /(?:Rs\.?|Amount|Total|Bill Amount)\s*[:\-]?\s*(\d+(?:\.\d{2})?)/i;
                        // Due Date (DD/MM/YYYY or YYYY-MM-DD)
                        const dateRegex = /(?:Due Date|Date|By)\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})/i;

                        const uscMatch = text.match(uscRegex);
                        const amountMatch = text.match(amountRegex);
                        const dateMatch = text.match(dateRegex);

                        if (uscMatch && amountMatch) {
                            const usc = uscMatch[1];
                            const amount = parseFloat(amountMatch[1]);
                            const rawDate = dateMatch ? dateMatch[1] : new Date().toISOString();
                            
                            // Normalize date format for DB
                            let dueDate = rawDate;
                            if (rawDate.includes('/')) {
                                const parts = rawDate.split('/');
                                if (parts[0].length === 2) { // DD/MM/YYYY -> YYYY-MM-DD
                                    dueDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                }
                            }

                            console.log(`Parsed Bill: USC=${usc}, Amount=${amount}, DueDate=${dueDate}`);
                            
                            await updateBillInFirestore({
                                serviceNumber: usc,
                                amount: amount,
                                dueDate: dueDate,
                                provider: mail.from.text || 'Unknown',
                                notes: 'Auto-synced from Gmail: ' + mail.subject
                            });
                        }
                    });
                });
            });
            f.once('error', function (err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function () {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });
});

async function updateBillInFirestore(billData) {
    try {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const date = new Date(billData.dueDate);
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        // Check if bill already exists for this USC, month and year
        const query = billsCollection
            .where('serviceNumber', '==', billData.serviceNumber)
            .where('month', '==', month)
            .where('year', '==', year)
            .where('isDeleted', '==', false);

        const snapshot = await query.get();

        if (snapshot.empty) {
            // Add new bill
            await billsCollection.add({
                ...billData,
                serviceType: 'other', // Default, should be refined based on biller
                status: 'pending',
                month: month,
                year: year,
                isDeleted: false,
                adminUid: 'auto-sync',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Successfully added new bill for USC ${billData.serviceNumber}`);
        } else {
            // Update existing bill (maybe the amount changed or it was a reminder)
            const docId = snapshot.docs[0].id;
            await billsCollection.doc(docId).update({
                amount: billData.amount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Updated existing bill for USC ${billData.serviceNumber}`);
        }
    } catch (err) {
        console.error('Firestore Update Error:', err);
    }
}

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();
