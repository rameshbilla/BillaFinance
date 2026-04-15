import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  schemeId: string;
  schemeType: 'chitti';
  joinedDate: string;
  status: 'Active' | 'Inactive';
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private firestore = inject(Firestore);
  private customerCollection = collection(this.firestore, 'customers');

  getAllCustomers(): Observable<Customer[]> {
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
    // In Firestore, we can't easily do a logical OR with different fields in a simple query 
    // unless using special features. For simplicity, we'll fetch all and filter or provide specific queries.
    // However, usually index on phone/email is fine.
    const q = query(
      this.customerCollection, 
      where('phone', '==', identifier)
    );
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
