# Gmail Bill Sync Utility

This script automates the reading of electricity/service bills from your Gmail account and updates your `BillaFinance` paid list (Firestore).

## Setup Instructions

### 1. Install Dependencies
Open your terminal in the `scripts` folder and run:
```bash
npm install
```

### 2. Firebase Service Account Key
To allow the script to update your Firestore database:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `finance-services-a296e`.
3. Click the Gear icon (Project Settings) -> **Service Accounts**.
4. Click **Generate new private key**.
5. Save the downloaded `.json` file as `service-account.json` inside this `scripts` folder.

### 3. Gmail App Password
If you have 2-Factor Authentication (2FA) enabled on your Gmail account (which is recommended), follow these steps to get a password for the script:
1. Go to [My Account](https://myaccount.google.com/).
2. Search for **"App Passwords"**.
3. Create a new App Password (call it "Finance Script") and copy the 16-character code.
4. Replace the password in `sync.js` (Line 18) with this 16-character code.

### 4. Run the Sync
```bash
node sync.js
```

## How it Works
- **Filters:** It searches for "TSSPDCL", "BillDesk", or "Amount" in your unread emails.
- **Skips PDFs:** As requested, it ignores any emails containing PDF attachments.
- **Extraction:** It uses Regular Expressions to find the **USC Number** (9 digits), the **Amount**, and the **Due Date**.
- **Firestore Update:** It checks if a bill for that USC and month already exists. If not, it adds it; if it does, it updates the amount.
