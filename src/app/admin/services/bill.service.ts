import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  getDoc
} from '@angular/fire/firestore';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TspdclService } from './tspdcl.service';
import { HmwssbService } from './hmwssb.service';

export interface BillPaymentRecord {
  date: string;        // ISO date string
  amount: number;      // Amount paid in this installment
  reference?: string;  // UPI / receipt / transaction ref
  notes?: string;      // Optional notes
  addedAt?: string;    // Timestamp when entry was created
}

export interface Bill {
  id?: string;
  serviceType: 'electricity' | 'mobile' | 'water' | 'internet' | 'rent' | 'other';
  provider?: string;
  serviceNumber: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  year: number;
  month: string;
  notes?: string;
  isDeleted?: boolean;
  createdAt: any;
  updatedAt: any;
  adminUid: string;
  // Multi-payment tracking
  payments?: BillPaymentRecord[];
  totalPaid?: number;       // Sum of all payment amounts
  paidDate?: string;        // Date of last/full payment (for backward compat)
  paidAmount?: number;      // Legacy single-payment field
  paidReference?: string;   // Legacy
  gmailSnippet?: string;
}

export interface TrackedService {
  id?: string;
  title?: string;
  serviceType: string;
  provider: string;
  serviceNumber: string;
  consumerName?: string;
  address?: string;
  ero?: string;
  sectionName?: string;
  altServiceNumber?: string;
  lastSynced?: any;
  lastAmount?: number;
  lastAmountLabel?: string;
  lastDueDate?: string;
  lastPaidDate?: string;
  lastBillStatus?: 'paid' | 'pending';
  adminUid: string;
}

export interface StoredBillRecord {
  id?: string;
  consumerName: string;
  serviceNumber: string;
  amount: number;
  date: string;
  year: number;
  month: string;
  adminUid: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private firestore = inject(Firestore);
  private tspdclService = inject(TspdclService);
  private hmwssbService = inject(HmwssbService);
  private billsCollection = collection(this.firestore, 'bills');
  private trackedServicesCollection = collection(this.firestore, 'tracked_services');
  private storedRecordsCollection = collection(this.firestore, 'stored_bill_records');

  // --- Tracked Services Management ---
  getTrackedServices(adminUid: string): Observable<TrackedService[]> {
    const q = query(this.trackedServicesCollection, where('adminUid', '==', adminUid));
    return collectionData(q, { idField: 'id' }) as Observable<TrackedService[]>;
  }

  registerService(service: Partial<TrackedService>): Promise<any> {
    return addDoc(this.trackedServicesCollection, service);
  }

