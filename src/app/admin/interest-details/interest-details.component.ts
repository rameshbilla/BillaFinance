import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterestService, InterestScheme, Settlement, InterestCollection } from '../services/interest.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-admin-interest-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
      <style>
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .history-step { position: relative; padding-left: 3.5rem; }
        .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
        .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
      </style>

      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center space-x-4">
          <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none uppercase tracking-tighter">{{ scheme?.name }}</h1>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (scheme) {
          <div class="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-[2rem] shadow-xl p-6 mb-8 text-white relative overflow-hidden transition-all">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div class="relative z-10 flex justify-between items-center">
              <div>
                <p class="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Borrower Identity</p>
                <h2 class="text-2xl sm:text-3xl font-black leading-tight tracking-tighter">{{ scheme.borrowerName }}</h2>
                <div class="flex items-center gap-4 mt-2">
                  <p class="text-indigo-100 flex items-center text-sm font-medium">
                    <svg class="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    {{ scheme.borrowerPhone }}
                  </p>
                  @if (scheme.interestRate) {
                    <span class="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">{{ scheme.interestRate }}% ROI</span>
                  }
                </div>
              </div>
              <div class="hidden sm:block">
                <div class="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <svg class="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="flex p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl mb-8 w-full sm:w-fit gap-1 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              (click)="activeHistoryTab = 'overview'"
              [class.bg-white]="activeHistoryTab === 'overview'"
              [class.shadow-md]="activeHistoryTab === 'overview'"
              [class.text-blue-600]="activeHistoryTab === 'overview'"
              [class.text-gray-500]="activeHistoryTab !== 'overview'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">
              Overview
            </button>
            <button
              (click)="activeHistoryTab = 'interest'"
              [class.bg-white]="activeHistoryTab === 'interest'"
              [class.shadow-md]="activeHistoryTab === 'interest'"
              [class.text-blue-600]="activeHistoryTab === 'interest'"
              [class.text-gray-500]="activeHistoryTab !== 'interest'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">
              Interest
            </button>
            <button
              (click)="activeHistoryTab = 'settlements'"
              [class.bg-white]="activeHistoryTab === 'settlements'"
              [class.shadow-md]="activeHistoryTab === 'settlements'"
              [class.text-blue-600]="activeHistoryTab === 'settlements'"
              [class.text-gray-500]="activeHistoryTab !== 'settlements'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all">
              Settlements
            </button>
          </div>

          <div class="space-y-8">
            @if (activeHistoryTab === 'overview') {
              <div class="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Principal Amount</p>
                  <p class="text-2xl font-black text-gray-900 dark:text-white">&#8377;{{ scheme.amount | number:'1.0-0' }}</p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm text-right">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Installment Start</p>
                  <p class="text-base font-black text-blue-600 dark:text-blue-400">{{ scheme.startDate || '--' }}</p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-green-100 dark:border-green-900/20 shadow-sm">
                  <p class="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Paid Principal</p>
                  <p class="text-2xl font-black text-green-700 dark:text-green-300">&#8377;{{ totalSettled | number:'1.0-0' }}</p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-red-100 dark:border-red-900/20 shadow-sm text-right">
                  <p class="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Balance Due</p>
                  <p class="text-2xl font-black text-red-700 dark:text-red-400">&#8377;{{ currentBalance | number:'1.0-0' }}</p>
                </div>

                <div class="col-span-2 bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 shadow-sm">
                  <div class="flex items-end justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total Interest Collected</p>
                      <p class="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300 leading-none">&#8377;{{ totalInterestCollected | number:'1.0-0' }}</p>
                    </div>
                    <p class="text-[11px] font-bold text-indigo-400 text-right">Recorded across all collections</p>
                  </div>
                </div>

                <div class="col-span-2 bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                  <div class="absolute -right-6 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
                  <div class="relative z-10 flex items-end justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-1">Overall Pending Amount</p>
                      <p class="text-2xl sm:text-3xl font-black leading-none">&#8377;{{ totalPendingInterest | number:'1.0-0' }}</p>
                    </div>
                    <p class="text-[11px] font-bold text-orange-100 text-right">Interest due till today</p>
                  </div>
                </div>
              </div>
            }

            @if (activeHistoryTab === 'interest') {
              <div class="animate-in fade-in slide-in-from-right-4 duration-500">
                <div class="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-xl border border-indigo-100 dark:border-indigo-900/20 mb-8">
                  <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">Collect Interest</h3>
                  <form [formGroup]="collectionForm" (ngSubmit)="onCollectionSubmit()" class="space-y-4">
                    <div class="grid grid-cols-2 gap-3 items-stretch">
                      <div class="min-w-0">
                        <label class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 px-1 block">Amount to Collect</label>
                        <input type="number" formControlName="amount" class="w-full px-4 py-3.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-black text-indigo-600 dark:text-indigo-400 min-w-0" placeholder="0">
                        <p class="text-[9px] font-bold text-indigo-400/60 mt-1 px-1">Expected: ₹{{ pendingInterest | number:'1.0-0' }}</p>
                      </div>
                      <div class="min-w-0">
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Collection Date</label>
                        <input type="date" formControlName="date" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-black text-gray-700 dark:text-gray-300 min-w-0">
                      </div>
                    </div>
                    <button type="submit" [disabled]="collectionForm.invalid" class="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all disabled:opacity-50">
                      Save Collection
                    </button>
                  </form>
                </div>

                <div class="space-y-8 relative">
                  <h4 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Interest History</h4>
                  @for (collection of sortLatest(scheme.interestCollections || []); track collection.id || $index; let i = $index) {
                    <div class="history-step group">
                      @if (i < (scheme.interestCollections || []).length - 1) {
                        <div class="stepper-line bg-green-500/30 transition-colors"></div>
                      }

                      <div class="stepper-dot w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 z-10">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>

                      <div class="bg-white dark:bg-gray-800 p-3 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-green-200">
                        <div class="flex justify-between items-start gap-4">
                          <div class="min-w-0">
                            <p class="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Step {{ (scheme.interestCollections || []).length - i }}</p>
                            <p class="text-base font-black text-gray-900 dark:text-white leading-tight">{{ collection.date | date:'longDate' }}</p>
                          </div>
                          <div class="text-right shrink-0">
                            <p class="text-xl font-black text-gray-900 dark:text-white">&#8377;{{ collection.amount | number:'1.0-0' }}</p>
                            <button (click)="deleteCollection(collection.id!)" class="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (activeHistoryTab === 'settlements') {
              <div class="space-y-8 relative animate-in fade-in slide-in-from-right-4 duration-500">
                @if (currentBalance > 0) {
                  <div class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-[2rem] shadow-xl border border-blue-100 dark:border-blue-900/20 relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div class="relative z-10">
                      <h3 class="text-xl font-black text-gray-900 dark:text-white mb-5 flex items-center">
                        <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 text-sm shadow-lg">&#8377;</span>
                        Make a Settlement
                      </h3>
                      <form [formGroup]="settlementForm" (ngSubmit)="onSettlementSubmit()" class="space-y-5">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount (Principal)</label>
                            <input type="number" formControlName="amount" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black" placeholder="Enter amount">
                          </div>
                          <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Payment Date</label>
                            <input type="date" formControlName="date" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black text-gray-700 dark:text-gray-300">
                          </div>
                        </div>
                        <button type="submit" [disabled]="settlementForm.invalid" class="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50">
                          Release Principal
                        </button>
                      </form>
                    </div>
                  </div>
                }

                <h4 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Principal Release History</h4>
                @for (settlement of sortLatest(scheme.settlements || []); track settlement.id || $index; let i = $index) {
                  <div class="history-step group">
                    @if (i < (scheme.settlements.length || 0) - 1) {
                      <div class="stepper-line bg-blue-500/30 transition-colors"></div>
                    }

                    <div class="stepper-dot w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 z-10 transition-transform group-hover:scale-110">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>

                    <div class="bg-white dark:bg-gray-800 p-3 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                      <div class="flex justify-between items-start gap-4">
                        <div class="min-w-0">
                          <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Step {{ (scheme.settlements.length || 0) - i }}</p>
                          <p class="text-sm text-gray-400 mt-1 font-medium">{{ settlement.date | date:'longDate' }}</p>
                        </div>
                        <div class="text-right shrink-0">
                          <p class="text-xl font-black text-gray-900 dark:text-white">&#8377;{{ settlement.amount | number:'1.0-0' }}</p>
                          <button (click)="deleteSettlement(settlement.id!)" class="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center py-20 opacity-30">
            <svg class="w-20 h-20 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xl font-black">Connecting to database...</p>
          </div>
        }
      </main>
    </div>
  `
})
export class AdminInterestDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interestService = inject(InterestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  scheme: InterestScheme | null = null;
  activeHistoryTab: 'overview' | 'interest' | 'settlements' = 'overview';

  settlementForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(100)]],
    date: [new Date().toISOString().split('T')[0], Validators.required]
  });

  collectionForm: FormGroup = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.interestService.getInterestById(id).subscribe(data => {
        this.scheme = data;
        if (this.scheme) {
          this.collectionForm.patchValue({ amount: this.pendingInterest });
        }
      });
    }
  }

  get totalSettled(): number {
    return (this.scheme?.settlements || []).reduce((sum, settlement) => sum + settlement.amount, 0);
  }

  get totalInterestCollected(): number {
    return (this.scheme?.interestCollections || []).reduce((sum, collection) => sum + collection.amount, 0);
  }

  get currentBalance(): number {
    if (!this.scheme) return 0;
    return Math.max(0, this.scheme.amount - this.totalSettled);
  }

  get pendingInterest(): number {
    if (!this.scheme) return 0;
    return this.currentBalance * (this.scheme.interestRate / 100);
  }

  get totalPendingInterest(): number {
    if (!this.scheme?.startDate) return 0;

    const today = this.getLocalToday();
    const accruedInterest = this.getAccruedInterestThrough(today);
    const collectedInterest = this.getCollectedInterestThrough(today);
    return Math.max(0, accruedInterest - collectedInterest);
  }

  sortLatest(list: any[] | undefined) {
    if (!list) return [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getLocalToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private parseLocalDate(value: string | undefined | null): Date | null {
    if (!value) return null;

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }

  private getSettledAmountThrough(date: Date): number {
    return (this.scheme?.settlements || []).reduce((sum, settlement) => {
      const settlementDate = this.parseLocalDate(settlement.date);
      if (!settlementDate || settlementDate.getTime() > date.getTime()) {
        return sum;
      }
      return sum + settlement.amount;
    }, 0);
  }

  private getCollectedInterestThrough(date: Date): number {
    return (this.scheme?.interestCollections || []).reduce((sum, collection) => {
      const collectionDate = this.parseLocalDate(collection.date);
      if (!collectionDate || collectionDate.getTime() > date.getTime()) {
        return sum;
      }
      return sum + collection.amount;
    }, 0);
  }

  private getAccruedInterestThrough(date: Date): number {
    if (!this.scheme?.startDate) return 0;

    const startDate = this.parseLocalDate(this.scheme.startDate);
    if (!startDate) return 0;

    let totalDue = 0;
    let cycleIndex = 1;

    while (true) {
      const cycleStart = this.addMonthsClamped(startDate, cycleIndex - 1);
      const cycleDueDate = this.addMonthsClamped(startDate, cycleIndex);

      if (cycleStart.getTime() > date.getTime()) {
        break;
      }

      const balanceAtCycleStart = Math.max(0, this.scheme.amount - this.getSettledAmountThrough(cycleStart));
      totalDue += balanceAtCycleStart * (this.scheme.interestRate / 100);
      cycleIndex += 1;
    }

    return totalDue;
  }

  async onSettlementSubmit() {
    if (this.settlementForm.valid && this.scheme?.id) {
      const value = this.settlementForm.value;
      if (value.amount > this.currentBalance) {
        this.toast.warning('Amount exceeds balance.');
        return;
      }

      const newSettlement: Settlement = {
        id: 'S' + Date.now(),
        ...value
      };

      const settlements = [...(this.scheme.settlements || []), newSettlement];
      await this.interestService.updateInterest(this.scheme.id, { settlements });
      this.toast.success('Settlement saved.');
      this.settlementForm.reset({ amount: null, date: new Date().toISOString().split('T')[0] });
    }
  }

  async onCollectionSubmit() {
    if (this.collectionForm.valid && this.scheme?.id) {
      const value = this.collectionForm.value;
      const newCollection: InterestCollection = {
        id: 'IC' + Date.now(),
        amount: value.amount,
        date: value.date
      };

      const interestCollections = [...(this.scheme.interestCollections || []), newCollection];
      await this.interestService.updateInterest(this.scheme.id, { interestCollections });
      this.toast.success('Interest collection saved.');
      this.collectionForm.reset({ amount: this.pendingInterest, date: new Date().toISOString().split('T')[0] });
    }
  }

  async deleteCollection(id: string) {
    if (confirm('Delete this collection?') && this.scheme?.id) {
      const interestCollections = (this.scheme.interestCollections || []).filter(collection => collection.id !== id);
      await this.interestService.updateInterest(this.scheme.id, { interestCollections });
      this.toast.success('Deleted.');
    }
  }

  async deleteSettlement(id: string) {
    if (confirm('Delete this settlement?') && this.scheme?.id) {
      const settlements = (this.scheme.settlements || []).filter(settlement => settlement.id !== id);
      await this.interestService.updateInterest(this.scheme.id, { settlements });
      this.toast.success('Deleted.');
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
