import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';
import { TspdclService } from './tspdcl.service';
import { HmwssbService } from './hmwssb.service';
import { AuthService } from '../../services/auth.service';

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

export interface RentalExpense {
  id: string;
  date: string;
  category: 'Plumbing' | 'Electrical' | 'Painting' | 'Cleaning' | 'Tax' | 'Repairs' | 'Other';
  amount: number;
  description: string;
}

export interface PastTenancy {
  renterName: string;
  renterPhone: string;
  arrivedDate: string;
  vacatedDate: string;
  bills: RentalBill[];
  expenses?: RentalExpense[];
  advanceRefunded: number;
  deductions: number;
  deductionReason?: string;
}

export interface RentalHouse {
  id?: string;
  houseName: string;
  advanceAmount: number;
  advanceMonths: number;
  monthlyRent: number;
  renterName: string;
  renterPhone: string;
  renterAadhar?: string;
  arrivedDate: string;
  fullAddress?: string;
  
  electricMeterNo?: string;
  waterBillNo?: string;
  
  bills: RentalBill[];
  status: 'Occupied' | 'Vacant';
  lastRentIncreaseDate?: string;
  createdBy?: string;
  
  landlordPan?: string;
  expenses?: RentalExpense[];
  pastTenancies?: PastTenancy[];
}

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private firestore = inject(Firestore);
  private rentalCollection = collection(this.firestore, 'rentals');

  private authService = inject(AuthService);
  private tspdclService = inject(TspdclService);
  private hmwssbService = inject(HmwssbService);

  private rentalUtilityBills$ = new BehaviorSubject<Record<string, {
    electricity?: number;
    water?: number;
    electricityPaid?: boolean;
    waterPaid?: boolean;
    electricityPaidDate?: string;
    waterPaidDate?: string;
  }>>({});

  public rentalUtilityBills = this.rentalUtilityBills$.asObservable();
  private fetchSubscription?: Subscription;
  private activeSyncUid?: string;

  constructor() {
    this.authService.userProfile$.subscribe(profile => {
      if (profile && (profile.role === 'admin' || profile.role === 'super-admin')) {
        const hasBillsAndRentals = profile.role === 'super-admin' || 
          (profile.tabConfig?.bills !== false || profile.tabConfig?.rentals === true);
        if (hasBillsAndRentals) {
          this.ensureGlobalSync(profile.uid);
        }
      } else {
        this.clearGlobalSync();
      }
    });
  }

  private ensureGlobalSync(adminUid: string) {
    if (this.fetchSubscription && this.activeSyncUid === adminUid) return;
    
    this.clearGlobalSync();
    this.activeSyncUid = adminUid;
    
    this.fetchSubscription = this.getHouses(adminUid).subscribe({
      next: (houses) => {
        houses.forEach(house => {
          if (house.id && !this.rentalUtilityBills$.value[house.id]) {
            this.syncRentalUtilityBills(house);
          }
        });
      },
      error: (err) => {
        console.error('Error in global houses sync:', err);
      }
    });
  }

  private clearGlobalSync() {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
      this.fetchSubscription = undefined;
    }
    this.activeSyncUid = undefined;
    this.rentalUtilityBills$.next({});
  }

  async syncRentalUtilityBills(house: RentalHouse): Promise<any> {
    if (!house.id) return;

    const currentMap = this.rentalUtilityBills$.value;
    const nextValues = {
      ...(currentMap[house.id] || {})
    };

    try {
      await Promise.all([
        house.electricMeterNo
          ? firstValueFrom(this.tspdclService.fetchBillDetails(house.electricMeterNo)).then(details => {
              if (details?.success) {
                nextValues.electricity = this.getLiveUtilityAmount(details);
                nextValues.electricityPaid = this.isLiveBillPaid(details);
                nextValues.electricityPaidDate = this.isLiveBillPaid(details) ? this.getLiveBillDisplayDate(details) : '';
              }
            })
          : Promise.resolve(),
        house.waterBillNo
          ? firstValueFrom(this.hmwssbService.fetchBillDetails(house.waterBillNo)).then(details => {
              if (details?.success) {
                nextValues.water = this.getLiveUtilityAmount(details);
                nextValues.waterPaid = this.isLiveBillPaid(details);
                nextValues.waterPaidDate = this.isLiveBillPaid(details) ? this.getLiveBillDisplayDate(details) : '';
              }
            })
          : Promise.resolve()
      ]);

      const updatedMap = {
        ...this.rentalUtilityBills$.value,
        [house.id]: nextValues
      };
      this.rentalUtilityBills$.next(updatedMap);
      return nextValues;
    } catch (e) {
      console.error('Failed to sync rental utility bills globally:', e);
    }
  }

  private getLiveUtilityAmount(details: any): number {
    const amount = details?.isPaid && details?.paidAmount !== undefined
      ? details.paidAmount
      : details?.totalAmountPayable;
    return Number(amount) || 0;
  }

  private isLiveBillPaid(details: any): boolean {
    return details?.isPaid === true || String(details?.amountLabel || '').toLowerCase().includes('paid');
  }

  private getLiveBillDisplayDate(details: any): string {
    if (!details) return '--';
    return this.isLiveBillPaid(details) ? (details.paidDate || details.dueDate || '--') : (details.dueDate || '--');
  }

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

