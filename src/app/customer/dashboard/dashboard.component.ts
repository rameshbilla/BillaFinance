import { Component, inject, OnInit } from '@angular/core';
import { RecaptchaVerifier } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { Observable, map, of, switchMap } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <!-- Top Navigation -->
      <nav class="bg-gradient-to-r from-purple-800 to-indigo-900 sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-white">FinServe</span>
            </div>
             <div class="flex space-x-2 items-center" *ngIf="authService.userProfile$ | async as profile">
               <span class="text-purple-200 text-sm font-medium hidden sm:block">Welcome, {{ profile.displayName || 'Customer' }}</span>
               <button (click)="showProfileModal = true" class="p-2 text-purple-200 hover:bg-white/10 rounded-lg transition-colors" title="Settings">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>
               <button (click)="logout()" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-medium border border-white/10 backdrop-blur-sm">Log out</button>
             </div>
            <div class="flex space-x-4 items-center" *ngIf="!(authService.userProfile$ | async)">
               <span class="text-purple-200 text-sm font-medium hidden sm:block">Welcome, Customer</span>
               <button (click)="logout()" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-medium border border-white/10 backdrop-blur-sm">Log out</button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" *ngIf="profile$ | async as profile">
        
        <!-- Total Balance Card -->
        <div class="bg-gradient-to-br from-purple-600 to-pink-500 rounded-[2rem] p-6 sm:p-8 shadow-xl mb-8 text-white relative overflow-hidden">
           <div class="absolute top-0 right-0 p-12 opacity-10">
              <svg class="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.11-1.36-3.11-3.09h2.38c0 1.04 1.15 1.51 2.05 1.51 1.48 0 2.22-.72 2.22-1.63 0-2.31-4.78-1.22-4.78-4.73 0-1.54 1.19-2.61 2.91-2.94V5.1h2.67v1.93c1.68.32 2.76 1.43 2.85 2.89h-2.32c-.11-.84-.96-1.35-1.91-1.35-1.07 0-2.14.54-2.14 1.5 0 2.23 4.78 1.16 4.78 4.79 0 1.83-1.42 2.87-2.93 3.23z"/></svg>
           </div>
           
           <div class="relative z-10">
              <p class="text-purple-100 font-medium tracking-wide">Net Outstanding Dues</p>
              <h2 class="text-3xl sm:text-5xl font-extrabold mt-2 mb-4">₹{{ totalDues$ | async | number:'1.0-0' }}</h2>
              <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                   <button class="px-6 py-2.5 bg-white text-purple-700 rounded-xl font-bold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm">Customer Support</button>
                   <button (click)="showProfileModal = true" class="px-6 py-2.5 bg-white/20 border border-white/30 text-white rounded-xl font-bold hover:bg-white/30 transition-all text-sm backdrop-blur-sm">Change Password</button>
               </div>
           </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- My Chit Schemes -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">My Chit Schemes</h3>
            <div class="space-y-4">
                <div *ngFor="let record of chitRecords$ | async" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                   <div class="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-l-2xl"></div>
                   <div class="flex justify-between items-start">
                      <div>
                         <h4 class="font-bold text-gray-900 dark:text-white text-lg">{{ record.scheme.name }}</h4>
                         <p class="text-gray-500 text-sm mt-1">₹{{ record.scheme.monthlyAmount }}/mo • Valued at ₹{{ record.scheme.totalValue }}</p>
                         <p class="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Joined: {{ record.customer.joinedDate }}</p>
                      </div>
                      <div class="text-right">
                         <p class="text-[10px] text-gray-500 uppercase">Pending</p>
                         <p class="text-lg font-bold text-pink-600">₹{{ getChitPending(record.scheme, record.customer) | number:'1.0-0' }}</p>
                         <p class="text-[10px] text-green-600 font-medium">Paid: ₹{{ getChitPaid(record.customer) }}</p>
                      </div>
                   </div>
                </div>
                <div *ngIf="(chitRecords$ | async)?.length === 0" class="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p class="text-gray-500">You haven't joined any schemes yet.</p>
               </div>
            </div>
          </div>

          <!-- My Loans -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Loans</h3>
            <div class="space-y-4">
               <div *ngFor="let loan of loans$ | async" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div class="flex justify-between mb-4">
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-lg">{{ loan.name }}</h4>
                        <p class="text-gray-500 text-sm">Principal: ₹{{ loan.amount }} &#64; {{ loan.interestRate }}%</p>
                     </div>
                     <div class="text-right">
                        <p class="text-sm text-gray-500">Remaining Balance</p>
                        <p class="font-bold text-gray-900 dark:text-white text-lg text-pink-600">₹{{ getBalance(loan) | number:'1.0-0' }}</p>
                     </div>
                  </div>
               </div>
               <div *ngIf="(loans$ | async)?.length === 0" class="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p class="text-gray-500">No active loans found.</p>
               </div>
            </div>
          </div>

        </div>
      </main>

      <!-- Profile / Change Password Modal -->
      @if (showProfileModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
           <div id="recaptcha-container"></div>
           <div class="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl transition-all border border-purple-100 dark:border-gray-700">
              <div class="p-8">
                 <div class="flex justify-between items-center mb-6">
                   <div>
                      <h3 class="text-2xl font-black text-gray-900 dark:text-white">Security Verify</h3>
                      <p class="text-sm text-gray-500">OTP via {{ profile?.phone }}</p>
                   </div>
                   <button (click)="closeProfileModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>

                 @if (!otpSent) {
                   <div class="text-center space-y-6">
                      <div class="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-3xl">
                         <svg class="w-12 h-12 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                         <p class="text-sm text-gray-600 dark:text-gray-400">We will send a 6-digit code to your registered mobile number to verify your identity.</p>
                      </div>
                      <button (click)="sendOtp()" [disabled]="isUpdating"
                              class="w-full py-4 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all disabled:opacity-50">
                         {{ isUpdating ? 'Sending...' : 'Send OTP' }}
                      </button>
                   </div>
                 } @else {
                   <form [formGroup]="passwordForm" (ngSubmit)="updatePasswordWithOtp()" class="space-y-4">
                      <div>
                         <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">6-Digit OTP</label>
                         <input type="text" formControlName="otp" 
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white tracking-[0.5em] text-center font-bold" 
                                placeholder="000000" maxlength="6">
                      </div>

                      <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                         <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                         <input type="password" formControlName="newPassword" 
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white" 
                                placeholder="Min 6 characters">
                      </div>

                      <button type="submit" [disabled]="passwordForm.invalid || isUpdating"
                              class="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all disabled:opacity-50">
                         {{ isUpdating ? 'Verifying...' : 'Verify & Update' }}
                      </button>
                   </form>
                 }
              </div>
           </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  profile$ = this.authService.userProfile$;
  chitRecords$: Observable<{scheme: ChittiScheme, customer: Customer}[]> = of([]);
  loans$: Observable<InterestScheme[]> = of([]);
  totalDues$: Observable<number> = of(0);

  showProfileModal = false;
  isUpdating = false;
  otpSent = false;
  confirmationResult: any;
  profile: any;

  passwordForm: FormGroup = this.fb.group({
     otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
     newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    this.profile$.subscribe(p => this.profile = p);
    
    this.chitRecords$ = this.profile$.pipe(
      switchMap(profile => {
        if (!profile) return of([]);
        // Use username as the primary identifier (stable, doesn't change with phone updates)
        const identifier = profile.username || profile.phone;
        if (!identifier) return of([]);
        return this.customerService.getCustomersByUserIdentifier(identifier).pipe(
           switchMap(customerRecords => {
              if (customerRecords.length === 0) return of([]);
              return this.chittiService.getChittis().pipe(
                 map(allChits => {
                   return customerRecords.map(cust => ({
                     customer: cust,
                     scheme: allChits.find(c => c.id === cust.schemeId)!
                   })).filter(x => !!x.scheme);
                 })
              );
           })
        );
      })
    );

    this.loans$ = this.profile$.pipe(
      switchMap(profile => {
        if (!profile) return of([]);
        // Filter interests by borrower phone matching profile phone or email
        return this.interestService.getInterests().pipe(
           map(interests => interests.filter(i => 
             (profile.phone && i.borrowerPhone === profile.phone) || 
             (profile.email && i.borrowerEmail === profile.email)
           ))
        );
      })
    );

    this.totalDues$ = this.loans$.pipe(
      switchMap(loans => this.chitRecords$.pipe(
         map(chits => {
           const loanDues = loans.reduce((acc, loan) => acc + this.getBalance(loan), 0);
           const chitDues = chits.reduce((acc, record) => acc + this.getChitPending(record.scheme, record.customer), 0);
           return loanDues + chitDues;
         })
      ))
    );
  }

  getBalance(loan: InterestScheme): number {
    const settled = (loan.settlements || []).reduce((sum, s) => sum + s.amount, 0);
    return Math.max(0, loan.amount - settled);
  }

  getChitPaid(customer: Customer): number {
    return (customer.payments || []).reduce((sum, p) => sum + p.amount, 0);
  }

  getChitPending(scheme: ChittiScheme, customer: Customer): number {
    if (!scheme || !customer.joinedDate) return 0;
    
    const joined = new Date(customer.joinedDate);
    const now = new Date();
    
    // Difference in months
    let monthDiff = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
    
    const totalExpectedMonths = monthDiff + 1;
    const totalPayable = totalExpectedMonths * scheme.monthlyAmount;
    const paid = this.getChitPaid(customer);
    
    return Math.max(0, totalPayable - paid);
  }

  async updatePasswordWithOtp() {
    if (this.passwordForm.valid && this.confirmationResult) {
       this.isUpdating = true;
       try {
          await this.authService.verifyOtpAndChangePassword(
            this.confirmationResult, 
            this.passwordForm.value.otp, 
            this.passwordForm.value.newPassword,
            this.profile?.username || ''
          );
          this.toast.success('Password updated successfully via Phone OTP!');
          this.closeProfileModal();
       } catch (error: any) {
          console.error(error);
          this.toast.error(error.message || 'OTP verification failed. Please try again.');
       } finally {
          this.isUpdating = false;
       }
    }
  }

  async sendOtp() {
    if (!this.profile?.phone) {
       this.toast.error('No phone number found for this account.');
       return;
    }
    
    this.isUpdating = true;
    try {
       // Initialize Recaptcha
       const recaptchaVerifier = new RecaptchaVerifier(this.authService.firebaseAuth, 'recaptcha-container', {
          size: 'invisible'
       });
       
       this.confirmationResult = await this.authService.sendOtpWithPhoneNumber(this.profile.phone, recaptchaVerifier);
       this.otpSent = true;
       this.toast.success('OTP sent to your mobile number.');
    } catch (error: any) {
       console.error(error);
       this.toast.error(error.message || 'Failed to send OTP. Please check your network.');
    } finally {
       this.isUpdating = false;
    }
  }

  closeProfileModal() {
     this.showProfileModal = false;
     this.otpSent = false;
     this.confirmationResult = null;
     this.passwordForm.reset();
  }

  logout() {
    this.authService.logout().then(() => {
      this.toast.success('Successfully logged out.');
      this.router.navigate(['/login']);
    });
  }
}
