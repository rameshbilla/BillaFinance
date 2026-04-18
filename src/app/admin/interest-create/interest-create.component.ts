import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { InterestService, InterestScheme } from '../services/interest.service';
import { CustomerService, Customer } from '../services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { numberToWords } from '../../shared/utils/number-to-words.util';

@Component({
  selector: 'app-admin-interest-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEditMode ? 'Edit' : 'Create New' }} Interest Scheme</h1>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto px-4 py-8">
         <form [formGroup]="schemeForm" (ngSubmit)="onSubmit()" class="space-y-8">
            
            <!-- Scheme Financials Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
               <h2 class="text-xl font-extrabold text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">Financial Details</h2>
               
               <div class="space-y-6">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme/Loan Title</label>
                        <input type="text" formControlName="name" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('name')?.invalid && schemeForm.get('name')?.touched}" placeholder="e.g. Standard Personal Loan">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Start Date</label>
                        <input type="date" formControlName="startDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('startDate')?.invalid && schemeForm.get('startDate')?.touched}">
                     </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Principal Amount (₹)</label>
                        <input type="number" formControlName="amount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('amount')?.invalid && schemeForm.get('amount')?.touched}" placeholder="100000">
                         <p class="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium italic leading-none">{{ amountToWords(schemeForm.get('amount')?.value) }}</p>
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (% per month)</label>
                        <input type="number" step="0.1" formControlName="interestRate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('interestRate')?.invalid && schemeForm.get('interestRate')?.touched}" placeholder="2.0">
                     </div>
                  </div>

                  <!-- Monthly Payable Calculator Display -->
                  <div class="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                     <div>
                        <p class="text-sm text-blue-800 dark:text-blue-300 font-medium tracking-wide">Monthly Interest Payable</p>
                        <p class="text-xs text-blue-600/70 dark:text-blue-400 mt-1 leading-none">Amount × (Rate / 100)</p>
                     </div>
                     <div class="text-left sm:text-right">
                        <div class="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                           ₹{{ calculatedPayable | number:'1.0-0' }}
                        </div>
                        <p class="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-bold italic">{{ amountToWords(calculatedPayable) }}</p>
                     </div>
                  </div>

                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                     <textarea formControlName="description" rows="3" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Brief details..."></textarea>
                  </div>
               </div>
            </div>

            <!-- Borrower Profile Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-8">
               <h2 class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">Borrower Identity</h2>

               <!-- Existing Borrower Picker -->
               <div class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                 <p class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 leading-none">Quick Fill from Existing</p>
                 <div class="relative mb-3">
                   <input type="text" [formControl]="searchControl"
                     placeholder="Search customer..."
                     class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                   <svg class="absolute left-3 top-3 h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                 </div>
                 @if (searchControl.value?.trim()) {
                   <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                     @for (cust of filteredBorrowers; track cust.phone) {
                       <button type="button" (click)="selectExistingBorrower(cust)"
                         class="w-full text-left p-3 rounded-xl border border-white dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group">
                         <div class="flex justify-between items-center">
                           <div>
                             <p class="font-black text-sm text-gray-900 dark:text-white group-hover:text-indigo-700">{{ cust.name }}</p>
                             <p class="text-[10px] text-gray-400 font-bold">{{ cust.phone }}{{ cust.username ? ' · @' + cust.username : '' }}</p>
                           </div>
                           <span class="text-[10px] text-indigo-500 font-black px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">Fill →</span>
                         </div>
                       </button>
                     }
                     @if (filteredBorrowers.length === 0) {
                       <p class="text-xs text-center text-gray-400 py-6">No matching customers found.</p>
                     }
                   </div>
                 } @else {
                   <p class="text-[10px] text-indigo-400/70 font-bold uppercase tracking-wide">Start typing to search...</p>
                 }
               </div>

               <!-- Login Provision Field (NEW) -->
                <div class="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                   <div class="flex items-center justify-between mb-4">
                      <label class="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                         <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                         Login Provision
                      </label>
                      @if (isCheckingUsername) {
                         <div class="flex items-center text-[10px] font-bold text-slate-400 uppercase">
                            <svg class="animate-spin h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Verifying...
                         </div>
                      } @else if (usernameStatus === 'valid') {
                         <div class="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg uppercase flex items-center">
                            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            Access Ready
                         </div>
                      } @else if (usernameStatus === 'invalid') {
                         <div class="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg uppercase flex items-center">
                            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                            No Account Found
                         </div>
                      }
                   </div>
                   <div class="flex gap-2">
                     <div class="relative flex-1">
                       <span class="absolute left-4 top-3.5 text-slate-400 font-bold text-lg">&#64;</span>
                       <input type="text" formControlName="borrowerUsername" (input)="onUsernameInput()"
                          class="block w-full rounded-2xl border-none bg-white dark:bg-gray-800 pl-10 pr-4 py-3.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm transition-all font-black placeholder:font-medium"
                          placeholder="username">
                     </div>
                     <button type="button" (click)="provisionUser()" *ngIf="usernameStatus === 'invalid' && schemeForm.get('borrowerUsername')?.value"
                        class="px-4 py-3 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2">
                        Provision
                     </button>
                   </div>
                   <p class="text-[10px] text-slate-400 mt-2 font-medium px-1">Customer can use this username to login and view their loan statements.</p>
                </div>
               
               <div class="space-y-6">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input type="text" formControlName="borrowerName" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerName')?.invalid && schemeForm.get('borrowerName')?.touched}">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input type="tel" formControlName="borrowerPhone" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerPhone')?.invalid && schemeForm.get('borrowerPhone')?.touched}" placeholder="10 Digits">
                        @if (schemeForm.get('borrowerPhone')?.hasError('pattern') && schemeForm.get('borrowerPhone')?.touched) {
                           <p class="text-[10px] text-red-500 mt-1 font-bold uppercase">Valid 10-digit number required</p>
                        }
                     </div>
                  </div>

                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                     <input type="email" formControlName="borrowerEmail" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerEmail')?.invalid && schemeForm.get('borrowerEmail')?.touched}" placeholder="optional@email.com">
                     @if (schemeForm.get('borrowerEmail')?.hasError('email') && schemeForm.get('borrowerEmail')?.touched) {
                        <p class="text-[10px] text-red-500 mt-1 font-bold uppercase">Invalid email format</p>
                     }
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Proof Type</label>
                        <select formControlName="borrowerIdType" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                           <option value="">Select ID Type...</option>
                           <option value="Aadhar">Aadhar Card</option>
                           <option value="PAN">PAN Card</option>
                           <option value="Voter">Voter ID</option>
                           <option value="Driving License">Driving License</option>
                         </select>
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                        <input type="text" formControlName="borrowerIdValue" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter ID number">
                     </div>
                  </div>

                  <div class="mt-4">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Document (Image/PDF)</label>
                     <div class="flex items-center justify-center w-full">
                        <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                           <div class="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg class="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                 <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                              </svg>
                              <p class="mb-2 text-sm text-gray-500 dark:text-gray-400 px-4 text-center"><span class="font-bold">Click to upload</span></p>
                              <p class="text-[10px] text-gray-400 text-center uppercase font-bold tracking-tight px-4 truncate w-full">{{ selectedFile ? selectedFile.name : 'Max 5MB • JPG, PNG, PDF' }}</p>
                           </div>
                           <input id="dropzone-file" type="file" class="hidden" accept="image/*,application/pdf" (change)="onFileSelected($event)" />
                        </label>
                     </div>
                     @if (uploadProgress > 0 && uploadProgress < 100) {
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-3 dark:bg-gray-700">
                           <div class="bg-indigo-600 h-1.5 rounded-full" [style.width.%]="uploadProgress"></div>
                        </div>
                     }
                     @if (isEditMode && currentDocUrl && !selectedFile) {
                        <p class="mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                           <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                           Existing Document: <a [href]="currentDocUrl" target="_blank" class="text-blue-500 hover:underline">View <svg class="w-3 h-3 inline pb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                        </p>
                     }
                  </div>
               </div>
            </div>

            <div class="pt-4 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-6 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
               <button type="button" (click)="goBack()" class="px-8 py-3 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors order-2 sm:order-1">Cancel</button>
               <button type="submit" [disabled]="schemeForm.invalid || isSubmitting" class="px-10 py-3 font-black text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5 order-1 sm:order-2">
                  {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Save & Update' : 'Finalize & Create Loan') }}
               </button>
            </div>
         </form>
      </main>
    </div>
  `
})
export class AdminInterestCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private storage = inject(Storage);

  private chittiCustomers: Customer[] = [];
  private interestBorrowers: { name: string; phone: string; email: string; username?: string }[] = [];

  searchControl = new FormControl('');
  
  // Username check states
  isCheckingUsername = false;
  usernameStatus: 'none' | 'valid' | 'invalid' = 'none';

  get borrowerPool(): { name: string; phone: string; email: string; username?: string }[] {
    const seen = new Set<string>();
    const result: { name: string; phone: string; email: string; username?: string }[] = [];

    for (const c of this.chittiCustomers) {
      if (c.phone && !seen.has(c.phone)) {
        seen.add(c.phone);
        result.push({ 
          name: c.name || 'Unknown', 
          phone: c.phone, 
          email: c.email || '', 
          username: c.username 
        });
      }
    }
    for (const b of this.interestBorrowers) {
      if (b.phone && !seen.has(b.phone)) {
        seen.add(b.phone);
        result.push(b);
      }
    }
    return result;
  }

  get filteredBorrowers(): { name: string; phone: string; email: string; username?: string }[] {
    const searchVal = this.searchControl.value;
    if (!searchVal || !searchVal.trim()) return [];

    const q = searchVal.toLowerCase();
    return this.borrowerPool
      .filter(p =>
        p?.name?.toLowerCase().includes(q) ||
        p?.phone?.toLowerCase().includes(q) ||
        (p?.username && p?.username?.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }

  selectExistingBorrower(person: any) {
    this.schemeForm.patchValue({
      borrowerName: person.name,
      borrowerPhone: person.phone,
      borrowerEmail: person.email || '',
      borrowerUsername: person.username || ''
    });
    this.searchControl.setValue('');
    if (person.username) {
       this.checkUsername(person.username);
    }
  }

  schemeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    startDate: [new Date().toISOString().split('T')[0], Validators.required],
    borrowerName: ['', Validators.required],
    borrowerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    borrowerEmail: ['', [Validators.email]],
    borrowerUsername: [''],
    borrowerIdType: [''],
    borrowerIdValue: [''],
    amount: ['', [Validators.required, Validators.min(1000)]],
    interestRate: ['', [Validators.required, Validators.min(0)]],
    description: ['']
  });

  isEditMode = false;
  currentSchemeId: string | null = null;
  isSubmitting = false;

  selectedFile: File | null = null;
  uploadProgress: number = 0;
  currentDocUrl: string | null = null;

  get calculatedPayable(): number {
    const amt = this.schemeForm.get('amount')?.value || 0;
    const rate = this.schemeForm.get('interestRate')?.value || 0;
    return amt * (rate / 100);
  }

  amountToWords(amount: number): string {
    return numberToWords(amount);
  }

  private usernameTimeout: any;
  onUsernameInput() {
     const username = this.schemeForm.get('borrowerUsername')?.value;
     if (!username) {
        this.usernameStatus = 'none';
        return;
     }

     clearTimeout(this.usernameTimeout);
     this.usernameTimeout = setTimeout(() => {
        this.checkUsername(username);
     }, 600);
  }

  async checkUsername(username: string) {
     this.isCheckingUsername = true;
     try {
        const exists = await this.authService.checkUserExists(username);
        this.usernameStatus = exists ? 'valid' : 'invalid';
     } catch (e) {
        this.usernameStatus = 'none';
     } finally {
        this.isCheckingUsername = false;
     }
  }

  async provisionUser() {
     const username = this.schemeForm.get('borrowerUsername')?.value;
     const name = this.schemeForm.get('borrowerName')?.value;
     const phone = this.schemeForm.get('borrowerPhone')?.value;

     if (!username || !name || !phone) {
        this.toast.warning('Please fill Name, Phone and Username first.');
        return;
     }

     try {
        this.isCheckingUsername = true;
        await this.authService.provisionCustomer(username, name, phone);
        this.toast.success(`Login provisioned for @${username}`);
        this.usernameStatus = 'valid';
     } catch (e) {
        this.toast.error('Failed to provision login.');
     } finally {
        this.isCheckingUsername = false;
     }
  }

  ngOnInit() {
    this.currentSchemeId = this.route.snapshot.paramMap.get('id');
    if (this.currentSchemeId) {
      this.isEditMode = true;
      this.loadSchemeData(this.currentSchemeId);
    }
    this.customerService.getAllCustomers().subscribe(data => {
      this.chittiCustomers = data;
    });
    this.interestService.getInterests().subscribe(schemes => {
      this.interestBorrowers = schemes
        .filter(s => !!s.borrowerPhone)
        .map(s => ({
          name: s.borrowerName || '',
          phone: s.borrowerPhone || '',
          email: s.borrowerEmail || '',
          username: (s as any).borrowerUsername || ''
        }));
    });
  }

  loadSchemeData(id: string) {
    this.interestService.getInterestById(id).subscribe({
      next: (scheme) => {
        if (scheme) {
          this.schemeForm.patchValue({
            name: scheme.name,
            startDate: scheme.startDate || '',
            borrowerName: scheme.borrowerName,
            borrowerPhone: scheme.borrowerPhone,
            borrowerEmail: scheme.borrowerEmail || '',
            borrowerUsername: (scheme as any).borrowerUsername || '',
            borrowerIdType: scheme.borrowerIdType || '',
            borrowerIdValue: scheme.borrowerIdValue || '',
            amount: scheme.amount,
            interestRate: scheme.interestRate,
            description: scheme.description,
          });
          this.currentDocUrl = scheme.borrowerIdDoc || null;
          if ((scheme as any).borrowerUsername) {
             this.checkUsername((scheme as any).borrowerUsername);
          }
        }
      },
      error: (error) => console.error('Error loading scheme', error)
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  async uploadDocument(): Promise<string | null> {
    if (!this.selectedFile) return this.currentDocUrl;

    return new Promise((resolve, reject) => {
      const fileName = `interest-documents/${Date.now()}_${this.selectedFile!.name}`;
      const storageRef = ref(this.storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, this.selectedFile!);

      uploadTask.on('state_changed',
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error('Upload failed', error);
          this.toast.error('File upload failed.');
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  async onSubmit() {
    if (this.schemeForm.valid) {
      this.isSubmitting = true;

      try {
        let uploadedDocUrl: string | null = this.currentDocUrl;
        if (this.selectedFile) {
          uploadedDocUrl = await this.uploadDocument();
        }

        const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
        const schemeData: InterestScheme = {
          ...this.schemeForm.value,
          borrowerIdDoc: uploadedDocUrl,
          settlements: [],
          createdBy: profile?.uid
        };

        if (this.isEditMode && this.currentSchemeId) {
          const { settlements, ...updateData } = schemeData;
          await this.interestService.updateInterest(this.currentSchemeId, updateData);
          this.toast.success('Interest Scheme updated!');
        } else {
          await this.interestService.addInterest(schemeData);
          this.toast.success('Interest Scheme created successfully!');
        }
        this.router.navigate(['/admin']);
      } catch (error) {
        console.error('Error saving scheme', error);
        this.toast.error('Failed to prepare scheme. Check your connection.');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.toast.warning('Please complete all correctly formatted required fields.');
    }
  }
}
