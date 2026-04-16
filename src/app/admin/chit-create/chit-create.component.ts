import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { ToastService } from '../../shared/toast.service';
import { Subscription } from 'rxjs';
import { numberToWords } from '../../shared/utils/number-to-words.util';

@Component({
  selector: 'app-admin-chit-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditMode ? 'Edit' : 'Create New' }} Chitti Scheme</h1>
        </div>
      </nav>

      <main class="max-w-3xl mx-auto px-4 py-8">
         <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
            <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Scheme Details</h2>
            
            <form [formGroup]="schemeForm" (ngSubmit)="onSubmit()" class="space-y-6">
               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme Name</label>
                  <input type="text" formControlName="name" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="e.g. Diwali Gold Saver 24M">
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Tenure (Months)</label>
                     <input type="number" formControlName="tenure" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="24">
                  </div>
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Payable (₹)</label>
                     <input type="number" formControlName="monthlyAmount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow" placeholder="5000">
                     <p class="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-medium italic">{{ amountToWords(schemeForm.get('monthlyAmount')?.value) }}</p>
                  </div>
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
               <div class="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 flex justify-between items-center mt-6">
                  <div>
                     <p class="text-sm text-purple-800 dark:text-purple-300 font-medium tracking-wide">Total Payable Value</p>
                     <p class="text-xs text-purple-600/70 dark:text-purple-400 mt-1">Tenure × Monthly Amount</p>
                  </div>
                  <div class="text-right">
                     <div class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        ₹{{ calculatedTotal | number:'1.0-0' }}
                     </div>
                     <p class="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-bold italic">{{ amountToWords(calculatedTotal) }}</p>
                  </div>
               </div>

               <div class="pt-4 flex justify-end space-x-4">
                  <button type="button" (click)="goBack()" class="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" [disabled]="schemeForm.invalid || isSubmitting" class="px-8 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5">
                     {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Scheme' : 'Submit Scheme') }}
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
  private toast = inject(ToastService);

  schemeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    tenure: ['', [Validators.required, Validators.min(1)]],
    monthlyAmount: ['', [Validators.required, Validators.min(100)]],
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
      const schemeData: ChittiScheme = {
        ...this.schemeForm.value,
        totalValue: this.calculatedTotal
      };

      try {
        if (this.isEditMode && this.currentSchemeId) {
          await this.chittiService.updateChitti(this.currentSchemeId, schemeData);
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
