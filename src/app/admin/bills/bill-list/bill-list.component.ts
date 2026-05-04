import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bill } from '../../services/bill.service';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CountUpDirective],
  template: `
    <div class="space-y-6">

      <!-- Sub-tab Bar -->
      <div class="flex p-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl gap-1">
        <button *ngFor="let t of subTabs" (click)="activeSubTab = t.key; onSubTabChange()"
          [class.bg-white]="activeSubTab === t.key" [class.dark:bg-gray-700]="activeSubTab === t.key"
          [class.shadow-md]="activeSubTab === t.key" [class.text-purple-600]="activeSubTab === t.key"
          [class.text-gray-400]="activeSubTab !== t.key"
          class="flex-1 py-2.5 px-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5">
          <span>{{ t.icon }}</span><span class="hidden sm:inline">{{ t.label }}</span>
          <span *ngIf="t.key === 'pending' && pendingBills.length > 0"
            class="px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-black leading-none">{{ pendingBills.length }}</span>
        </button>
      </div>

      <!-- ══ PENDING TAB ══ -->
      <div *ngIf="activeSubTab === 'pending'" class="space-y-6 animate-fade-up">

        <!-- Overdue Alert Banner -->
        <div *ngIf="overdueBills.length > 0"
          class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50 animate-pulse-glow">
          <div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-black text-red-700 dark:text-red-400">{{ overdueBills.length }} Bill{{ overdueBills.length > 1 ? 's' : '' }} Overdue!</p>
            <p class="text-[10px] text-red-500 font-bold">Total: <span [appCountUp]="overdueTotal" prefix="₹"></span> — Pay immediately</p>
          </div>
        </div>

        <!-- Due Today -->
        <div *ngIf="dueTodayBills.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <p class="text-[10px] font-black text-orange-500 uppercase tracking-widest">Due Today</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ng-container *ngFor="let bill of dueTodayBills">
              <ng-container *ngTemplateOutlet="billCard; context:{bill, urgent: true}"></ng-container>
            </ng-container>
          </div>
        </div>

        <!-- Overdue Section -->
        <div *ngIf="overdueBills.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-red-500"></div>
            <p class="text-[10px] font-black text-red-500 uppercase tracking-widest">Overdue</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ng-container *ngFor="let bill of overdueBills">
              <ng-container *ngTemplateOutlet="billCard; context:{bill, urgent: true}"></ng-container>
            </ng-container>
          </div>
        </div>

        <!-- Upcoming / Other Pending -->
        <div *ngIf="upcomingBills.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-2 h-2 rounded-full bg-amber-400"></div>
            <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest">Upcoming Pending</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ng-container *ngFor="let bill of upcomingBills">
              <ng-container *ngTemplateOutlet="billCard; context:{bill, urgent: false}"></ng-container>
            </ng-container>
          </div>
        </div>

        <div *ngIf="pendingBills.length === 0" class="py-20 text-center">
          <div class="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
            <svg class="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="font-black text-gray-900 dark:text-white">All Clear!</p>
          <p class="text-sm text-gray-400 mt-1">No pending bills. Great job! 🎉</p>
        </div>
      </div>

      <!-- ══ HISTORY TAB ══ -->
      <div *ngIf="activeSubTab === 'history'" class="space-y-6 animate-fade-up">

        <!-- Filters -->
        <div class="flex gap-3 flex-wrap">
          <select [(ngModel)]="historyYear" (ngModelChange)="filterHistory()"
            class="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm font-black text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer">
            <option *ngFor="let y of yearOptions" [value]="y">{{ y }}</option>
          </select>
          <select [(ngModel)]="historyMonth" (ngModelChange)="filterHistory()"
            class="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm font-black text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer">
            <option value="">All Months</option>
            <option *ngFor="let m of monthNames" [value]="m">{{ m }}</option>
          </select>
          <div class="flex-1 min-w-[120px] bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2.5 rounded-xl border border-green-100 dark:border-green-800/30">
            <p class="text-[9px] font-black text-green-600 uppercase tracking-widest">Total Paid</p>
            <p class="text-base font-black text-green-700 dark:text-green-400" [appCountUp]="historyTotal" prefix="₹"></p>
          </div>
        </div>

        <!-- Paid Bills List -->
        <div class="space-y-3">
          <div *ngFor="let bill of filteredHistory; let i = index"
            class="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-fade-up hover:shadow-md transition-all"
            [style.animation-delay]="(i * 60) + 'ms'">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" [ngClass]="getServiceBg(bill.serviceType)">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p class="font-black text-gray-900 dark:text-white capitalize">{{ bill.serviceType }}</p>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ bill.provider }} · #{{ bill.serviceNumber }}</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-black text-green-600 dark:text-green-400" [appCountUp]="bill.paidAmount || bill.amount" prefix="₹"></p>
                <span class="text-[9px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-black uppercase">Paid</span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              <div>
                <p class="text-gray-400 font-bold uppercase tracking-widest">Paid On</p>
                <p class="font-black text-gray-700 dark:text-gray-300">{{ (bill.paidDate || bill.dueDate) | date:'dd MMM yyyy' }}</p>
              </div>
              <div>
                <p class="text-gray-400 font-bold uppercase tracking-widest">Bill Period</p>
                <p class="font-black text-gray-700 dark:text-gray-300">{{ bill.month }}, {{ bill.year }}</p>
              </div>
              <div *ngIf="bill.paidReference" class="col-span-2 sm:col-span-1">
                <p class="text-gray-400 font-bold uppercase tracking-widest">Reference</p>
                <p class="font-black text-indigo-600 dark:text-indigo-400 truncate">{{ bill.paidReference }}</p>
              </div>
            </div>
          </div>
          <div *ngIf="filteredHistory.length === 0" class="py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
            <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No paid bills for this period</p>
          </div>
        </div>
      </div>

      <!-- ══ ANALYTICS TAB ══ -->
      <div *ngIf="activeSubTab === 'analytics'" class="space-y-6 animate-fade-up">

        <!-- Year + Type Filters -->
        <div class="flex gap-3 flex-wrap items-center">
          <select [(ngModel)]="analyticsYear" (ngModelChange)="computeAnalytics()"
            class="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-sm font-black text-gray-700 dark:text-gray-300 outline-none appearance-none cursor-pointer">
            <option *ngFor="let y of yearOptions" [value]="y">{{ y }}</option>
          </select>
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Spend · {{ analyticsYear }}</span>
        </div>

        <!-- Bar Chart (CSS-based) -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="flex items-end gap-2 h-40 px-2">
            <div *ngFor="let bar of analyticsBars; let i = index" class="flex-1 flex flex-col items-center gap-1">
              <span *ngIf="bar.amount > 0" class="text-[8px] font-black text-purple-600" [appCountUp]="bar.amount" prefix="₹"></span>
              <div class="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                [style.height.px]="bar.height"
                [ngClass]="bar.amount > 0 ? 'bg-gradient-to-t from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/20' : 'bg-gray-100 dark:bg-gray-700'">
                <div *ngIf="bar.amount > 0" class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmerSlide_2s_ease_infinite]"></div>
              </div>
              <span class="text-[8px] font-bold text-gray-400">{{ bar.label }}</span>
            </div>
          </div>
        </div>

        <!-- Service Breakdown -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Breakdown by Service Type · {{ analyticsYear }}</p>
          <div class="space-y-3">
            <div *ngFor="let s of serviceBreakdown" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0" [ngClass]="getServiceBg(s.type)">{{ s.type[0].toUpperCase() }}</div>
              <div class="flex-1">
                <div class="flex justify-between mb-1">
                  <span class="text-xs font-black text-gray-700 dark:text-gray-300 capitalize">{{ s.type }}</span>
                  <span class="text-xs font-black text-purple-600" [appCountUp]="s.total" prefix="₹"></span>
                </div>
                <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700" [ngClass]="getServiceBg(s.type)" [style.width.%]="s.pct"></div>
                </div>
              </div>
              <span class="text-[10px] font-black text-gray-400">{{ s.count }}</span>
            </div>
            <div *ngIf="serviceBreakdown.length === 0" class="py-8 text-center">
              <p class="text-xs text-gray-400 font-bold">No paid bills in {{ analyticsYear }}</p>
            </div>
          </div>
        </div>

        <!-- Year Summary KPIs -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
            <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Total Paid ({{ analyticsYear }})</p>
            <p class="text-xl font-black text-purple-700 dark:text-purple-300" [appCountUp]="yearTotalPaid" prefix="₹"></p>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Bills Paid ({{ analyticsYear }})</p>
            <p class="text-xl font-black text-blue-700 dark:text-blue-300" [appCountUp]="yearBillCount"></p>
          </div>
        </div>
      </div>

    </div>

    <!-- Bill Card Template -->
    <ng-template #billCard let-bill="bill" let-urgent="urgent">
      <div class="bg-white dark:bg-gray-800 rounded-3xl border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
        [ngClass]="urgent ? 'border-red-100 dark:border-red-800/30' : 'border-gray-100 dark:border-gray-700'">
        <div class="h-1" [ngClass]="{
          'bg-red-500': bill.status === 'overdue',
          'bg-orange-400': bill.status === 'pending' && isDueToday(bill),
          'bg-amber-400': bill.status === 'pending' && !isDueToday(bill),
          'bg-green-500': bill.status === 'completed'
        }"></div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" [ngClass]="getServiceBg(bill.serviceType)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <p class="font-black text-gray-900 dark:text-white capitalize text-sm leading-tight">{{ bill.serviceType }}</p>
                <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ bill.provider || 'N/A' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-black text-gray-900 dark:text-white" [appCountUp]="bill.amount" prefix="₹"></p>
              <p class="text-[9px] font-black" [ngClass]="{'text-red-500': bill.status === 'overdue', 'text-orange-500': isDueToday(bill), 'text-amber-500': !isDueToday(bill) && bill.status === 'pending', 'text-green-500': bill.status === 'completed'}">
                {{ bill.status === 'overdue' ? 'OVERDUE' : bill.status === 'completed' ? 'PAID' : isDueToday(bill) ? 'DUE TODAY' : 'PENDING' }}
              </p>
            </div>
          </div>
          <div class="flex justify-between items-center text-[9px] text-gray-400 font-bold mb-3">
            <span>Due: {{ bill.dueDate | date:'dd MMM yyyy' }}</span>
            <span>#{{ bill.serviceNumber }}</span>
          </div>
          
          <div *ngIf="bill.totalPaid && bill.totalPaid > 0 && bill.totalPaid < bill.amount" class="mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl">
            <div class="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1">
              <span class="text-green-500">Paid: <span [appCountUp]="bill.totalPaid" prefix="₹"></span></span>
              <span class="text-red-500">Left: <span [appCountUp]="bill.amount - bill.totalPaid" prefix="₹"></span></span>
            </div>
            <div class="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-green-500 transition-all duration-500" [style.width.%]="(bill.totalPaid / bill.amount) * 100"></div>
            </div>
          </div>

          <div class="flex gap-2">
            <button *ngIf="bill.status !== 'completed'" (click)="onPayNow(bill)"
              class="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-green-500/20 hover:shadow-green-500/40 active:scale-95 transition-all">
              ✓ Pay Now
            </button>
            <button (click)="onEdit(bill)" class="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button (click)="onDelete(bill)" class="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `
})
export class BillListComponent implements OnChanges {
  @Input() bills: Bill[] = [];
  @Output() editBill = new EventEmitter<Bill>();
  @Output() deleteBill = new EventEmitter<Bill>();
  @Output() payBill = new EventEmitter<Bill>();
  @Output() filterChanged = new EventEmitter<any>();
  @Output() updateStatus = new EventEmitter<{bill: Bill, status: string}>();

