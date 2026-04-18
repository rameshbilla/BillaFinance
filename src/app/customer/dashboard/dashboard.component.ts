import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <style>
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .glass-card { background: rgb(214 214 214 / 20%); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.4); }
      .dark .glass-card { background:rgb(214 214 214 / 20%); border: 1px solid rgba(255,255,255,0.1); }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      
      .bottom-nav-pill {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #ededed;
        height: 72px;
        width: 80%;
        max-width: 300px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        padding: 0 12px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        z-index: 100;
      }
      .nav-item-box {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        height: 100%;
        cursor: pointer;
      }
      .nav-indicator {
        position: absolute;
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
        border-radius: 50%;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 5;
      }
      .nav-icon {
        position: relative;
        z-index: 10;
        transition: all 0.3s ease;
      }
      .icon-active {
        color: white !important;
        transform: scale(1.1);
      }
      .icon-inactive {
        color: #71717a;
      }
      .progress-professional {
        background: rgba(139, 92, 246, 0.08);
        border: 1px solid rgba(139, 92, 246, 0.04);
      }
      .dark .progress-professional {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.02);
      }
    </style>

    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 pb-32 sm:pb-0 overflow-x-hidden">
      <!-- Premium Header -->
      <nav class="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-20 items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tighter">BillaFinance</h1>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="toggleTheme()" class="p-2 text-gray-500 hover:text-purple-600 transition-colors">
                <svg *ngIf="!isDarkMode" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                <svg *ngIf="isDarkMode" class="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </button>
              <button (click)="logout()" class="p-2 text-red-500 hover:text-red-600 transition-all font-bold" title="Log out">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        <!-- Welcome Section -->
        <section class="fade-in-up" *ngIf="authService.userProfile$ | async as profile" style="animation-delay: 0.1s">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <p class="text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-2">Welcome Back</p>
              <h2 class="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{{ profile.displayName }}</h2>
            </div>
            <div class="flex flex-col items-end">
               <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
               <p class="text-3xl font-black text-red-600 dark:text-red-400">₹{{ totalOutstanding | number:'1.0-0' }}</p>
            </div>
          </div>
        </section>

        <!-- CHITTI SCHEMES (Scrollable Section) -->
        <section *ngIf="customerChitties.length > 0" class="fade-in-up" style="animation-delay: 0.2s">
          <div class="flex items-center gap-3 mb-6">
             <div class="h-8 w-1.5 bg-purple-600 rounded-full"></div>
             <h3 class="text-xl font-bold text-gray-900 dark:text-white">Your Chitti Records</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (item of customerChitties; track item.scheme.id) {
              <div class="glass-card rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-1">{{ item.scheme.name }}</h4>
                    <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest rounded-full">Monthly Chitti</span>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</p>
                    <p class="text-lg font-black text-red-600">₹{{ getChitPending(item.scheme, item.customer) | number:'1.0-0' }}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-8">
                  <div class="space-y-1">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
                    <p class="text-base font-black text-gray-900 dark:text-white">₹{{ getChitPaid(item.customer) | number:'1.0-0' }}</p>
                  </div>
                  <div class="space-y-1 text-right">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">EMI</p>
                    <p class="text-base font-black text-gray-900 dark:text-white">₹{{ item.scheme.monthlyAmount | number:'1.0-0' }}</p>
                  </div>
                </div>

                <div class="space-y-3 mb-8">
                  <div class="flex justify-between items-end">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Installments</p>
                    <p class="text-xs font-black text-purple-600 dark:text-purple-400">
                      {{ (getChitPaid(item.customer) / item.scheme.monthlyAmount) | number:'1.0-0' }} / {{ item.scheme.tenure }} Months
                    </p>
                  </div>
                  <div class="w-full progress-professional h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(124,58,237,0.3)]" 
                         [style.width.%]="(getChitPaid(item.customer) / (item.scheme.monthlyAmount * item.scheme.tenure)) * 100"></div>
                  </div>
                </div>

                <button (click)="openChitHistory(item)" class="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all">View Statement</button>
              </div>
            }
          </div>
        </section>

        <!-- ACTIVE LOANS (Scrollable Section) -->
        <section *ngIf="activeLoans.length > 0" class="fade-in-up" style="animation-delay: 0.3s">
          <div class="flex items-center gap-3 mb-6">
             <div class="h-8 w-1.5 bg-blue-600 rounded-full"></div>
             <h3 class="text-xl font-bold text-gray-900 dark:text-white">Active Loan Accounts</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (loan of activeLoans; track loan.id) {
              <div class="glass-card rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-1">{{ loan.name }}</h4>
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-full">{{ loan.interestRate }}% Interest p.m.</span>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</p>
                    <p class="text-lg font-black text-red-600">₹{{ getBalance(loan) | number:'1.0-0' }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-8">
                  <div class="space-y-1">
                    <p class="text-[10px] font-bold text-gray-400 uppercase truncate">Sanctioned</p>
                    <p class="text-base font-black text-gray-900 dark:text-white truncate">₹{{ loan.amount | number:'1.0-0' }}</p>
                  </div>
                  <div class="space-y-1 text-center">
                    <p class="text-[10px] font-bold text-gray-400 uppercase truncate">Paid Back</p>
                    <p class="text-base font-black text-green-600 truncate">₹{{ getLoanPaid(loan) | number:'1.0-0' }}</p>
                  </div>
                  <div class="space-y-1 text-right">
                    <p class="text-[10px] font-bold text-blue-400 uppercase truncate">Monthly Int.</p>
                    <p class="text-base font-black text-blue-600 truncate">₹{{ getMonthlyInterest(loan) | number:'1.0-0' }}</p>
                  </div>
                </div>

                <div class="space-y-3 mb-8">
                  <div class="flex justify-between items-end">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Repayment</p>
                    <p class="text-xs font-black text-blue-600 dark:text-blue-400">
                      {{ (getLoanPaid(loan) / loan.amount * 100) | number:'1.0-0' }}% Completed
                    </p>
                  </div>
                  <div class="w-full progress-professional h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                         [style.width.%]="(getLoanPaid(loan) / loan.amount) * 100"></div>
                  </div>
                </div>

                <button (click)="openLoanHistory(loan)" class="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all">Loan Statement</button>
              </div>
            }
          </div>
        </section>

        <!-- No Active Schemes State -->
        <div *ngIf="customerChitties.length === 0 && activeLoans.length === 0" class="py-20 text-center">
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">No active records found</h3>
            <p class="text-gray-500 mt-2">You don't have any active chit or loan schemes at the moment.</p>
        </div>

      </main>

      <!-- Bottom Mobile Nav -->
      <div class="fixed bottom-6 left-0 right-0 z-[100] sm:hidden flex justify-center pointer-events-none">
         <div class="bottom-nav-pill pointer-events-auto relative">
            
            <!-- Sliding Indicator Layer -->
            <div class="absolute inset-0 px-3 flex items-center pointer-events-none">
               <div class="relative w-full h-full flex items-center">
                  <div class="nav-indicator" 
                       [style.left]="activeMobileMenu === 'home' ? '25%' : '75%'"
                       style="transform: translateX(-50%)">
                  </div>
               </div>
            </div>

            <!-- Home -->
            <div (click)="scrollToTop(); activeMobileMenu = 'home'; activeTab = 'home'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'home' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
            </div>

            <!-- Security/Settings -->
            <div (click)="scrollToTop(); activeMobileMenu = 'security'; activeTab = 'security'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'security' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
            </div>

         </div>
      </div>

      <!-- Password Update Modal -->
      @if (activeTab === 'security') {
        <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 sm:hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
               <div class="p-8">
                  <div class="flex justify-between items-center mb-8">
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Security</h3>
                        <p class="text-sm text-gray-500">Change your account password</p>
                     </div>
                     <button (click)="activeTab = 'home'; activeMobileMenu = 'home'" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  
                  <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="space-y-6">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                        <input type="password" formControlName="newPassword"
                               class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white"
                               placeholder="Min 6 characters">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                        <input type="password" formControlName="confirmPassword"
                               class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white"
                               placeholder="Repeat new password">
                    </div>
                    <button type="submit" [disabled]="passwordForm.invalid || isUpdating"
                            class="w-full py-4 bg-black text-white rounded-2xl font-bold transition-all disabled:opacity-50">
                        {{ isUpdating ? 'Updating...' : 'Update Password' }}
                    </button>
                  </form>
               </div>
            </div>
        </div>
      }

      <!-- Shared Statement Modal -->
      @if (selectedChit || selectedLoan) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-lg px-4">
            <div class="bg-white dark:bg-gray-800 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
               <div class="p-8 sm:p-10">
                  <div class="flex justify-between items-start mb-8">
                     <div>
                        <div class="flex items-center gap-2 mb-1">
                           <span class="w-3 h-3 rounded-full" [class]="selectedChit ? 'bg-purple-500' : 'bg-blue-500'"></span>
                           <h3 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                             {{ selectedChit ? selectedChit.scheme.name : selectedLoan?.name }}
                           </h3>
                        </div>
                        <p class="text-gray-500 font-medium">Transaction Statement</p>
                     </div>
                     <button (click)="selectedChit = null; selectedLoan = null" class="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:rotate-90 transition-all duration-300">
                        <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div class="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
                         {{ selectedChit ? 'Total Paid' : 'Principal Paid' }}
                       </p>
                       <p class="text-xs sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                         ₹{{ selectedChit ? getChitPaid(selectedChit.customer) : getLoanPaid(selectedLoan!) | number:'1.0-0' }}
                       </p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Balance</p>
                       <p class="text-xs sm:text-2xl font-black text-red-600 truncate">
                         ₹{{ selectedChit ? getChitPending(selectedChit.scheme, selectedChit.customer) : getBalance(selectedLoan!) | number:'1.0-0' }}
                       </p>
                    </div>
                  </div>

                  <div class="max-h-[35vh] overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                     @if (selectedChit) {
                        @for (payment of sortLatest(selectedChit.customer.payments); track payment.id) {
                           <div class="flex justify-between items-center p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <div>
                                 <p class="font-bold text-gray-900 dark:text-white">{{ payment.date | date:'mediumDate' }}</p>
                                 <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">REF: {{ payment.id?.slice(-8) }}</p>
                              </div>
                              <p class="text-xl font-black text-green-600">+₹{{ payment.amount | number:'1.0-0' }}</p>
                           </div>
                        }
                     }
                     @if (selectedLoan) {
                        @for (item of getAllLoanTransactions(selectedLoan); track item.id) {
                           <div class="flex justify-between items-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <div>
                                 <p class="font-bold text-gray-900 dark:text-white">{{ item.date | date:'mediumDate' }}</p>
                                 <p class="text-[10px] font-bold uppercase tracking-wider" [class]="item.type === 'interest' ? 'text-indigo-500' : 'text-green-500'">
                                   {{ item.type === 'interest' ? 'Interest Payment' : 'Principal Repayment' }}
                                 </p>
                              </div>
                              <p class="text-xl font-black" [class]="item.type === 'interest' ? 'text-indigo-600' : 'text-green-600'">
                                +₹{{ item.amount | number:'1.0-0' }}
                              </p>
                           </div>
                        }
                     }
                  </div>
               </div>
            </div>
        </div>
      }
    </div>
  `
})
export class CustomerDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  customerChitties: { scheme: ChittiScheme, customer: Customer }[] = [];
  activeLoans: InterestScheme[] = [];
  isDarkMode = false;
  activeMobileMenu: 'home' | 'security' = 'home';
  activeTab: 'home' | 'security' = 'home';

  selectedChit: { scheme: ChittiScheme, customer: Customer } | null = null;
  selectedLoan: InterestScheme | null = null;

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  isUpdating = false;

  get totalOutstanding(): number {
    let chitPending = this.customerChitties.reduce((sum, item) => sum + this.getChitPending(item.scheme, item.customer), 0);
    let loanPending = this.activeLoans.reduce((sum, loan) => sum + this.getBalance(loan), 0);
    return chitPending + loanPending;
  }

  ngOnInit() {
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.loadData();
  }

  private loadData() {
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        // Load Chitties for this customer
        this.customerService.getAllCustomers().subscribe(all => {
          const mine = all.filter(c => c.phone === profile.phone && c.schemeType === 'chitti');
          this.customerChitties = [];
          mine.forEach(cust => {
            this.chittiService.getChittiById(cust.schemeId).subscribe(scheme => {
              if (scheme) this.customerChitties.push({ scheme, customer: cust });
            });
          });
        });

        // Load Loans for this customer
        this.interestService.getInterests().subscribe(allLoans => {
          this.activeLoans = allLoans.filter(l => l.borrowerPhone === profile.phone);
        });
      }
    });
  }

  getChitPaid(customer: Customer): number {
    return (customer.payments || []).reduce((sum, p) => sum + p.amount, 0);
  }

  getChitPending(scheme: ChittiScheme, customer: Customer): number {
    const now = new Date();
    const dateStr = customer.joinedDate || scheme.startDate;
    if (!dateStr) return 0;
    
    const joined = new Date(dateStr);
    if (isNaN(joined.getTime())) return 0;

    const monthsElapsed = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1;
    const cappedMonths = Math.min(Math.max(1, monthsElapsed), scheme.tenure);
    const totalDue = cappedMonths * scheme.monthlyAmount;
    const paid = this.getChitPaid(customer);
    return Math.max(0, totalDue - paid);
  }

  getLoanPaid(loan: InterestScheme): number {
    return (loan.settlements || []).reduce((sum, s) => sum + s.amount, 0);
  }

  getBalance(loan: InterestScheme): number {
    return Math.max(0, loan.amount - this.getLoanPaid(loan));
  }

  getMonthlyInterest(loan: InterestScheme): number {
    return this.getBalance(loan) * (loan.interestRate / 100);
  }

  getLoanInterestPaid(loan: InterestScheme): number {
    return (loan.interestCollections || []).reduce((sum, c) => sum + c.amount, 0);
  }

  getAllLoanTransactions(loan: InterestScheme) {
    const transactions: any[] = [
      ...(loan.settlements || []).map(s => ({ ...s, type: 'principal' })),
      ...(loan.interestCollections || []).map(c => ({ ...c, type: 'interest' }))
    ];
    return this.sortLatest(transactions);
  }

  sortLatest(list: any[] | undefined) {
    if (!list) return [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  openChitHistory(item: { scheme: ChittiScheme, customer: Customer }) { this.selectedChit = item; }
  openLoanHistory(loan: InterestScheme) { this.selectedLoan = loan; }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  async updatePassword() {
    if (this.passwordForm.valid) {
      this.isUpdating = true;
      try {
        const profileVal = await new Promise<any>((resolve) => {
          this.authService.userProfile$.subscribe(p => resolve(p));
        });
        if (profileVal?.username) {
          await this.authService.changeCustomerPassword(profileVal.username, this.passwordForm.value.newPassword);
          this.toast.success('Password updated successfully!');
          this.passwordForm.reset();
          this.activeTab = 'home';
          this.activeMobileMenu = 'home';
        }
      } catch (e: any) {
        this.toast.error('Failed to update password.');
      } finally {
        this.isUpdating = false;
      }
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark');
  }

  logout() { this.router.navigate(['/login']); }
  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
