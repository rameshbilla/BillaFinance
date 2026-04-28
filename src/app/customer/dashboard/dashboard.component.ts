import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BaseChartDirective],
  template: `
    <style>
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .glass-card { background: rgb(214 214 214 / 20%); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.4); }
      .dark .glass-card { background:rgb(214 214 214 / 20%); border: 1px solid rgba(255,255,255,0.1); }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      
      .history-step { position: relative; padding-left: 3.2rem; }
      .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
      .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
      
      .bottom-nav-pill {
        position: fixed;
        bottom: 32px;
        left: 43%;
        transform: translateX(-50%);
        background: rgba(237, 237, 237, 0.85);
        backdrop-filter: blur(20px);
        height: 68px;
        width: 85%;
        max-width: 320px;
        border-radius: 34px;
        display: flex;
        padding: 4px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        z-index: 100;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      .nav-item-box {
        flex: 1 1 0%;
        min-width: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 48px;
        position: relative;
        z-index: 2;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .nav-icon {
        position: relative;
        z-index: 3;
        transition: all 0.4s ease;
      }
      .icon-active {
        color: white !important;
        transform: scale(1.1) translateY(-1px);
      }
      .icon-inactive {
        color: #505d6f;
      }
      .nav-item-box:active .nav-icon {
        transform: scale(0.9);
      }
      .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); }
      .dark .glass-card { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255,255,255,0.05); }
      .dark .bottom-nav-pill {
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(15, 23, 42, 0.85);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      }
    </style>

    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 pb-32 sm:pb-0 overflow-x-hidden">
      <!-- Premium Header -->
      <nav class="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 animate-fade-down">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-20 items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tighter">FinServe</h1>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="activeTab = 'security'; activeMobileMenu = 'security'" class="p-2 text-gray-500 hover:text-indigo-600 transition-colors hidden sm:block" title="Security & Password">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </button>
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

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-up delay-100">
        @if (!selectedChit && !selectedLoan) {
          <!-- Welcome Section -->
          <section class="fade-in-up" *ngIf="authService.userProfile$ | async as profile" style="animation-delay: 0.1s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-2">
              <div>
                <p class="text-[10px] sm:text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.3em] mb-2">Welcome Back</p>
                <h2 class="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{{ profile.displayName }}</h2>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mt-8">
               <div class="glass-card rounded-3xl p-5 border-purple-500/10">
                  <p class="text-[8px] sm:text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 leading-none">Total Outstanding</p>
                  <p class="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">₹{{ totalOutstanding | number:'1.0-0' }}</p>
               </div>
               <div class="glass-card rounded-3xl p-5 border-blue-500/10 text-right">
                  <p class="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Active Products</p>
                  <p class="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{{ customerChitties.length + activeLoans.length }}</p>
               </div>
            </div>
          </section>

        <!-- OVERALL ACTIVITY CHART -->
        <section *ngIf="(customerChitties.length > 0 || activeLoans.length > 0) && overallChartData.datasets.length > 0" class="fade-in-up mb-10" style="animation-delay: 0.15s">
          <div class="glass-card rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
             <div class="flex justify-between items-center mb-4">
               <div class="flex items-center gap-2">
                 <div class="h-4 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                 <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Financial Activity</h3>
               </div>
               <select [(ngModel)]="selectedYearOverall" (ngModelChange)="generateOverallChart($event)"
                       class="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer appearance-none pr-8 relative">
                  <option *ngFor="let y of availableYears" [ngValue]="y">{{y}}</option>
               </select>
             </div>
             <div class="w-full h-[200px] sm:h-[250px]">
                <canvas baseChart [data]="overallChartData" [options]="chartOptions" [type]="chartType"></canvas>
             </div>
          </div>
        </section>
        <!-- CHITTI SCHEMES (Scrollable Section) -->
        <section *ngIf="customerChitties.length > 0" class="fade-in-up" style="animation-delay: 0.2s">
          <div class="flex items-center gap-3 mb-6">
             <div class="h-6 w-1.5 bg-purple-600 rounded-full"></div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chitti Accounts</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (item of customerChitties; track item.scheme.id) {
              <div class="glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="flex justify-between items-start mb-6">
                  <div class="min-w-0">
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-2 truncate">{{ item.scheme.name }}</h4>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[8px] font-black uppercase tracking-widest rounded-md">Chit Fund</span>
                      <button (click)="openIdentityProfile('chit', item)" class="px-2 py-0.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 text-[8px] font-black uppercase tracking-widest rounded-md">ID Proof</button>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                    <p class="text-xl font-black text-red-600 tracking-tighter leading-none">₹{{ getChitPending(item.scheme, item.customer) | number:'1.0-0' }}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Paid Status</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter">₹{{ getChitPaid(item.customer) | number:'1.0-0' }}</p>
                  </div>
                  <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1 text-right">Tenure Remaining</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter text-right">{{ item.scheme.tenure - (getChitPaid(item.customer) / item.scheme.monthlyAmount) | number:'1.0-0' }} Mo</p>
                  </div>
                </div>

                <div class="space-y-3 mb-6 px-1">
                  <div class="flex justify-between items-end">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Progress ({{ (getChitPaid(item.customer) / item.scheme.monthlyAmount) | number:'1.0-0' }}/{{ item.scheme.tenure }})</p>
                    <p class="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-tighter">
                      {{ (getChitPaid(item.customer) / (item.scheme.monthlyAmount * item.scheme.tenure)) * 100 | number:'1.0-0' }}%
                    </p>
                  </div>
                  <div class="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(124,58,237,0.2)]" 
                         [style.width.%]="(getChitPaid(item.customer) / (item.scheme.monthlyAmount * item.scheme.tenure)) * 100"></div>
                  </div>
                </div>

                <button (click)="openChitHistory(item)" class="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] transition-all shadow-lg active:scale-95">Statement</button>
              </div>
            }
          </div>
        </section>

        <!-- ACTIVE LOANS (Scrollable Section) -->
        <section *ngIf="activeLoans.length > 0" class="fade-in-up" style="animation-delay: 0.3s">
          <div class="flex items-center gap-3 mb-6">
             <div class="h-6 w-1.5 bg-blue-600 rounded-full"></div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Loan Accounts</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (loan of activeLoans; track loan.id) {
              <div class="glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="flex justify-between items-start mb-6">
                  <div class="min-w-0">
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-2 truncate">{{ loan.name }}</h4>
                    <div class="flex flex-wrap items-center gap-2">
                       <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[8px] font-black uppercase tracking-widest rounded-md">{{ loan.interestRate }}% ROI</span>
                       <button (click)="openIdentityProfile('loan', loan)" class="px-2 py-0.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 text-[8px] font-black uppercase tracking-widest rounded-md">ID Proof</button>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Outstanding</p>
                    <p class="text-xl font-black text-red-600 tracking-tighter leading-none">₹{{ getBalance(loan) + getPendingInterest(loan) | number:'1.0-0' }}</p>
                  </div>
                </div>

                <!-- Interest Status Row -->
                <div class="flex items-center justify-between mb-4 px-1">
                   <div class="flex items-center gap-1.5">
                      <div class="w-1.5 h-1.5 rounded-full" [class]="getPendingInterest(loan) > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'"></div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {{ getPendingInterest(loan) > 0 ? 'Interest Pending' : 'Interest Clear' }}
                      </p>
                   </div>
                   <div class="text-right">
                      <p class="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Next Due</p>
                      <p class="text-[10px] font-black text-gray-700 dark:text-gray-300">{{ getNextInterestDate(loan) | date:'dd MMM' }}</p>
                   </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-6">
                  <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-0.5">Principal</p>
                    <p class="text-base font-black text-gray-900 dark:text-white tracking-tighter">₹{{ getBalance(loan) | number:'1.0-0' }}</p>
                    <p class="text-[7px] text-gray-400 font-bold mt-1 uppercase">ROI: {{ loan.interestRate }}%</p>
                  </div>
                  <div class="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                    <p class="text-[8px] font-black text-orange-400 uppercase mb-0.5 text-right">Interest Due</p>
                    <p class="text-base font-black text-orange-600 tracking-tighter text-right">₹{{ getPendingInterest(loan) | number:'1.0-0' }}</p>
                    <p class="text-[7px] text-orange-400 font-bold mt-1 text-right uppercase">Last Paid: {{ getLastInterestDate(loan) | date:'dd MMM' }}</p>
                  </div>
                </div>

                <div class="space-y-3 mb-6 px-1">
                  <div class="flex justify-between items-end">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Principal Paid: <span class="text-green-600">₹{{ getLoanPaid(loan) | number:'1.0-0' }}</span></p>
                    <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                      {{ (getLoanPaid(loan) / loan.amount * 100) | number:'1.0-0' }}% Released
                    </p>
                  </div>
                  <div class="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]" 
                         [style.width.%]="(getLoanPaid(loan) / loan.amount) * 100"></div>
                  </div>
                </div>

                <button (click)="openLoanHistory(loan)" class="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] transition-all shadow-lg active:scale-95">Loan Statement</button>
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
        } @else {
           <!-- Statement Directive View -->
           <div class="animate-in fade-in slide-in-from-right-4 duration-500 col-span-full w-full">
             <button (click)="selectedChit = null; selectedLoan = null" class="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-purple-600 transition-colors uppercase tracking-[0.2em] mb-6">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Dashboard
             </button>
             
             <!-- Restored Inline layout core -->
             <div class="bg-white dark:bg-gray-800 rounded-[3rem] w-full mt-2 overflow-hidden shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
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
                  </div>

                  <div class="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
                         {{ selectedChit ? 'Total Paid' : 'Principal Paid' }}
                       </p>
                       <p class="text-2xl font-black text-gray-900 dark:text-white truncate">
                         ₹{{ selectedChit ? getChitPaid(selectedChit.customer) : getLoanPaid(selectedLoan!) | number:'1.0-0' }}
                       </p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Balance</p>
                       <p class="text-2xl font-black text-red-600 truncate">
                         ₹{{ selectedChit ? getChitPending(selectedChit.scheme, selectedChit.customer) : getBalance(selectedLoan!) | number:'1.0-0' }}
                       </p>
                    </div>
                  </div>

                  @if (selectedLoan || selectedChit) {
                     <div class="w-full h-[220px] sm:h-[260px] mb-8 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm relative overflow-hidden">
                        <div class="absolute top-4 right-4 z-10">
                           <select [(ngModel)]="selectedYearStatement" (ngModelChange)="onStatementYearChange($event)"
                                   class="px-3 py-1 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer appearance-none pr-8">
                              <option *ngFor="let y of availableYears" [ngValue]="y">{{y}}</option>
                           </select>
                        </div>
                        <div class="w-full h-full pt-6">
                           <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="chartType"></canvas>
                        </div>
                     </div>
                  }

                  <div class="max-h-[50vh] overflow-y-auto pr-3 space-y-0 custom-scrollbar mt-2">
                     @if (selectedChit) {
                        @let chitTrans = sortLatest(selectedChit.customer.payments);
                        @for (payment of chitTrans; track payment.id; let i = $index) {
                           <div class="history-step group relative pb-6">
                              @if (i < chitTrans.length - 1) { <div class="stepper-line bg-purple-500/30"></div> }
                              <div class="stepper-dot w-8 h-8 rounded-full flex items-center justify-center text-white bg-purple-600 shadow-lg shadow-purple-500/30 z-10 transition-transform group-hover:scale-110">
                                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                              <div class="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-purple-200 flex justify-between items-center">
                                 <div>
                                    <p class="font-bold text-gray-900 dark:text-white">{{ payment.date | date:'longDate' }}</p>
                                    <p class="text-[10px] text-purple-500 font-black uppercase tracking-widest mt-1">REF: {{ payment.id?.slice(-8) || 'N/A' }}</p>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-xl font-black text-gray-900 dark:text-white">+₹{{ payment.amount | number:'1.0-0' }}</p>
                                 </div>
                              </div>
                           </div>
                        }
                     }
                     @if (selectedLoan) {
                        @let loanTrans = getAllLoanTransactions(selectedLoan);
                        @for (item of loanTrans; track item.id; let i = $index) {
                           <div class="history-step group relative pb-6">
                              @if (i < loanTrans.length - 1) { <div class="stepper-line" [class]="item.type === 'interest' ? 'bg-indigo-500/30' : 'bg-green-500/30'"></div> }
                              <div class="stepper-dot w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 z-10"
                                   [class]="item.type === 'interest' ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-green-600 shadow-green-500/30'">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                              <div class="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all flex justify-between items-center"
                                   [class]="item.type === 'interest' ? 'hover:border-indigo-200 hover:shadow-md' : 'hover:border-green-200 hover:shadow-md'">
                                <div>
                                   <p class="font-bold text-gray-900 dark:text-white leading-tight">{{ item.date | date:'longDate' }}</p>
                                   <p class="text-[9px] font-black uppercase tracking-widest mt-1" [class]="item.type === 'interest' ? 'text-indigo-500' : 'text-green-500'">
                                     {{ item.type === 'interest' ? 'Interest Payment' : 'Principal Repayment' }}
                                   </p>
                                </div>
                                <div class="text-right">
                                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount Paid</p>
                                  <p class="text-xl font-black leading-none" [class]="item.type === 'interest' ? 'text-indigo-600' : 'text-green-600'">
                                    +₹{{ item.amount | number:'1.0-0' }}
                                  </p>
                                </div>
                              </div>
                           </div>
                        }
                     }
                  </div>
               </div>
             </div>
           </div>
        }
      </main>

      <!-- Bottom Mobile Nav -->
      <div class="fixed bottom-6 left-0 right-0 z-[100] sm:hidden flex justify-center pointer-events-none">
         <div class="bottom-nav-pill pointer-events-auto relative">
            
            <div class="absolute inset-1 flex pointer-events-none z-0">
               <div [style.flex-grow]="activeMobileMenu === 'home' ? 0 : 1" class="transition-all duration-500 ease-in-out"></div>
               <div class="flex-none flex items-center justify-center" style="width: 50%">
                  <div class="h-full aspect-square bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 transition-all duration-500"></div>
               </div>
               <div [style.flex-grow]="activeMobileMenu === 'home' ? 1 : 0" class="transition-all duration-500 ease-in-out"></div>
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
        <div class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl mobile-animate-slide duration-500">
               <div class="p-8 sm:p-10">
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

                  <!-- ═══════════ BIOMETRIC AUTH ═══════════ -->
                  @if (biometricService.isAvailable$ | async) {
                     <div class="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <div class="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                           <div class="flex items-center gap-4">
                               <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                                  <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.268 0 2.39.234 3.41.659m-4.74 12.57c-1.285-.378-2.56-1.1-3.33-2.14m7.41 1.53A9.914 9.914 0 0021 12c0-5.523-4.477-10-10-10a10.003 10.003 0 00-6.73 2.6c1.176.4 2.223 1.096 3.033 1.983m0 0l2.224 2.224"/>
                                    <path d="M12 18v.01" />
                                    <path d="M9 15v.01" />
                                    <path d="M15 15v.01" />
                                  </svg>
                               </div>
                              <div>
                                 <p class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">Biometric Login</p>
                                 <p class="text-[10px] text-gray-400 font-bold mt-1">Unlock with fingerprint/Face ID</p>
                              </div>
                           </div>
                           <label class="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" [checked]="isBiometricEnabled" (change)="toggleBiometric($event)" class="sr-only peer">
                              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                           </label>
                        </div>
                     </div>
                  }
               </div>
            </div>
        </div>
      }

      <!-- Identity Popup Modal -->
      @if (showIdentityPopup && identityPayload) {
        <div class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xl rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl mobile-animate-slide duration-300 border border-gray-100 dark:border-gray-800">
               <div class="p-8 sm:p-12">
                  <div class="flex justify-between items-center mb-6">
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Profile details</h3>
                        <p class="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-0.5">{{ identityPayload.type }}</p>
                     </div>
                     <button (click)="showIdentityPopup = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all text-gray-500">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  <div class="space-y-4">
                     <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl pb-5">
                       <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                       <p class="text-lg font-black text-gray-900 dark:text-white leading-none">{{ identityPayload.name }}</p>
                     </div>
                     <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mobile</p>
                          <p class="text-sm font-black text-gray-900 dark:text-white">{{ identityPayload.phone }}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5 overflow-hidden">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                          <p class="text-xs font-black text-gray-900 dark:text-white truncate" [title]="identityPayload.email">{{ identityPayload.email }}</p>
                        </div>
                     </div>
                     <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Username</p>
                          <p class="text-xs font-black text-purple-600 dark:text-purple-400">&#64;{{ identityPayload.username }}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Joined Date</p>
                          <p class="text-xs font-black text-gray-900 dark:text-white">{{ identityPayload.joinedDate | date:'mediumDate' }}</p>
                        </div>
                     </div>
                     <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5 overflow-hidden">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">Scheme ({{ identityPayload.schemeType }})</p>
                          <p class="text-xs font-black text-gray-900 dark:text-white truncate" [title]="identityPayload.targetScheme">{{ identityPayload.targetScheme }}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-[1.5rem] pb-5">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                          <span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded">{{ identityPayload.status }}</span>
                        </div>
                     </div>
                     @if (identityPayload.address !== 'N/A') {
                       <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl pb-5">
                         <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered Address</p>
                         <p class="text-sm font-black text-gray-900 dark:text-white">{{ identityPayload.address }}</p>
                       </div>
                     }
                     @if (identityPayload.description !== 'N/A') {
                       <div class="bg-indigo-50/50 dark:bg-gray-800/50 p-4 rounded-3xl pb-5 mt-4 border border-indigo-100/50 dark:border-gray-700/50">
                         <p class="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-1">Scheme Description</p>
                         <p class="text-sm font-medium text-gray-600 dark:text-gray-400 italic leading-snug">"{{ identityPayload.description }}"</p>
                       </div>
                     }
                     @if (identityPayload.idType !== 'N/A') {
                       <div class="mt-4">
                         <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Customer ID Proof details</p>
                         <div class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-800">
                            <div>
                               <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{{ identityPayload.idType }}</p>
                               <p class="text-sm font-black text-blue-700 dark:text-blue-300">{{ identityPayload.idValue }}</p>
                            </div>
                            @if (identityPayload.idDoc) {
                               <a [href]="identityPayload.idDoc" target="_blank" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm">View Proof &rarr;</a>
                            }
                         </div>
                       </div>
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
  public biometricService = inject(BiometricService);

  customerChitties: { scheme: ChittiScheme, customer: Customer }[] = [];
  activeLoans: InterestScheme[] = [];
  isDarkMode = false;
  activeMobileMenu: 'home' | 'security' = 'home';
  activeTab: 'home' | 'security' = 'home';
  isBiometricEnabled = false;

  availableYears: number[] = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  selectedYearOverall: number = new Date().getFullYear();
  selectedYearStatement: number = new Date().getFullYear();

  selectedChit: { scheme: ChittiScheme, customer: Customer } | null = null;
  selectedLoan: InterestScheme | null = null;
  showIdentityPopup = false;
  identityPayload: any = null;

  openIdentityProfile(type: 'chit' | 'loan', payload: any) {
    if (type === 'chit') {
      const cust = payload as { scheme: ChittiScheme, customer: Customer };
      this.identityPayload = {
        name: cust.customer.name,
        phone: cust.customer.phone,
        email: cust.customer.email || 'N/A',
        address: cust.customer.address || 'N/A',
        username: cust.customer.username || 'N/A',
        schemeType: 'Chitti',
        targetScheme: cust.scheme.name,
        joinedDate: cust.customer.joinedDate || 'N/A',
        status: cust.customer.status || 'Active',
        description: `A ${cust.scheme.tenure}-month Chitti scheme totaling ₹${cust.scheme.totalValue}.`,
        type: 'Chit Member',
        idType: 'N/A',
        idValue: 'N/A',
        idDoc: null
      };
    } else {
      const loan = payload as InterestScheme;
      this.identityPayload = {
        name: loan.borrowerName,
        phone: loan.borrowerPhone,
        email: loan.borrowerEmail || 'N/A',
        address: 'N/A',
        username: loan.borrowerUsername || 'N/A',
        schemeType: 'Interest Loan',
        targetScheme: loan.name,
        joinedDate: loan.startDate || 'N/A',
        status: 'Active',
        description: loan.description || 'N/A',
        type: 'Loan Borrower',
        idType: loan.borrowerIdType || 'N/A',
        idValue: loan.borrowerIdValue || 'N/A',
        idDoc: loan.borrowerIdDoc || null
      };
    }
    this.showIdentityPopup = true;
  }

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  isUpdating = false;

  get totalOutstanding(): number {
    let chitPending = this.customerChitties.reduce((sum, item) => sum + this.getChitPending(item.scheme, item.customer), 0);
    let loanPending = this.activeLoans.reduce((sum, loan) => sum + this.getBalance(loan) + this.getPendingInterest(loan), 0);
    return chitPending + loanPending;
  }

  ngOnInit() {
    this.isBiometricEnabled = this.biometricService.isBiometricEnabled();
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
              if (scheme) {
                this.customerChitties.push({ scheme, customer: cust });
                this.generateOverallChart();
              }
            });
          });
        });

        // Load Loans for this customer
        this.interestService.getInterests().subscribe(allLoans => {
          this.activeLoans = allLoans.filter(l => l.borrowerPhone === profile.phone)
            .sort((a, b) => this.getNextInterestDate(a).getTime() - this.getNextInterestDate(b).getTime());
          this.generateOverallChart();
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

  getMonthsElapsed(startDate: string): number {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    if (isNaN(start.getTime())) return 0;

    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) {
      months--;
    }
    return Math.max(0, months);
  }

  getPendingInterest(loan: InterestScheme): number {
    if (!loan.startDate) return 0;
    const months = this.getMonthsElapsed(loan.startDate);
    const balance = this.getBalance(loan);
    const expectedInterest = balance * (loan.interestRate / 100) * months;
    const paidInterest = this.getLoanInterestPaid(loan);

    return Math.max(0, expectedInterest - paidInterest);
  }

  getNextInterestDate(loan: InterestScheme): Date {
    if (!loan.startDate) return new Date();
    const start = new Date(loan.startDate);
    const now = new Date();
    let nextDate = new Date(now.getFullYear(), now.getMonth(), start.getDate());

    if (nextDate.getTime() < now.getTime()) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, start.getDate());
    }
    return nextDate;
  }

  getLastInterestDate(loan: InterestScheme): Date | null {
    if (!loan.interestCollections || loan.interestCollections.length === 0) return null;
    const sorted = [...loan.interestCollections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  }

  getNextPayableDate(loan: InterestScheme): Date | null {
    if (!loan.startDate) return null;
    const start = new Date(loan.startDate);
    const now = new Date();
    if (isNaN(start.getTime())) return null;

    let nextDate = new Date(now.getFullYear(), now.getMonth(), start.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (today.getTime() > nextDate.getTime()) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, start.getDate());
    }

    return nextDate;
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

  openChitHistory(item: { scheme: ChittiScheme, customer: Customer }) {
    this.selectedChit = item;
    this.selectedYearStatement = new Date().getFullYear();
    this.generateChitChart(item);
  }
  openLoanHistory(loan: InterestScheme) {
    this.selectedLoan = loan;
    this.selectedYearStatement = new Date().getFullYear();
    this.generateLoanChart(loan);
  }

  onStatementYearChange(year: number) {
    if (this.selectedChit) this.generateChitChart(this.selectedChit, year);
    if (this.selectedLoan) this.generateLoanChart(this.selectedLoan, year);
  }

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } }, stacked: true },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 9 }, callback: (val) => '₹' + Number(val).toLocaleString() }
      }
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } },
      tooltip: {
        backgroundColor: '#1f2937', titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' }, padding: 12, cornerRadius: 8,
        callbacks: { label: (ctx) => ` ₹${(ctx.parsed.y || 0).toLocaleString()}` }
      }
    }
  };
  public chartType: ChartType = 'bar';
  public chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public overallChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  generateOverallChart(year: number = this.selectedYearOverall) {
    this.selectedYearOverall = year;
    const labels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chittiData: number[] = new Array(12).fill(0);
    const loanPrincipalData: number[] = new Array(12).fill(0);
    const loanInterestData: number[] = new Array(12).fill(0);

    this.customerChitties.forEach(item => {
      (item.customer.payments || []).forEach(p => {
        const pd = new Date(p.date);
        if (pd.getFullYear() === year) chittiData[pd.getMonth()] += p.amount;
      });
    });

    this.activeLoans.forEach(loan => {
      (loan.settlements || []).forEach(s => {
        const sd = new Date(s.date);
        if (sd.getFullYear() === year) loanPrincipalData[sd.getMonth()] += s.amount;
      });
      (loan.interestCollections || []).forEach(c => {
        const cd = new Date(c.date);
        if (cd.getFullYear() === year) loanInterestData[cd.getMonth()] += c.amount;
      });
    });

    this.overallChartData = {
      labels,
      datasets: [
        { data: chittiData, label: 'Chitti Installments', backgroundColor: '#a855f7', borderRadius: 4 },
        { data: loanPrincipalData, label: 'Loan Principal', backgroundColor: '#22c55e', borderRadius: 4 },
        { data: loanInterestData, label: 'Loan Interest', backgroundColor: '#6366f1', borderRadius: 4 }
      ]
    };
  }

  generateChitChart(item: { scheme: ChittiScheme, customer: Customer }, year: number = this.selectedYearStatement) {
    this.selectedYearStatement = year;
    const labels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const paymentData: number[] = new Array(12).fill(0);

    (item.customer.payments || []).forEach(p => {
      const pd = new Date(p.date);
      if (pd.getFullYear() === year) paymentData[pd.getMonth()] += p.amount;
    });

    this.chartData = {
      labels,
      datasets: [
        { data: paymentData, label: 'Installments Paid', backgroundColor: '#a855f7', borderRadius: 4 }
      ]
    };
  }

  generateLoanChart(loan: InterestScheme, year: number = this.selectedYearStatement) {
    this.selectedYearStatement = year;
    const labels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const principalData: number[] = new Array(12).fill(0);
    const interestData: number[] = new Array(12).fill(0);

    (loan.settlements || []).forEach(s => {
      const sd = new Date(s.date);
      if (sd.getFullYear() === year) principalData[sd.getMonth()] += s.amount;
    });
    (loan.interestCollections || []).forEach(c => {
      const cd = new Date(c.date);
      if (cd.getFullYear() === year) interestData[cd.getMonth()] += c.amount;
    });

    this.chartData = {
      labels,
      datasets: [
        { data: principalData, label: 'Principal Paid', backgroundColor: '#22c55e', borderRadius: 4 },
        { data: interestData, label: 'Interest Paid', backgroundColor: '#6366f1', borderRadius: 4 }
      ]
    };
  }

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
          await this.authService.changePassword(profileVal.username, this.passwordForm.value.newPassword, 'customer');
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

  async toggleBiometric(event: any) {
    const enabled = event.target.checked;
    if (enabled) {
      const success = await this.biometricService.getCredentials();
      if (success) {
        this.isBiometricEnabled = true;
        this.biometricService.setBiometricEnabled(true);
        this.toast.success('Biometric login enabled. It will be active from your next login.');
      } else {
        event.target.checked = false;
        this.isBiometricEnabled = false;
        this.toast.error('Identity verification failed.');
      }
    } else {
      this.isBiometricEnabled = false;
      await this.biometricService.clearCredentials();
      this.toast.success('Biometric login disabled.');
    }
  }

  logout() { this.router.navigate(['/login']); }
  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
