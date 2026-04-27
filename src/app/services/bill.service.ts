import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, collectionData, Timestamp, orderBy } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Bill, BillPayment, BillStatus } from '../models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private firestore = inject(Firestore);

  // --- Bill CRUD ---
  async addBill(bill: Omit<Bill, 'id'>) {
    const col = collection(this.firestore, 'bills');
    return addDoc(col, {
      ...bill,
      updatedAt: new Date().toISOString()
    });
  }

  getBills(adminUid: string): Observable<Bill[]> {
    const col = collection(this.firestore, 'bills');
    const q = query(col, where('createdBy', '==', adminUid), orderBy('dueDate', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Bill[]>;
  }

  async updateBill(id: string, data: Partial<Bill>) {
    const d = doc(this.firestore, `bills/${id}`);
    return updateDoc(d, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  // --- Payment Tracking ---
  async addPayment(payment: Omit<BillPayment, 'id'>) {
    const col = collection(this.firestore, 'bill_payments');
    return addDoc(col, payment);
  }

  getPayments(billId: string): Observable<BillPayment[]> {
    const col = collection(this.firestore, 'bill_payments');
    const q = query(col, where('billId', '==', billId), orderBy('paymentDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<BillPayment[]>;
  }

  // --- Analytics Helpers ---
  calculateBillStatus(dueDate: string, isPaid: boolean): BillStatus {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (isPaid) return 'Paid';
    if (due < now) return 'Overdue';
    
    const diff = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
    if (diff <= 7) return 'Upcoming';
    return 'Pending';
  }

  // --- Mock Scraping / Integration Provision ---
  async fetchExternalBillDetails(provider: string, consumerNumber: string): Promise<Partial<Bill>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data based on provider logic
    if (!consumerNumber) throw new Error('Consumer number required');

    if (provider === 'TGSPDCL') {
      return {
        amountDue: Math.floor(Math.random() * 5000) + 500,
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: `Fetched via TSSPDCL Portal for Service Number ${consumerNumber}`
      };
    } else if (provider === 'HMWSSB') {
      return {
        amountDue: Math.floor(Math.random() * 1000) + 200,
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: `Fetched via HMWSSB CAN ${consumerNumber}`
      };
    }

    // Default mock behavior for others
    return {
      amountDue: Math.floor(Math.random() * 2000) + 100,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      notes: `Bill details retrieved for ID: ${consumerNumber}`
    };
  }
}