export function printHraReceipt(house: RentalHouse, bill: RentalBill, landlordName: string) {
  const receiptNo = `R-${bill.year}-${bill.month.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = bill.paidDate ? new Date(bill.paidDate).toLocaleDateString('en-IN') : new Date(bill.billDate).toLocaleDateString('en-IN');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Rent Receipt - ${bill.month} ${bill.year}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
          .receipt-container { max-width: 700px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-title { font-size: 24px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: -0.5px; }
          .logo-sub { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
          .receipt-badge { background: #ecfdf5; color: #047857; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block; }
          .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .section-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .detail-name { font-size: 15px; font-weight: 800; color: #0f172a; }
          .detail-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .invoice-table th { border-bottom: 2px solid #f1f5f9; padding: 12px 8px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; text-align: left; }
          .invoice-table td { padding: 16px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; }
          .invoice-table .amount { text-align: right; }
          .total-row td { border-top: 2px solid #e2e8f0; border-bottom: none; font-size: 16px !important; font-weight: 900 !important; color: #4f46e5; }
          .footer-note { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; line-height: 1.5; }
          .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
          .signature-box { border-top: 1px dashed #cbd5e1; width: 180px; text-align: center; padding-top: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div>
              <div class="logo-title">BillaFinance</div>
              <div class="logo-sub">Rent Receipt</div>
            </div>
            <div style="text-align: right;">
              <span class="receipt-badge">Paid Receipt</span>
              <div class="detail-sub" style="margin-top: 8px; font-weight: 700;">No: ${receiptNo}</div>
              <div class="detail-sub">Date: ${dateStr}</div>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Tenant Details</div>
              <div class="detail-name">${house.renterName}</div>
              <div class="detail-sub">Phone: ${house.renterPhone}</div>
              <div class="detail-sub" style="margin-top: 8px;">Address: ${house.fullAddress || 'N/A'}</div>
            </div>
            <div>
              <div class="section-title">Landlord Details</div>
              <div class="detail-name">${landlordName || 'Property Owner'}</div>
              <div class="detail-sub">PAN: ${house.landlordPan || 'N/A'}</div>
              <div class="detail-sub" style="margin-top: 8px;">Property: ${house.houseName}</div>
            </div>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>House Rent for ${bill.month} ${bill.year}</td>
                <td class="amount">₹${bill.rentAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Electricity Charges (TSPDCL)</td>
                <td class="amount">₹${bill.electricBill.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Water Charges (HMWSSB)</td>
                <td class="amount">₹${bill.waterBill.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="total-row">
                <td>Total Received</td>
                <td class="amount">₹${bill.total.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div style="font-size: 12px; font-style: italic; color: #64748b;">
              *Generated digitally via BillaFinance.
            </div>
            <div>
              <div style="height: 40px;"></div>
              <div class="signature-box">Landlord Signature</div>
            </div>
          </div>

          <div class="footer-note">
            This is a computer-generated document and does not require a physical signature.<br>
            For claiming House Rent Allowance (HRA) under Section 10(13A) of the Income Tax Act.
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
