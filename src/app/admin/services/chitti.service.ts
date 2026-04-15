import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ChittiScheme {
  id?: string;
  name: string;
  tenure: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  totalValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChittiService {
  private firestore = inject(Firestore);
  private chittiCollection = collection(this.firestore, 'chittis');

  getChittis(): Observable<ChittiScheme[]> {
    return collectionData(this.chittiCollection, { idField: 'id' }) as Observable<ChittiScheme[]>;
  }

  getChittiById(id: string): Observable<ChittiScheme> {
    const chittiDoc = doc(this.firestore, `chittis/${id}`);
    return docData(chittiDoc, { idField: 'id' }) as Observable<ChittiScheme>;
  }

  addChitti(chitti: Omit<ChittiScheme, 'id'>) {
    return addDoc(this.chittiCollection, chitti);
  }

  updateChitti(id: string, chitti: Partial<ChittiScheme>) {
    const chittiDoc = doc(this.firestore, `chittis/${id}`);
    return updateDoc(chittiDoc, chitti);
  }

  deleteChitti(id: string) {
    const chittiDoc = doc(this.firestore, `chittis/${id}`);
    return deleteDoc(chittiDoc);
  }
}
