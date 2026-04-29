import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface CustomerPayment {
  id: string;
  date: string;
  amount: number;
  createdBy?: string;
}

export interface UserProfile {
  role: 'admin' | 'customer';
  photoURL?: string;
  phone?: string;
  username?: string;
  createdBy?: string;
}

export interface Customer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  schemeId: string;
  schemeType: 'chitti' | 'interest' | 'rental';
  joinedDate: string;
  username: string;
  status: 'Active' | 'Inactive';
  payments?: CustomerPayment[];
  createdBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private firestore = inject(Firestore);
  private customerCollection = collection(this.firestore, 'customers');

  getAllCustomers(adminUid?: string): Observable<Customer[]> {
    if (adminUid) {
      const q = query(this.customerCollection, where('createdBy', '==', adminUid));
      return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
    }
    return collectionData(this.customerCollection, { idField: 'id' }) as Observable<Customer[]>;
  }

  getCustomersByScheme(schemeId: string, schemeType: 'chitti'): Observable<Customer[]> {
    const q = query(
      this.customerCollection, 
      where('schemeId', '==', schemeId),
      where('schemeType', '==', schemeType)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }

  getCustomersByUserIdentifier(identifier: string): Observable<Customer[]> {
    // Try username match first (stable identifier), then phone
    const byUsername = query(this.customerCollection, where('username', '==', identifier));
    const byPhone = query(this.customerCollection, where('phone', '==', identifier));
    
    // Return username-based results; caller can fall back to phone if needed
    return collectionData(byUsername, { idField: 'id' }) as Observable<Customer[]>;
  }

  getCustomersByPhone(phone: string): Observable<Customer[]> {
    const q = query(this.customerCollection, where('phone', '==', phone));
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }

  getCustomerById(id: string): Observable<Customer> {
    const customerDoc = doc(this.firestore, `customers/${id}`);
    return docData(customerDoc, { idField: 'id' }) as Observable<Customer>;
  }

  addCustomer(customer: Omit<Customer, 'id'>) {
    return addDoc(this.customerCollection, customer);
  }

  updateCustomer(id: string, customer: Partial<Customer>) {
    const customerDoc = doc(this.firestore, `customers/${id}`);
    return updateDoc(customerDoc, customer);
  }

  deleteCustomer(id: string) {
    const customerDoc = doc(this.firestore, `customers/${id}`);
    return deleteDoc(customerDoc);
  }
}
