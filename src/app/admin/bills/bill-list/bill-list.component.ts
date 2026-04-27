import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bill } from '../../services/bill.service';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[150px]">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Status</label>
          <select [(ngModel)]="filters.status" (change)="onFilterChange()"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-gray-700 dark:text-gray-300 appearance-none">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div class="flex-1 min-w-[150px]">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Service Type</label>
          <select [(ngModel)]="filters.serviceType" (change)="onFilterChange()"
                  class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-gray-700 dark:text-gray-300 appearance-none">
            <option value="">All Services</option>
            <option value="electricity">Electricity</option>
            <option value="mobile">Mobile</option>
            <option value="water">Water</option>
            <option value="internet">Internet</option>
            <option value="rent">Rent</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="flex-shrink-0">
          <button (click)="resetFilters()" class="px-4 py-2.5 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-purple-600 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <!-- Bill Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (bill of bills; track bill.id) {
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-all">
            <div class="h-1.5" [ngClass]="{
              'bg-amber-400': bill.status === 'pending',
              'bg-green-500': bill.status === 'completed',
              'bg-red-500': bill.status === 'overdue'
            }"></div>
            <div class="p-5">
              <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    @switch (bill.serviceType) {
                      @case ('electricity') { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> }
                      @case ('mobile') { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> }
                      @case ('water') { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m10-4a3 3 0 11-6 0 3 3 0 016 0z"/></svg> }
                      @case ('internet') { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.05 9.05 0 0112.142 0M2.472 9.015a15.194 15.194 0 0119.056 0"/></svg> }
                      @case ('rent') { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> }
                      @default { <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> }
                    }
                  </div>
                  <div>
                    <h4 class="font-black text-gray-900 dark:text-white capitalize leading-tight">{{ bill.serviceType }}</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ bill.provider || 'N/A' }} @if(bill.serviceNumber) { · {{ bill.serviceNumber }} }</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-gray-900 dark:text-white">₹{{ bill.amount | number:'1.0-0' }}</p>
                  <p class="text-[10px] font-bold" [ngClass]="{
                    'text-amber-500': bill.status === 'pending',
                    'text-green-500': bill.status === 'completed',
                    'text-red-500': bill.status === 'overdue'
                  }">{{ bill.status | uppercase }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-2xl">
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Due Date</p>
                  <p class="text-xs font-black text-gray-700 dark:text-gray-300">{{ bill.dueDate | date:'mediumDate' }}</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-2xl">
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Period</p>
                  <p class="text-xs font-black text-gray-700 dark:text-gray-300">{{ bill.month }}, {{ bill.year }}</p>
                </div>
              </div>

              @if (bill.notes) {
                <p class="text-[11px] text-gray-500 italic mb-4 line-clamp-2">"{{ bill.notes }}"</p>
              }

              <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                <div class="flex gap-1">
                  @if (bill.status !== 'completed') {
                    <button (click)="onUpdateStatus(bill, 'completed')" class="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-100 transition-colors">Mark Paid</button>
                  }
                </div>
                <div class="flex gap-2">
                  <button (click)="onEdit(bill)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                  <button (click)="onDelete(bill)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              </div>
            </div>
          </div>
        }
        @if (bills.length === 0) {
          <div class="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] opacity-50">
            <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No bills found</p>
          </div>
        }
      </div>
    </div>
  `
})
export class BillListComponent {
  @Input() bills: Bill[] = [];
  @Output() filterChanged = new EventEmitter<any>();
  @Output() editBill = new EventEmitter<Bill>();
  @Output() deleteBill = new EventEmitter<Bill>();
  @Output() updateStatus = new EventEmitter<{bill: Bill, status: string}>();

  filters = {
    status: '',
    serviceType: ''
  };

  onFilterChange() {
    this.filterChanged.emit(this.filters);
  }

  resetFilters() {
    this.filters = { status: '', serviceType: '' };
    this.onFilterChange();
  }

  onEdit(bill: Bill) {
    this.editBill.emit(bill);
  }

  onDelete(bill: Bill) {
    if (confirm('Are you sure you want to delete this bill?')) {
      this.deleteBill.emit(bill);
    }
  }

  onUpdateStatus(bill: Bill, status: string) {
    this.updateStatus.emit({ bill, status });
  }
}
