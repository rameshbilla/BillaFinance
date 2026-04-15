import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterestService, InterestScheme } from '../services/interest.service';
import { ToastService } from '../../shared/toast.service';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

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
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
               <h2 class="text-xl font-extrabold text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">Financial Details</h2>
               
               <div class="space-y-6">
                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme/Loan Title</label>
                     <input type="text" formControlName="name" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('name')?.invalid && schemeForm.get('name')?.touched}" placeholder="e.g. Standard Personal Loan">
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Principal Amount (₹)</label>
                        <input type="number" formControlName="amount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('amount')?.invalid && schemeForm.get('amount')?.touched}" placeholder="100000">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (% per month)</label>
                        <input type="number" step="0.1" formControlName="interestRate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('interestRate')?.invalid && schemeForm.get('interestRate')?.touched}" placeholder="2.0">
                     </div>
                  </div>

                  <!-- Monthly Payable Calculator Display -->
                  <div class="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 flex justify-between items-center mt-6">
                     <div>
                        <p class="text-sm text-blue-800 dark:text-blue-300 font-medium tracking-wide">Monthly Interest Payable</p>
                        <p class="text-xs text-blue-600/70 dark:text-blue-400 mt-1">Amount × (Rate / 100)</p>
                     </div>
                     <div class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        ₹{{ calculatedPayable | number:'1.0-0' }}
                     </div>
                  </div>

                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                     <textarea formControlName="description" rows="3" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Brief details..."></textarea>
                  </div>
               </div>
            </div>

            <!-- Borrower Profile Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
               <h2 class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-700 pb-3 mb-6">Borrower Identity</h2>
               
               <div class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input type="text" formControlName="borrowerName" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerName')?.invalid && schemeForm.get('borrowerName')?.touched}">
                     </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input type="tel" formControlName="borrowerPhone" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerPhone')?.invalid && schemeForm.get('borrowerPhone')?.touched}" placeholder="10 Digits">
                        @if (schemeForm.get('borrowerPhone')?.hasError('pattern') && schemeForm.get('borrowerPhone')?.touched) {
                           <p class="text-xs text-red-500 mt-1">Please enter a valid 10-digit number</p>
                        }
                     </div>
                  </div>

                  <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                     <input type="email" formControlName="borrowerEmail" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" [ngClass]="{'border-red-500': schemeForm.get('borrowerEmail')?.invalid && schemeForm.get('borrowerEmail')?.touched}" placeholder="optional@email.com">
                     @if (schemeForm.get('borrowerEmail')?.hasError('email') && schemeForm.get('borrowerEmail')?.touched) {
                        <p class="text-xs text-red-500 mt-1">Please enter a valid email format</p>
                     }
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
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
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Proof Value / Number</label>
                        <input type="text" formControlName="borrowerIdValue" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter corresponding document number">
                     </div>
                  </div>

                  <div class="mt-4">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload ID Document (Image/PDF)</label>
                     <div class="flex items-center justify-center w-full">
                        <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                           <div class="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg class="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                 <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                              </svg>
                              <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span></p>
                              <p class="text-xs text-gray-400 text-center">{{ selectedFile ? selectedFile.name : 'SVG, PNG, JPG or PDF. Max limits apply.' }}</p>
                           </div>
                           <input id="dropzone-file" type="file" class="hidden" accept="image/*,application/pdf" (change)="onFileSelected($event)" />
                        </label>
                     </div>
                     @if (uploadProgress > 0 && uploadProgress < 100) {
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-3 dark:bg-gray-700">
                           <div class="bg-indigo-600 h-2.5 rounded-full" [style.width.%]="uploadProgress"></div>
                        </div>
                     }
                     @if (isEditMode && currentDocUrl && !selectedFile) {
                        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Current active document: <a [href]="currentDocUrl" target="_blank" class="text-blue-500 hover:underline inline-flex items-center">View Document <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a></p>
                     }
                  </div>
               </div>
            </div>

            <div class="pt-4 flex justify-end space-x-4 sticky bottom-6 z-40 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
               <button type="button" (click)="goBack()" class="px-6 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">Cancel</button>
               <button type="submit" [disabled]="schemeForm.invalid || isSubmitting" class="px-8 py-3 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all hover:-translate-y-0.5">
                  {{ isSubmitting ? 'Saving Data...' : (isEditMode ? 'Save & Update' : 'Finalize & Create Loan') }}
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
  private toast = inject(ToastService);
  private storage = inject(Storage);

  schemeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    borrowerName: ['', Validators.required],
    borrowerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    borrowerEmail: ['', [Validators.email]],
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

  ngOnInit() {
    this.currentSchemeId = this.route.snapshot.paramMap.get('id');
    if (this.currentSchemeId) {
      this.isEditMode = true;
      this.loadSchemeData(this.currentSchemeId);
    }
  }

  loadSchemeData(id: string) {
    this.interestService.getInterestById(id).subscribe({
      next: (scheme) => {
        if (scheme) {
          this.schemeForm.patchValue({
            name: scheme.name,
            borrowerName: scheme.borrowerName,
            borrowerPhone: scheme.borrowerPhone,
            borrowerEmail: scheme.borrowerEmail || '',
            borrowerIdType: scheme.borrowerIdType || '',
            borrowerIdValue: scheme.borrowerIdValue || '',
            amount: scheme.amount,
            interestRate: scheme.interestRate,
            description: scheme.description,
          });
          this.currentDocUrl = scheme.borrowerIdDoc || null;
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
    if (!this.selectedFile) return this.currentDocUrl; // Retain existing if no new file

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
        // Upload the file to Firebase Storage if a new one is selected
        let uploadedDocUrl: string | null = this.currentDocUrl;
        if (this.selectedFile) {
           uploadedDocUrl = await this.uploadDocument();
        }

        const schemeData: InterestScheme = {
          ...this.schemeForm.value,
          borrowerIdDoc: uploadedDocUrl,
          settlements: [] // Base init, handled properly below during edit
        };

        if (this.isEditMode && this.currentSchemeId) {
          // Exclude settlements override during edit
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
