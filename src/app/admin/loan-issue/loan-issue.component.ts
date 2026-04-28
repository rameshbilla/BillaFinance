import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-admin-loan-issue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4 animate-fade-down">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-pink-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">Issue Loan to Customer</h1>
        </div>
      </nav>

      <main class="max-w-3xl mx-auto px-4 py-8 animate-fade-up delay-100">
         <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Loan Parameter Setup</h2>
            
            <form [formGroup]="loanForm" (ngSubmit)="onSubmit()" class="space-y-6">
               
               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Identifier (Email / ID)</label>
                  <input type="text" formControlName="customerInfo" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" placeholder="e.g. rahul@finserve.com">
               </div>

               <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="md:col-span-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Amount (₹)</label>
                     <input type="number" formControlName="principal" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" placeholder="100000">
                  </div>
                  <div class="md:col-span-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
                     <input type="number" formControlName="interestRate" step="0.1" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" placeholder="12.5">
                  </div>
                  <div class="md:col-span-1">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenure (Months)</label>
                     <input type="number" formControlName="tenure" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" placeholder="12">
                  </div>
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Start Date</label>
                     <input type="date" formControlName="startDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow">
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First EMI Date</label>
                     <input type="date" formControlName="firstEmiDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow">
                  </div>
               </div>

               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Collect Interest Amount (₹)</label>
                  <div class="flex items-center space-x-3">
                     <input type="number" formControlName="collectInterestAmount" class="flex-1 block rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none transition-shadow" placeholder="0">
                     <button type="button" (click)="autoFillInterestAmount()" class="px-4 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors whitespace-nowrap">Use Calculated</button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Default: ₹{{ totalInterest | number:'1.0-0' }}</p>
               </div>

               <!-- EMI Breakdown Visualizer -->
               <div class="mt-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-inner">
                  <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Repayment Forecast</h3>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
                     <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Calculated EMI / Mo</p>
                        <p class="text-2xl font-bold text-pink-600">₹{{ calculatedEMI | number:'1.0-0' }}</p>
                     </div>
                     <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Interest</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">₹{{ totalInterest | number:'1.0-0' }}</p>
                     </div>
                     <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Payable</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">₹{{ totalPayable | number:'1.0-0' }}</p>
                     </div>
                  </div>
               </div>

               <div class="pt-6 flex justify-end space-x-4">
                  <button type="button" (click)="goBack()" class="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" [disabled]="loanForm.invalid" class="px-8 py-3 font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5">Issue Loan</button>
               </div>
            </form>
         </div>
      </main>
    </div>
  `
})
export class AdminLoanIssueComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  loanForm: FormGroup = this.fb.group({
    customerInfo: ['', Validators.required],
    principal: ['', [Validators.required, Validators.min(1000)]],
    interestRate: ['', [Validators.required, Validators.min(0)]],
    tenure: ['', [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    firstEmiDate: ['', Validators.required],
    collectInterestAmount: ['', [Validators.required, Validators.min(0)]]
  });

  // Basic flat EMI calculation mapping for Interest based standard loans
  get calculatedEMI(): number {
    const p = this.loanForm.get('principal')?.value || 0;
    const r = (this.loanForm.get('interestRate')?.value || 0) / (12 * 100);
    const n = this.loanForm.get('tenure')?.value || 0;
    
    if (p === 0 || n === 0) return 0;
    if (r === 0) return p / n;
    
    // E = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  }

  get totalPayable(): number {
     const n = this.loanForm.get('tenure')?.value || 0;
     const emi = this.calculatedEMI;
     return n * emi;
  }

  get totalInterest(): number {
     const p = this.loanForm.get('principal')?.value || 0;
     return this.totalPayable - p;
  }

  autoFillInterestAmount() {
    this.loanForm.get('collectInterestAmount')?.setValue(Math.round(this.totalInterest));
  }

  ngOnInit() {
    // Auto-update collectInterestAmount when form values change (debounced)
    this.loanForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.loanForm.get('collectInterestAmount')?.value) {
          this.autoFillInterestAmount();
        }
      });
    
    // Set initial default value
    this.autoFillInterestAmount();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  onSubmit() {
    if (this.loanForm.valid) {
      console.log('Loan Issued:', this.loanForm.value);
      alert('Loan officially issued with EMI generated!');
      this.router.navigate(['/admin']);
    }
  }
}
