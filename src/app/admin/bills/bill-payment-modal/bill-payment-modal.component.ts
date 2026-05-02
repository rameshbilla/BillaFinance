import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Bill, BillService } from '../../services/bill.service';

@Component({
  selector: 'app-bill-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md px-0 sm:px-4" (click)="onBackdrop($event)">
      <div class="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-scale-in overflow-hidden" (click)="$event.stopPropagation()">

        <!-- Drag Handle (mobile) -->
        <div class="flex justify-center pt-3 pb-1 sm:hidden">
          <div class="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="px-6 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg" [ngClass]="getServiceBg(bill?.serviceType)">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Record Payment</h3>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{{ bill?.provider || bill?.serviceType }} · #{{ bill?.serviceNumber }}</p>
            </div>
            <button (click)="cancel.emit()" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Bill Amount Reference & History -->
        <div class="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex justify-between items-center">
          <span class="text-[10px] font-black text-amber-600 uppercase tracking-widest">Total Bill Amount</span>
          <span class="text-xl font-black text-amber-700 dark:text-amber-400">₹{{ bill?.amount | number:'1.0-0' }}</span>
        </div>

        <div *ngIf="bill?.payments && bill!.payments!.length > 0" class="mx-6 mt-3 max-h-32 overflow-y-auto space-y-2 no-scrollbar border-b border-gray-100 dark:border-gray-800 pb-3">
          <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Payment History</p>
          <div *ngFor="let p of bill?.payments" class="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
            <div>
              <p class="text-xs font-black text-gray-700 dark:text-gray-300">₹{{ p.amount | number:'1.0-0' }}</p>
              <p class="text-[8px] font-bold text-gray-400 uppercase">{{ p.date | date:'dd MMM yyyy' }} <span *ngIf="p.reference">· {{ p.reference }}</span></p>
            </div>
            <span class="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded font-black uppercase">Paid</span>
          </div>
          <div class="flex justify-between px-2 pt-1 border-t border-gray-200 dark:border-gray-700">
            <span class="text-[10px] font-bold text-gray-500 uppercase">Remaining</span>
            <span class="text-[10px] font-black text-red-500">₹{{ remainingAmount | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="payForm" (ngSubmit)="onSubmit()" class="px-6 pt-4 pb-6 space-y-4">

          <!-- Paid Amount -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Actual Amount Paid</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-black text-lg">₹</span>
              <input type="number" formControlName="paidAmount"
                class="w-full pl-10 pr-4 py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border-none outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white font-black text-lg">
            </div>
          </div>

          <!-- Paid Date -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Payment Date</label>
            <input type="date" formControlName="paidDate"
              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white font-bold [color-scheme:light] dark:[color-scheme:dark]">
          </div>

          <!-- Reference / UPI ID -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Transaction Reference (Optional)</label>
            <input type="text" formControlName="reference" placeholder="UPI Ref / Receipt No / Transaction ID"
              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white font-bold">
          </div>

          <!-- Gmail Search -->
          @if (bill?.serviceNumber) {
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
              <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Find Payment Confirmation</p>
              <p class="text-[10px] text-blue-400 mb-2">Search your Gmail for this bill's payment email, then copy the transaction reference above.</p>
              <button type="button" (click)="openGmail()"
                class="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all active:scale-95">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                Search in Gmail
              </button>
            </div>
          }

          <!-- Notes -->
          <div>
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Notes (Optional)</label>
            <input type="text" formControlName="notes" placeholder="Any additional info..."
              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white font-bold">
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="cancel.emit()"
              class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
            <button type="submit" [disabled]="payForm.invalid || isSaving"
              class="flex-2 flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 active:scale-95">
              {{ isSaving ? 'Saving...' : '✓ Confirm Paid' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class BillPaymentModalComponent implements OnInit, OnChanges {
  @Input() bill?: Bill;
  @Output() paid = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  isSaving = false;
  payForm: FormGroup;
  remainingAmount = 0;

  constructor(private fb: FormBuilder, private billService: BillService) {
    this.payForm = this.fb.group({
      paidAmount: [null, [Validators.required, Validators.min(1)]],
      paidDate: [new Date().toISOString().split('T')[0], Validators.required],
      reference: [''],
      notes: ['']
    });
  }

  ngOnInit() { this.prefill(); }
  ngOnChanges() { this.prefill(); }

  prefill() {
    if (this.bill) {
      const totalPaid = this.bill.totalPaid || this.bill.paidAmount || 0;
      this.remainingAmount = Math.max(0, this.bill.amount - totalPaid);
      this.payForm.patchValue({
        paidAmount: this.remainingAmount,
        paidDate: new Date().toISOString().split('T')[0]
      });
    }
  }

  getServiceBg(type?: string): string {
    const map: Record<string, string> = {
      electricity: 'bg-amber-500',
      mobile: 'bg-blue-500',
      water: 'bg-cyan-500',
      internet: 'bg-indigo-500',
      rent: 'bg-purple-500',
      other: 'bg-gray-500'
    };
    return map[type || 'other'] || 'bg-gray-500';
  }

  openGmail() {
    if (!this.bill) return;
    const url = this.billService.buildGmailSearchUrl(this.bill.serviceNumber, this.bill.provider);
    window.open(url, '_blank');
  }

  onBackdrop(e: Event) { this.cancel.emit(); }

  async onSubmit() {
    if (this.payForm.invalid || !this.bill?.id) return;
    this.isSaving = true;
    const { paidAmount, paidDate, reference, notes } = this.payForm.value;
    try {
      await this.billService.addPaymentRecord(this.bill.id, {
        date: paidDate,
        amount: paidAmount,
        reference: reference || '',
        notes: notes || ''
      });
      this.paid.emit();
    } catch (e) {
      console.error('Payment save failed', e);
    } finally {
      this.isSaving = false;
    }
  }
}
