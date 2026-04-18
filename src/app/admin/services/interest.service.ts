import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Settlement {
  id?: string;
  date: string;
  amount: number;
}

export interface InterestCollection {
  id?: string;
  date: string;
  amount: number;
}

export interface InterestScheme {
  id?: string;
  name: string;
  amount: number;
  interestRate: number;
  description: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail?: string;
  borrowerIdType?: string;
  borrowerIdValue?: string;
  borrowerIdDoc?: string;
  settlements: Settlement[];
  interestCollections?: InterestCollection[];
  startDate: string;
  username: string;
  createdBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InterestService {
  private firestore = inject(Firestore);
  private interestCollection = collection(this.firestore, 'interests');

  getInterests(adminUid?: string): Observable<InterestScheme[]> {
    if (adminUid) {
      const q = query(this.interestCollection, where('createdBy', '==', adminUid));
      return collectionData(q, { idField: 'id' }) as Observable<InterestScheme[]>;
    }
    return collectionData(this.interestCollection, { idField: 'id' }) as Observable<InterestScheme[]>;
  }

  getInterestById(id: string): Observable<InterestScheme> {
    const interestDoc = doc(this.firestore, `interests/${id}`);
    return docData(interestDoc, { idField: 'id' }) as Observable<InterestScheme>;
  }

  addInterest(interest: Omit<InterestScheme, 'id'>) {
    return addDoc(this.interestCollection, interest);
  }

  updateInterest(id: string, interest: Partial<InterestScheme>) {
    const interestDoc = doc(this.firestore, `interests/${id}`);
    return updateDoc(interestDoc, interest);
  }

  deleteInterest(id: string) {
    const interestDoc = doc(this.firestore, `interests/${id}`);
    return deleteDoc(interestDoc);
  }
}