  activeSubTab: 'pending' | 'history' | 'analytics' = 'pending';
  subTabs: { key: 'pending' | 'history' | 'analytics'; label: string; icon: string }[] = [
    { key: 'pending', label: 'Pending', icon: '🔔' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  yearOptions: number[] = [];

  // Pending
  pendingBills: Bill[] = [];
  overdueBills: Bill[] = [];
  dueTodayBills: Bill[] = [];
  upcomingBills: Bill[] = [];
  overdueTotal = 0;

  // History
  historyYear: number = new Date().getFullYear();
  historyMonth = '';
  filteredHistory: Bill[] = [];
  historyTotal = 0;

  // Analytics
  analyticsYear: number = new Date().getFullYear();
  analyticsBars: { label: string; amount: number; height: number }[] = [];
  serviceBreakdown: { type: string; total: number; count: number; pct: number }[] = [];
  yearTotalPaid = 0;
  yearBillCount = 0;

  ngOnChanges(changes: SimpleChanges) {
    const yr = new Date().getFullYear();
    this.yearOptions = [yr, yr - 1, yr - 2, yr - 3].filter(y => y > 2020);
    this.categorizePending();
    this.filterHistory();
    this.computeAnalytics();
  }

  onSubTabChange() {
    this.categorizePending();
    this.filterHistory();
    this.computeAnalytics();
  }

  today(): string { return new Date().toISOString().split('T')[0]; }
  isDueToday(bill: Bill): boolean { return bill.dueDate === this.today(); }

  categorizePending() {
    const todayStr = this.today();
    this.pendingBills = this.bills.filter(b => b.status === 'pending' || b.status === 'overdue');
    this.overdueBills = this.bills.filter(b => b.status === 'overdue' || (b.status === 'pending' && b.dueDate < todayStr));
    this.dueTodayBills = this.bills.filter(b => b.status === 'pending' && b.dueDate === todayStr);
    this.upcomingBills = this.bills.filter(b => b.status === 'pending' && b.dueDate > todayStr);
    this.overdueTotal = this.overdueBills.reduce((s, b) => s + b.amount, 0);
  }

  filterHistory() {
    let h = this.bills.filter(b => b.status === 'completed' && b.year === Number(this.historyYear));
    if (this.historyMonth) h = h.filter(b => b.month === this.historyMonth);
    h.sort((a, b) => (b.paidDate || b.dueDate).localeCompare(a.paidDate || a.dueDate));
    this.filteredHistory = h;
    this.historyTotal = h.reduce((s, b) => s + (b.paidAmount || b.amount), 0);
  }

  computeAnalytics() {
    const yr = Number(this.analyticsYear);
    const paid = this.bills.filter(b => b.status === 'completed' && b.year === yr);
    this.yearTotalPaid = paid.reduce((s, b) => s + (b.paidAmount || b.amount), 0);
    this.yearBillCount = paid.length;

    const byMonth = new Array(12).fill(0);
    paid.forEach(b => { const m = this.monthNames.indexOf(b.month); if (m >= 0) byMonth[m] += (b.paidAmount || b.amount); });
    const maxVal = Math.max(...byMonth, 1);
    this.analyticsBars = byMonth.map((amt, i) => ({
      label: this.monthNames[i].slice(0, 3),
      amount: amt,
      height: Math.max(4, Math.round((amt / maxVal) * 120))
    }));

    const svcMap: Record<string, { total: number; count: number }> = {};
    paid.forEach(b => {
      if (!svcMap[b.serviceType]) svcMap[b.serviceType] = { total: 0, count: 0 };
      svcMap[b.serviceType].total += (b.paidAmount || b.amount);
      svcMap[b.serviceType].count++;
    });
    const grandTotal = Object.values(svcMap).reduce((s, v) => s + v.total, 0) || 1;
    this.serviceBreakdown = Object.entries(svcMap)
      .map(([type, v]) => ({ type, total: v.total, count: v.count, pct: Math.round((v.total / grandTotal) * 100) }))
      .sort((a, b) => b.total - a.total);
  }

  getServiceBg(type?: string): string {
    const map: Record<string, string> = {
      electricity: 'bg-amber-500', mobile: 'bg-blue-500', water: 'bg-cyan-500',
      internet: 'bg-indigo-500', rent: 'bg-purple-500', other: 'bg-gray-500'
    };
    return map[type || 'other'] || 'bg-gray-500';
  }

  onPayNow(bill: Bill) { this.payBill.emit(bill); }
  onEdit(bill: Bill) { this.editBill.emit(bill); }
  onDelete(bill: Bill) { if (confirm('Delete this bill?')) this.deleteBill.emit(bill); }
}
