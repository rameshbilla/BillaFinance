import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterestService, InterestScheme, Settlement } from '../services/interest.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-admin-interest-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">Loan Details: {{ scheme?.name }}</h1>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        @if (scheme) {
          <!-- Action Banner -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <p class="text-blue-100 text-sm font-medium mb-1">Borrower</p>
              <h2 class="text-3xl font-extrabold">{{ scheme.borrowerName }}</h2>
              <p class="text-indigo-200 mt-1 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                {{ scheme.borrowerPhone }}
              </p>
            </div>
            <div class="mt-6 md:mt-0 flex space-x-3">
               <button (click)="printStatement()" class="px-6 py-3 bg-indigo-500/20 text-white border border-indigo-400/30 rounded-xl font-medium hover:bg-indigo-500/30 transition-all">
                 <svg class="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                 Print Statement
               </button>
               <button (click)="openSettlementModal()" class="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all shadow-md">
                 + Make Settlement
               </button>
            </div>
          </div>

          <!-- Borrower Identity Info -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8" *ngIf="scheme.borrowerIdType">
             <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                   <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 3"></path></svg>
                   </div>
                   <div>
                      <p class="text-xs text-gray-500 font-medium">Identity Verification ({{ scheme.borrowerIdType }})</p>
                      <p class="text-lg font-bold text-gray-900 dark:text-white">{{ scheme.borrowerIdValue || 'No ID Number Provided' }}</p>
                   </div>
                </div>
                <div *ngIf="scheme.borrowerIdDoc">
                   <a [href]="scheme.borrowerIdDoc" target="_blank" class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">
                      <span>View Uploaded Document</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
                </div>
             </div>
          </div>

          <!-- Financial Snapshot -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Original Principal</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{{ scheme.amount | number:'1.0-0' }}</p>
             </div>
             <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm">
                <p class="text-sm text-green-600 dark:text-green-400 font-medium">Total Settled</p>
                <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">₹{{ totalSettled | number:'1.0-0' }}</p>
             </div>
             <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm">
                <p class="text-sm text-red-600 dark:text-red-400 font-medium">Current Balance</p>
                <p class="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">₹{{ currentBalance | number:'1.0-0' }}</p>
             </div>
             <div class="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                <p class="text-sm text-gray-300 font-medium relative z-10">Current Monthly Interest ({{ scheme.interestRate }}%)</p>
                <p class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mt-2 relative z-10">₹{{ currentMonthlyInterest | number:'1.0-0' }}</p>
             </div>
          </div>

          <!-- Settlement History Table -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                 <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 Settlement History
              </h3>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th class="px-6 py-4 font-medium">Date</th>
                    <th class="px-6 py-4 font-medium">Settled Amount</th>
                    <th class="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  @for (settlement of scheme.settlements; track settlement.id || $index) {
                    <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ settlement.date }}</td>
                      <td class="px-6 py-4 text-green-600 dark:text-green-400 font-bold">+ ₹{{ settlement.amount | number:'1.0-0' }}</td>
                      <td class="px-6 py-4 text-right space-x-3 text-sm font-medium">
                        <button (click)="openSettlementModal(settlement)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Edit</button>
                        <button (click)="deleteSettlement(settlement.id!)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                  }
                  @if (!scheme.settlements || scheme.settlements.length === 0) {
                    <tr>
                      <td colspan="3" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No settlements made yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </main>

      <!-- Settlement Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ isEditModal ? 'Edit Settlement' : 'Make Partial Settlement' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form [formGroup]="settlementForm" (ngSubmit)="saveSettlement()" class="p-6 space-y-4">
              <div>
                 <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-900/50">
                    Current Balance: <strong class="font-bold">₹{{ currentBalance | number:'1.0-0' }}</strong>
                 </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Settlement Date</label>
                <input type="date" formControlName="date" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount to Settle (₹)</label>
                <input type="number" formControlName="amount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 5000">
                @if (settlementForm.get('amount')?.hasError('max')) {
                   <p class="text-red-500 text-xs mt-1">Cannot settle more than current balance!</p>
                }
              </div>

              <div class="pt-4 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" class="px-5 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" [disabled]="settlementForm.invalid || isSaving" class="px-5 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors text-sm">
                  {{ isSaving ? 'Processing...' : 'Settle Amount' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminInterestDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interestService = inject(InterestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  schemeId: string | null = null;
  scheme: InterestScheme | null = null;

  showModal = false;
  isSaving = false;
  isEditModal = false;
  editingSettlementId: string | null = null;

  settlementForm: FormGroup = this.fb.group({
    date: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]]
  });

  get totalSettled(): number {
     if (!this.scheme?.settlements) return 0;
     return this.scheme.settlements.reduce((sum, s) => sum + s.amount, 0);
  }

  get currentBalance(): number {
     if (!this.scheme) return 0;
     return Math.max(0, this.scheme.amount - this.totalSettled);
  }

  get currentMonthlyInterest(): number {
     if (!this.scheme) return 0;
     return this.currentBalance * (this.scheme.interestRate / 100);
  }

  ngOnInit() {
    this.schemeId = this.route.snapshot.paramMap.get('id');
    if (this.schemeId) {
      this.loadScheme();
    }
  }

  loadScheme() {
    this.interestService.getInterestById(this.schemeId!).subscribe(data => {
      this.scheme = data;
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  printStatement() {
    window.print();
  }

  openSettlementModal(settlement?: Settlement) {
    if (settlement) {
      this.isEditModal = true;
      this.editingSettlementId = settlement.id || null;
      this.settlementForm.reset({
        date: settlement.date,
        amount: settlement.amount
      });
      // The max validation for an edit should include its own amount to the current balance
      const maxAllowed = this.currentBalance + settlement.amount;
      this.settlementForm.get('amount')?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(maxAllowed)
      ]);
    } else {
      this.isEditModal = false;
      this.editingSettlementId = null;
      this.settlementForm.reset({ 
        date: new Date().toISOString().split('T')[0], 
        amount: '' 
      });
      // Set dynamic max validation based on strictly current remaining balance
      this.settlementForm.get('amount')?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.currentBalance)
      ]);
    }
    
    this.settlementForm.get('amount')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveSettlement() {
    if (this.settlementForm.valid && this.schemeId && this.scheme) {
      this.isSaving = true;
      
      const currentSettlements = this.scheme.settlements || [];
      let updatedSettlements: Settlement[];

      if (this.isEditModal && this.editingSettlementId) {
         updatedSettlements = currentSettlements.map(s => {
            if (s.id === this.editingSettlementId) {
               return { ...s, date: this.settlementForm.value.date, amount: this.settlementForm.value.amount };
            }
            return s;
         });
      } else {
         const newSettlement: Settlement = {
           date: this.settlementForm.value.date,
           amount: this.settlementForm.value.amount,
           id: Date.now().toString()
         };
         updatedSettlements = [...currentSettlements, newSettlement];
      }

      const updatedScheme: Partial<InterestScheme> = {
        settlements: updatedSettlements
      };

      try {
        await this.interestService.updateInterest(this.schemeId, updatedScheme);
        this.toast.success(this.isEditModal ? 'Settlement updated successfully!' : 'Settlement processed successfully!');
        this.closeModal();
      } catch (error) {
        console.error('Error saving settlement', error);
        this.toast.error('Failed to process settlement.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteSettlement(id: string) {
    if (confirm('Are you sure you want to delete this settlement record? Your balance will increase.')) {
       if (this.schemeId && this.scheme && this.scheme.settlements) {
          const updatedSettlements = this.scheme.settlements.filter(s => s.id !== id);
          
          try {
             await this.interestService.updateInterest(this.schemeId, {
                settlements: updatedSettlements
             });
             this.toast.success('Settlement record deleted.');
          } catch (error) {
             console.error('Error deleting settlement', error);
             this.toast.error('Failed to delete settlement.');
          }
       }
    }
  }
}
