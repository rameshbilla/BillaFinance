import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface RentalBill {
  id?: string;
  billDate: string;
  month: string;
  year: number;
  rentAmount: number;
  electricBill: number;
  waterBill: number;
  total: number;
  status: 'Paid' | 'Pending';
  paidDate?: string;
}

export interface RentalHouse {
  id?: string;
  houseName: string;
  advanceAmount: number;
  advanceMonths: number;
  monthlyRent: number;
  renterName: string;
  renterPhone: string;
  arrivedDate: string;
  fullAddress?: string;
  
  electricMeterNo?: string;
  waterBillNo?: string;
  
  bills: RentalBill[];
  status: 'Occupied' | 'Vacant';
  lastRentIncreaseDate?: string;
  createdBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private firestore = inject(Firestore);
  private rentalCollection = collection(this.firestore, 'rentals');

  getHouses(adminUid?: string): Observable<RentalHouse[]> {
    if (adminUid) {
      const q = query(this.rentalCollection, where('createdBy', '==', adminUid));
      return collectionData(q, { idField: 'id' }) as Observable<RentalHouse[]>;
    }
    return collectionData(this.rentalCollection, { idField: 'id' }) as Observable<RentalHouse[]>;
  }

  getHouseById(id: string): Observable<RentalHouse> {
    const houseDoc = doc(this.firestore, `rentals/${id}`);
    return docData(houseDoc, { idField: 'id' }) as Observable<RentalHouse>;
  }

  addHouse(house: Omit<RentalHouse, 'id'>) {
    return addDoc(this.rentalCollection, house);
  }

  updateHouse(id: string, house: Partial<RentalHouse>) {
    const houseDoc = doc(this.firestore, `rentals/${id}`);
    return updateDoc(houseDoc, house);
  }

  deleteHouse(id: string) {
    const houseDoc = doc(this.firestore, `rentals/${id}`);
    return deleteDoc(houseDoc);
  }
}
