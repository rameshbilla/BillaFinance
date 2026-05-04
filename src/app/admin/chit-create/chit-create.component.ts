import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { numberToWords } from '../../shared/utils/number-to-words.util';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-admin-chit-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CountUpDirective],
  template: `
    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      <!-- Background decorative glows -->
      <div class="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4 animate-fade-down">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditMode ? 'Edit' : 'Create New' }} Chitti Scheme</h1>
        </div>
      </nav>

      <main class="max-w-3xl mx-auto px-4 py-8 animate-fade-up delay-100 relative z-10">
         <!-- Form header banner -->
         <div class="mb-6 p-5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-[2rem] text-white shadow-xl shadow-purple-500/20 animate-fade-up delay-50 relative overflow-hidden">
           <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow"></div>
           <p class="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{{ isEditMode ? 'Modify' : 'New' }} Scheme</p>
           <h2 class="text-2xl font-black tracking-tighter">{{ isEditMode ? 'Edit Chitti Scheme' : 'Create Chitti Scheme' }}</h2>
           <p class="text-[11px] opacity-70 mt-1">Fill in scheme details below. Total value is auto-calculated.</p>
         </div>
         <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
            <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Scheme Details</h2>
            
            <form [formGroup]="schemeForm" (ngSubmit)="onSubmit()" class="space-y-6">
               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme Name</label>
                  <input type="text" formControlName="name" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="e.g. Diwali Gold Saver 24M">
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Tenure (Months)</label>
                     <input type="number" formControlName="tenure" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="24">
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Payable (₹)</label>
                     <input type="number" formControlName="monthlyAmount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="5000">
                     <p class="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-medium italic">{{ amountToWords(schemeForm.get('monthlyAmount')?.value) }}</p>
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Capacity (Members)</label>
                     <input type="number" formControlName="capacity" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="20">
                  </div>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                     <input type="date" formControlName="startDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('startDate')?.invalid && schemeForm.get('startDate')?.touched}">
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Auto-calculated)</label>
                     <input type="date" formControlName="endDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-4 py-3 text-gray-600 dark:text-gray-400 outline-none transition-shadow cursor-not-allowed" readonly>
                  </div>
               </div>

               <!-- Total Payable Value Calculator Display -->
               <div class="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 animate-pulse-glow hover:scale-[1.01] transition-transform duration-300">
                  <div>
                     <p class="text-sm text-purple-800 dark:text-purple-300 font-medium tracking-wide">Total Payable Value</p>
                     <p class="text-xs text-purple-600/70 dark:text-purple-400 mt-1 leading-none">Tenure × Monthly Amount</p>
                  </div>
                  <div class="text-left sm:text-right">
                     <div class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 kpi-number" [appCountUp]="calculatedTotal" prefix="₹">
                     </div>
                     <p class="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-bold italic">{{ amountToWords(calculatedTotal) }}</p>
                  </div>
               </div>

               <div class="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                  <button type="button" (click)="goBack()" class="px-8 py-3 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all order-2 sm:order-1 active:scale-95">Cancel</button>
                  <button type="submit" [disabled]="schemeForm.invalid || isSubmitting" class="shimmer-hover px-10 py-3 font-black text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 rounded-xl shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40 order-1 sm:order-2 active:scale-95">
                     {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Scheme' : 'Finalize & Create') }}
                  </button>
               </div>
            </form>
         </div>
      </main>
    </div>
  `
})
export class AdminChitCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chittiService = inject(ChittiService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  schemeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    tenure: ['', [Validators.required, Validators.min(1)]],
    monthlyAmount: ['', [Validators.required, Validators.min(100)]],
    capacity: [20, [Validators.required, Validators.min(1)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required]
  });

  isEditMode = false;
  currentSchemeId: string | null = null;
  isSubmitting = false;

  get calculatedTotal(): number {
    const tenure = this.schemeForm.get('tenure')?.value || 0;
    const monthlyAmt = this.schemeForm.get('monthlyAmount')?.value || 0;
    return tenure * monthlyAmt;
  }

  amountToWords(amount: number): string {
    return numberToWords(amount);
  }

  ngOnInit() {
    this.currentSchemeId = this.route.snapshot.paramMap.get('id');
    if (this.currentSchemeId) {
      this.isEditMode = true;
      this.loadSchemeData(this.currentSchemeId);
    }
    
    // Auto-calculate end date
    this.schemeForm.valueChanges.subscribe(val => {
       if (val.startDate && val.tenure) {
          const start = new Date(val.startDate);
          start.setMonth(start.getMonth() + val.tenure);
          const formattedEnd = start.toISOString().split('T')[0];
          if (this.schemeForm.get('endDate')?.value !== formattedEnd) {
             this.schemeForm.patchValue({ endDate: formattedEnd }, { emitEvent: false });
          }
       }
    });
  }

  loadSchemeData(id: string) {
    this.chittiService.getChittiById(id).subscribe({
      next: (scheme) => {
        if (scheme) {
          this.schemeForm.patchValue({
            name: scheme.name,
            tenure: scheme.tenure,
            monthlyAmount: scheme.monthlyAmount,
            capacity: scheme.capacity || 20,
            startDate: scheme.startDate,
            endDate: scheme.endDate
          });
        }
      },
      error: (error) => console.error('Error loading scheme', error)
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  async onSubmit() {
    if (this.schemeForm.valid) {
      this.isSubmitting = true;
      const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
      const schemeData: ChittiScheme = {
        ...this.schemeForm.value,
        totalValue: this.calculatedTotal,
        createdBy: profile?.uid
      };

      try {
        if (this.isEditMode && this.currentSchemeId) {
          const { createdBy, ...updateData } = schemeData;
          await this.chittiService.updateChitti(this.currentSchemeId, updateData);
          this.toast.success('Chit Scheme successfully updated!');
        } else {
          await this.chittiService.addChitti(schemeData);
          this.toast.success('Chit Scheme successfully created!');
        }
        this.router.navigate(['/admin']);
      } catch (error) {
        console.error('Error saving scheme', error);
        this.toast.error('Failed to save scheme. Please check your connection.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
