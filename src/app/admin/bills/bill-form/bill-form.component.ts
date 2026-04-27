import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Bill } from '../../services/bill.service';

@Component({
  selector: 'app-bill-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ isEdit ? 'Update' : 'Create' }} Bill</h2>
        <button (click)="cancel.emit()" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form [formGroup]="billForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Type</label>
            <select formControlName="serviceType"
                    class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold appearance-none">
              <option value="electricity">Electricity</option>
              <option value="mobile">Mobile</option>
              <option value="water">Water</option>
              <option value="internet">Internet</option>
              <option value="rent">Rent</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Provider (Optional)</label>
            <input type="text" formControlName="provider" placeholder="e.g. TSSPDCL, Airtel"
                   class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Number (Unique ID)</label>
            <input type="text" formControlName="serviceNumber" placeholder="e.g. USCNO, Consumer ID"
                   class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount</label>
            <div class="relative">
              <span class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input type="number" formControlName="amount" placeholder="0.00"
                     class="w-full pl-10 pr-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-black">
            </div>
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Due Date</label>
            <input type="date" formControlName="dueDate"
                   class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Status</label>
            <div class="flex gap-4">
              @for (stat of ['pending', 'completed', 'overdue']; track stat) {
                <button type="button" (click)="billForm.patchValue({status: stat})"
                        [class.bg-purple-600]="billForm.value.status === stat"
                        [class.text-white]="billForm.value.status === stat"
                        [class.bg-gray-100]="billForm.value.status !== stat"
                        [class.dark:bg-gray-800]="billForm.value.status !== stat"
                        class="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  {{ stat }}
                </button>
              }
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Notes</label>
            <textarea formControlName="notes" rows="3" placeholder="Additional details..."
                      class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold resize-none"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-4 pt-4">
          <button type="button" (click)="cancel.emit()"
                  class="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
            Cancel
          </button>
          <button type="submit" [disabled]="billForm.invalid"
                  class="px-10 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 transition-all disabled:opacity-50">
            {{ isEdit ? 'Update Bill' : 'Add Bill' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class BillFormComponent implements OnInit {
  @Input() bill?: Bill;
  @Output() save = new EventEmitter<Partial<Bill>>();
  @Output() cancel = new EventEmitter<void>();

  billForm: FormGroup;
  isEdit = false;

  constructor(private fb: FormBuilder) {
    this.billForm = this.fb.group({
      serviceType: ['electricity', Validators.required],
      provider: [''],
      serviceNumber: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      dueDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['pending', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    if (this.bill) {
      this.isEdit = true;
      this.billForm.patchValue({
        serviceType: this.bill.serviceType,
        provider: this.bill.provider,
        serviceNumber: this.bill.serviceNumber,
        amount: this.bill.amount,
        dueDate: this.bill.dueDate,
        status: this.bill.status,
        notes: this.bill.notes
      });
    }
  }

  onSubmit() {
    if (this.billForm.valid) {
      this.save.emit(this.billForm.value);
    }
  }
}