  removeTrackedService(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `tracked_services/${id}`));
  }

  updateTrackedService(id: string, data: Partial<TrackedService>): Promise<void> {
    const serviceDoc = doc(this.firestore, `tracked_services/${id}`);
    return updateDoc(serviceDoc, { ...data, lastSynced: serverTimestamp() });
  }

  // --- Bill Operations ---
  getBills(adminUid: string): Observable<Bill[]> {
    const q = query(
      this.billsCollection,
      where('adminUid', '==', adminUid),
      where('isDeleted', '!=', true),
      orderBy('dueDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Bill[]>;
  }

  getServiceBillHistory(serviceNumber: string): Observable<Bill[]> {
    const q = query(
      this.billsCollection,
      where('serviceNumber', '==', serviceNumber),
      where('isDeleted', '!=', true),
      orderBy('dueDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Bill[]>;
  }

  getBillsByFilters(adminUid: string, filters: {
    status?: string,
    serviceType?: string,
    year?: number,
    month?: string
  }): Observable<Bill[]> {
    let constraints: any[] = [
      where('adminUid', '==', adminUid),
      where('isDeleted', '!=', true)
    ];

    if (filters.status) constraints.push(where('status', '==', filters.status));
    if (filters.serviceType) constraints.push(where('serviceType', '==', filters.serviceType));
    if (filters.year) constraints.push(where('year', '==', Number(filters.year)));
    if (filters.month) constraints.push(where('month', '==', filters.month));

    constraints.push(orderBy('isDeleted'));
    constraints.push(orderBy('dueDate', 'desc'));

    const q = query(this.billsCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Bill[]>;
  }

  getPaidBills(adminUid: string, year?: number, month?: string): Observable<Bill[]> {
    let constraints: any[] = [
      where('adminUid', '==', adminUid),
      where('status', '==', 'completed'),
      where('isDeleted', '!=', true)
    ];
    if (year) constraints.push(where('year', '==', year));
    if (month) constraints.push(where('month', '==', month));
    constraints.push(orderBy('isDeleted'));
    constraints.push(orderBy('paidDate', 'desc'));
    const q = query(this.billsCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Bill[]>;
  }

  async addBill(bill: Partial<Bill>): Promise<any> {
    const date = new Date(bill.dueDate!);
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // Prevent duplicate entries for the same service and month/year
    if (bill.serviceNumber) {
      const q = query(
        this.billsCollection,
        where('serviceNumber', '==', bill.serviceNumber),
        where('month', '==', month),
        where('year', '==', year),
        where('isDeleted', '!=', true)
      );
      const existing = await firstValueFrom(collectionData(q, { idField: 'id' }).pipe(map(docs => docs)));
      if (existing && existing.length > 0) {
        console.warn('Bill already exists for this month. Skipping duplicate creation.');
        return { success: false, id: existing[0]['id'], duplicate: true };
      }
    }

    const newBill = {
      ...bill,
      status: bill.status || 'pending',
      year: year,
      month: month,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return addDoc(this.billsCollection, newBill);
  }

  updateBill(id: string, updates: Partial<Bill>): Promise<void> {
    const billDoc = doc(this.firestore, `bills/${id}`);
    return updateDoc(billDoc, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async addPaymentRecord(id: string, payment: BillPaymentRecord): Promise<void> {
    const billDoc = doc(this.firestore, `bills/${id}`);
    const docSnap = await getDoc(billDoc);
    if (!docSnap.exists()) return;

    const currentBill = docSnap.data() as Bill;
    const currentTotalPaid = currentBill.totalPaid || currentBill.paidAmount || 0;
    const newTotalPaid = currentTotalPaid + payment.amount;
    
    // Auto complete if fully paid
    const isFullyPaid = newTotalPaid >= currentBill.amount;

    return updateDoc(billDoc, {
      payments: arrayUnion({
        ...payment,
        addedAt: new Date().toISOString()
      }),
      totalPaid: newTotalPaid,
      // Keep backward compatibility fields
      paidDate: isFullyPaid ? payment.date : currentBill.paidDate || payment.date,
      paidAmount: newTotalPaid,
      status: isFullyPaid ? 'completed' : currentBill.status,
      updatedAt: serverTimestamp()
    });
  }

  markBillAsPaid(id: string, paidDate: string, paidAmount: number, reference?: string, gmailSnippet?: string): Promise<void> {
    const billDoc = doc(this.firestore, `bills/${id}`);
    return updateDoc(billDoc, {
      status: 'completed',
      paidDate,
      paidAmount,
      paidReference: reference || '',
      gmailSnippet: gmailSnippet || '',
      updatedAt: serverTimestamp()
    });
  }

  deleteBill(id: string, hardDelete: boolean = false): Promise<void> {
    const billDoc = doc(this.firestore, `bills/${id}`);
    if (hardDelete) {
      return deleteDoc(billDoc);
    } else {
      return updateDoc(billDoc, {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
    }
  }

  // Mock Sync from Servers based on Service Numbers
  syncBillsFromServers(adminUid: string): Observable<any> {
    const q = query(this.trackedServicesCollection, where('adminUid', '==', adminUid));
    return collectionData(q) as Observable<TrackedService[]>;
  }

  async processSync(adminUid: string, services: TrackedService[]): Promise<any> {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();
    let addedCount = 0;

    for (const service of services) {
      const existingQ = query(
        this.billsCollection,
        where('serviceNumber', '==', service.serviceNumber),
        where('month', '==', currentMonth),
        where('year', '==', currentYear),
        where('isDeleted', '!=', true)
      );

      const existingData = await new Promise<any[]>(res => {
         const sub = collectionData(existingQ, { idField: 'id' }).subscribe(data => {
           res(data);
           sub.unsubscribe();
         });
      });

      let liveBill: any = null;
      if (service.serviceType === 'electricity') {
        try {
          liveBill = await firstValueFrom(this.tspdclService.fetchBillDetails(service.serviceNumber));
        } catch (e) {
          console.error('Failed to fetch live TSPDCL bill:', e);
        }
      } else if (service.serviceType === 'water') {
        try {
          liveBill = await firstValueFrom(this.hmwssbService.fetchBillDetails(service.serviceNumber));
        } catch (e) {
          console.error('Failed to fetch live HMWSSB bill:', e);
        }
      }

      if (existingData.length > 0) {
        const existingBill = existingData[0] as Bill;
        if (existingBill.id && liveBill?.isPaid && liveBill.paidAmount !== undefined) {
          await this.updateBill(existingBill.id, {
            status: 'completed',
            paidDate: this.toIsoBillDate(liveBill.paidDate) || new Date().toISOString().split('T')[0],
            paidAmount: liveBill.paidAmount,
            totalPaid: liveBill.paidAmount,
            amount: liveBill.paidAmount || existingBill.amount,
            notes: `${existingBill.notes || ''} Paid status confirmed from live billing portal.`.trim()
          });
        }
        continue;
      }

      if (existingData.length === 0) {
        let billData: Partial<Bill> | null = null;

        if (service.serviceType === 'electricity') {
            if (liveBill && liveBill.success) {
              billData = {
                serviceType: 'electricity',
                provider: service.provider,
                serviceNumber: service.serviceNumber,
                amount: liveBill.totalAmountPayable || 0,
                dueDate: this.toIsoBillDate(liveBill.dueDate) || new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0],
                status: liveBill.isPaid ? 'completed' : 'pending',
                paidDate: liveBill.isPaid ? (this.toIsoBillDate(liveBill.paidDate) || new Date().toISOString().split('T')[0]) : undefined,
                paidAmount: liveBill.isPaid ? liveBill.paidAmount || liveBill.totalAmountPayable || 0 : undefined,
                totalPaid: liveBill.isPaid ? liveBill.paidAmount || liveBill.totalAmountPayable || 0 : undefined,
                notes: `Auto-synced from TGSPDCL website for ${liveBill.consumerName}.`,
                adminUid: adminUid
              };

              // Auto-store in archives
              await this.autoStoreBillRecord({
                consumerName: liveBill.consumerName || service.title || 'Unnamed',
                serviceNumber: service.serviceNumber,
                amount: liveBill.totalAmountPayable || 0,
                date: new Date().toISOString().split('T')[0],
                adminUid: adminUid
              });
            }
        } else if (service.serviceType === 'water') {
            if (liveBill && liveBill.success) {
              billData = {
                serviceType: 'water',
                provider: service.provider,
                serviceNumber: service.serviceNumber,
                amount: liveBill.totalAmountPayable || 0,
                dueDate: this.toIsoBillDate(liveBill.dueDate) || new Date(now.getFullYear(), now.getMonth(), 20).toISOString().split('T')[0],
                status: liveBill.isPaid ? 'completed' : 'pending',
                paidDate: liveBill.isPaid ? (this.toIsoBillDate(liveBill.paidDate) || new Date().toISOString().split('T')[0]) : undefined,
                paidAmount: liveBill.isPaid ? liveBill.paidAmount || liveBill.totalAmountPayable || 0 : undefined,
                totalPaid: liveBill.isPaid ? liveBill.paidAmount || liveBill.totalAmountPayable || 0 : undefined,
                notes: `Auto-synced from HMWSSB website for ${liveBill.consumerName}.`,
                adminUid: adminUid
              };

              // Auto-store in archives
              await this.autoStoreBillRecord({
                consumerName: liveBill.consumerName || service.title || 'Unnamed',
                serviceNumber: service.serviceNumber,
                amount: liveBill.totalAmountPayable || 0,
                date: new Date().toISOString().split('T')[0],
                adminUid: adminUid
              });
            }
        }

        // Fallback or other service types
        if (!billData) {
          let mockAmount = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
          let mockDueDate = new Date(now.getFullYear(), now.getMonth(), 28).toISOString().split('T')[0];
          
          billData = {
            serviceType: service.serviceType as any,
            provider: service.provider,
            serviceNumber: service.serviceNumber,
            amount: mockAmount,
            dueDate: mockDueDate,
            status: 'pending',
            notes: `Auto-generated for Service No: ${service.serviceNumber}`,
            adminUid: adminUid
          };
        }

        await this.addBill(billData);
        addedCount++;
      }
    }
    return { success: true, count: addedCount };
  }

  buildGmailSearchUrl(serviceNumber: string, provider?: string): string {
    const query = [
      provider ? `"${provider}"` : '',
      `"${serviceNumber}"`,
      'subject:(payment OR paid OR receipt OR confirmation OR bill)'
    ].filter(Boolean).join(' ');
    return `https://mail.google.com/mail/#search/${encodeURIComponent(query)}`;
  }

  private toIsoBillDate(value?: string): string | undefined {
    if (!value || value === '--' || value === 'Check Portal') return undefined;

    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
    if (!match) return undefined;

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = months.indexOf(match[2].toUpperCase());
    if (monthIndex === -1) return undefined;

    const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
    const day = Number(match[1]);
    const date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return undefined;

    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // --- Stored Bill Records ---
  getStoredRecords(adminUid: string, year?: number): Observable<StoredBillRecord[]> {
    let constraints: any[] = [where('adminUid', '==', adminUid)];
    if (year) constraints.push(where('year', '==', year));
    constraints.push(orderBy('date', 'desc'));
    
    const q = query(this.storedRecordsCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<StoredBillRecord[]>;
  }

  getStoredRecordsByService(serviceNumber: string): Observable<StoredBillRecord[]> {
    const q = query(
      this.storedRecordsCollection, 
      where('serviceNumber', '==', serviceNumber),
      orderBy('date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<StoredBillRecord[]>;
  }

  addStoredRecord(record: Partial<StoredBillRecord>): Promise<any> {
    const date = record.date ? new Date(record.date) : new Date();
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    
    const data = {
      ...record,
      year: date.getFullYear(),
      month: months[date.getMonth()],
      createdAt: serverTimestamp()
    };
    return addDoc(this.storedRecordsCollection, data);
  }

  async autoStoreBillRecord(record: Partial<StoredBillRecord>): Promise<any> {
    if (!record.serviceNumber || !record.adminUid || !record.amount) return;

    const date = record.date ? new Date(record.date) : new Date();
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    // 1. Duplicate Check (Monthly only one record per service)
    const q = query(
      this.storedRecordsCollection,
      where('serviceNumber', '==', record.serviceNumber),
      where('month', '==', month),
      where('year', '==', year)
    );
    
    const existing = await firstValueFrom(collectionData(q).pipe(map(docs => docs)));
    if (existing && existing.length > 0) {
      console.log('Record already exists for this month. Skipping auto-store.');
      return;
    }

    // 2. Add the record
    const data = {
      ...record,
      year,
      month,
      createdAt: serverTimestamp()
    };
    await addDoc(this.storedRecordsCollection, data);

    // 3. Auto Cleanup (Last 6 months only)
    // Find records older than 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const cleanupQ = query(
      this.storedRecordsCollection,
      where('serviceNumber', '==', record.serviceNumber),
      where('adminUid', '==', record.adminUid),
      where('date', '<', sixMonthsAgoStr)
    );

    const oldRecords = await firstValueFrom(collectionData(cleanupQ, { idField: 'id' }).pipe(map(docs => docs)));
    if (oldRecords && oldRecords.length > 0) {
      for (const old of oldRecords) {
        await this.deleteStoredRecord(old.id);
      }
    }
  }

  deleteStoredRecord(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `stored_bill_records/${id}`));
  }
}
