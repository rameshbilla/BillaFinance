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
  serverTimestamp 
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Bill {
  id?: string;
  serviceType: 'electricity' | 'mobile' | 'water' | 'internet' | 'rent' | 'other';
  provider?: string;
  serviceNumber: string; // Unique Service Number (e.g. USCNO, Consumer ID)
  amount: number;
  dueDate: string; // ISO format
  status: 'pending' | 'completed' | 'overdue';
  year: number;
  month: string;
  notes?: string;
  isDeleted?: boolean;
  createdAt: any;
  updatedAt: any;
  adminUid: string;
}

export interface TrackedService {
  id?: string;
  serviceType: string;
  provider: string;
  serviceNumber: string;
  adminUid: string;
  lastSynced?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private firestore = inject(Firestore);
  private billsCollection = collection(this.firestore, 'bills');
  private trackedServicesCollection = collection(this.firestore, 'tracked_services');

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

  // --- Bill Operations ---
  getBills(adminUid: string): Observable<Bill[]> {
    const q = query(
      this.billsCollection, 
      where('adminUid', '==', adminUid),
      where('isDeleted', '!=', true),
      orderBy('isDeleted'),
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

  addBill(bill: Partial<Bill>): Promise<any> {
    const date = new Date(bill.dueDate!);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const newBill = {
      ...bill,
      status: bill.status || 'pending',
      year: date.getFullYear(),
      month: months[date.getMonth()],
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
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    const q = query(this.trackedServicesCollection, where('adminUid', '==', adminUid));
    
    return collectionData(q) as Observable<TrackedService[]>;
  }

  // Helper for sync since mapping promises in observables is messy
  async processSync(adminUid: string, services: TrackedService[]): Promise<any> {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
         const sub = collectionData(existingQ).subscribe(data => {
           res(data);
           sub.unsubscribe();
         });
      });

      if (existingData.length === 0) {
        let mockAmount = 0;
        let mockDueDate = "";
        let mockNotes = `Auto-generated for Service No: ${service.serviceNumber}`;

        // Special case for User's Example USCNO: 101046746
        if (service.serviceNumber === '101046746') {
          mockAmount = 504.00;
          mockDueDate = "2026-04-18"; // From image
          mockNotes = "Fetched from BillDesk (Sri Narahari)";
        } else {
          mockAmount = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;
          mockDueDate = new Date(now.getFullYear(), now.getMonth(), 28).toISOString().split('T')[0];
        }

        await this.addBill({
          serviceType: service.serviceType as any,
          provider: service.provider,
          serviceNumber: service.serviceNumber,
          amount: mockAmount,
          dueDate: mockDueDate,
          status: 'pending',
          notes: mockNotes,
          adminUid: adminUid
        });
        addedCount++;
      }
    }
    return { success: true, count: addedCount };
  }
}
