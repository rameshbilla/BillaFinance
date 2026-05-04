import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { RentalService, RentalHouse, RentalBill } from '../../admin/services/rental.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
Chart.register(zoomPlugin);

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <style>
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      
      .glass-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
      .dark .bottom-nav-pill {
        background: rgba(15, 23, 42, 0.9) !important;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      
      .history-step { position: relative; padding-left: 3.2rem; }
      .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
      .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
      
      .bottom-nav-pill {
        display: flex;
        width: 100%;
        height: 64px;
        padding-bottom: env(safe-area-inset-bottom, 0);
        z-index: 100;
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
        color: #94a3b8;
      }
      .nav-item-box:active .nav-icon {
        transform: scale(0.9);
      }

      /* Mobile chart scroll lock */
      @media (max-width: 639px) {
        .chart-touch-wrapper { touch-action: none; }
      }
    </style>

    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 pb-32 sm:pb-0 relative overflow-x-hidden w-full">
      <!-- Decorative Background Glows (Match Login Screen) -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/10 rounded-full mix-blend-screen filter blur-[128px] pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 dark:bg-pink-600/10 rounded-full mix-blend-screen filter blur-[128px] pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none"></div>

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
        @if (!selectedChit && !selectedLoan && !selectedHouse) {
          <!-- Welcome Section -->
          <section class="fade-in-up" *ngIf="authService.userProfile$ | async as profile" style="animation-delay: 0.1s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-2">
              <div>
                <p class="text-[10px] sm:text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.3em] mb-2">Welcome Back</p>
                <h2 class="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{{ profile.displayName }}</h2>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mt-8 relative z-10">
               <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-3xl p-5 border border-purple-500/50 shadow-sm transition-all duration-500">
                  <p class="text-[8px] sm:text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 leading-none">Total Outstanding</p>
                  <p class="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="totalOutstanding" prefix="₹"></p>
               </div>
               <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-3xl p-5 border border-blue-500/50 text-right shadow-sm transition-all duration-500">
                  <p class="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Active Products</p>
                  <p class="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{{ customerChitties.length + activeLoans.length + tenantHouses.length }}</p>
               </div>
            </div>
          </section>

        <!-- OVERALL ACTIVITY CHART -->
        <section *ngIf="(customerChitties.length > 0 || activeLoans.length > 0) && overallChartData.datasets.length > 0" class="fade-in-up mb-10 relative z-10" style="animation-delay: 0.15s">
          <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-[2.5rem] p-6 border border-white/50 dark:border-white/10 shadow-sm">
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
             <div class="w-full h-[200px] sm:h-[250px] chart-touch-wrapper"
                  (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            @for (item of customerChitties; track item.scheme.id) {
              <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-[2.5rem] p-6 sm:p-8 border border-white/50 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
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
                    <p class="text-xl font-black text-red-600 tracking-tighter leading-none" [appCountUp]="getChitPending(item.scheme, item.customer)" prefix="₹"></p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Paid Status</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="getChitPaid(item.customer)" prefix="₹"></p>
                  </div>
                  <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1 text-right">Tenure Remaining</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter text-right" [appCountUp]="item.scheme.tenure - (getChitPaid(item.customer) / item.scheme.monthlyAmount)" suffix=" Mo"></p>
                  </div>
                </div>

                <div class="space-y-3 mb-6 px-1">
                  <div class="flex justify-between items-end">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Progress (<span [appCountUp]="getChitPaid(item.customer) / item.scheme.monthlyAmount"></span>/{{ item.scheme.tenure }})</p>
                    <p class="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-tighter" [appCountUp]="(getChitPaid(item.customer) / (item.scheme.monthlyAmount * item.scheme.tenure)) * 100" suffix="%"></p>
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            @for (loan of activeLoans; track loan.id) {
              <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-[2.5rem] p-6 sm:p-8 border border-white/50 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group">
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
                    <p class="text-xl font-black text-red-600 tracking-tighter leading-none" [appCountUp]="getBalance(loan) + getPendingInterest(loan)" prefix="₹"></p>
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
                    <p class="text-base font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="getBalance(loan)" prefix="₹"></p>
                    <p class="text-[7px] text-gray-400 font-bold mt-1 uppercase">ROI: {{ loan.interestRate }}%</p>
                  </div>
                  <div class="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                    <p class="text-[8px] font-black text-orange-400 uppercase mb-0.5 text-right">Interest Due</p>
                    <p class="text-base font-black text-orange-600 tracking-tighter text-right" [appCountUp]="getPendingInterest(loan)" prefix="₹"></p>
                    <p class="text-[7px] text-orange-400 font-bold mt-1 text-right uppercase">Last Paid: {{ getLastInterestDate(loan) | date:'dd MMM' }}</p>
                  </div>
                </div>

                <div class="space-y-3 mb-6 px-1">
                  <div class="flex justify-between items-end">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Principal Paid: <span class="text-green-600" [appCountUp]="getLoanPaid(loan)" prefix="₹"></span></p>
                    <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter" [appCountUp]="(getLoanPaid(loan) / loan.amount * 100)" suffix="% Released"></p>
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

        <!-- RENTAL HOUSES -->
        <section *ngIf="tenantHouses.length > 0" class="fade-in-up" style="animation-delay: 0.35s">
          <div class="flex items-center gap-3 mb-6">
             <div class="h-6 w-1.5 bg-green-600 rounded-full"></div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Rental Properties</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            @for (house of tenantHouses; track house.id) {
              <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-[2.5rem] p-6 sm:p-8 border border-white/50 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="flex justify-between items-start mb-6">
                  <div class="min-w-0">
                    <h4 class="text-xl font-black text-gray-900 dark:text-white mb-2 truncate">{{ house.houseName }}</h4>
                    <span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[8px] font-black uppercase tracking-widest rounded-md">Tenant Account</span>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Advance Paid</p>
                    <p class="text-xl font-black text-green-600 tracking-tighter leading-none" [appCountUp]="house.advanceAmount" prefix="₹"></p>
                  </div>
                </div>

                <div class="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-3xl mb-6">
                   <div class="flex justify-between items-center mb-2">
                      <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Occupancy</p>
                      <p class="text-[10px] font-black text-gray-700 dark:text-white uppercase tracking-widest">{{ house.status }}</p>
                   </div>
                   <div class="flex justify-between items-center">
                      <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Joined Since</p>
                      <p class="text-[10px] font-black text-gray-700 dark:text-white uppercase tracking-widest">{{ house.arrivedDate | date:'mediumDate' }}</p>
                   </div>
                </div>

                <button (click)="openRentalHistory(house)" class="w-full py-3.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] transition-all shadow-lg active:scale-95">Billing Statement</button>
              </div>
            }
          </div>
        </section>

        <!-- No Active Schemes State -->
        <div *ngIf="customerChitties.length === 0 && activeLoans.length === 0 && tenantHouses.length === 0" class="py-20 text-center">
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">No active records found</h3>
            <p class="text-gray-500 mt-2">You don't have any active chit, loan, or rental schemes at the moment.</p>
        </div>
        } @else {
           <!-- FULL SCREEN STATEMENT VIEW -->
           <div class="fixed inset-0 z-[110] bg-[#f8fafc] dark:bg-gray-950 animate-in slide-in-from-bottom duration-500 pb-20">
             <!-- Decorative Background Glows (Match Dashboard) -->
             <div class="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/5 rounded-full mix-blend-screen filter blur-[128px] pointer-events-none"></div>
             <div class="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/10 dark:bg-pink-600/5 rounded-full mix-blend-screen filter blur-[128px] pointer-events-none"></div>

             <div class="max-w-4xl mx-auto px-4 py-8 relative z-10">
               <button (click)="selectedChit = null; selectedLoan = null; selectedHouse = null" class="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-purple-600 transition-colors uppercase tracking-[0.2em] mb-8 bg-white/50 dark:bg-gray-900/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 backdrop-blur-sm shadow-sm active:scale-95 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Close Statement
               </button>
               
               <div class="w-full mt-2 overflow-hidden transition-all">
               <div class="sm:p-10">
                  <div class="flex justify-between items-start mb-8">
                     <div>
                        <div class="flex items-center gap-2 mb-1">
                           <span class="w-3 h-3 rounded-full" [class]="selectedChit ? 'bg-purple-500' : (selectedLoan ? 'bg-blue-500' : 'bg-green-500')"></span>
                           <h3 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                             {{ selectedChit ? selectedChit.scheme.name : (selectedLoan ? selectedLoan.name : selectedHouse?.houseName) }}
                           </h3>
                        </div>
                        <p class="text-gray-500 font-medium">Transaction Statement</p>
                     </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">
                         {{ selectedChit ? 'Total Paid' : (selectedLoan ? 'Principal Paid' : 'Security Deposit') }}
                       </p>
                       <p class="text-2xl font-black text-gray-900 dark:text-white truncate">
                         <span [appCountUp]="(selectedChit ? getChitPaid(selectedChit.customer) : (selectedLoan ? getLoanPaid(selectedLoan) : selectedHouse?.advanceAmount)) || 0" prefix="₹"></span>
                       </p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Balance</p>
                       <p class="text-2xl font-black text-red-600 truncate">
                         @if (selectedChit) {
                            <span [appCountUp]="getChitPending(selectedChit.scheme, selectedChit.customer)" prefix="₹"></span>
                         } @else if (selectedLoan) {
                            <span [appCountUp]="getBalance(selectedLoan)" prefix="₹"></span>
                         } @else if (selectedHouse) {
                            <span [appCountUp]="(selectedHouse.bills && selectedHouse.bills.length > 0) ? selectedHouse.bills[selectedHouse.bills.length-1].total : 0" prefix="₹"></span>
                         }
                       </p>
                    </div>
                  </div>

                  @if (selectedLoan || selectedChit) {
                     <div class="w-full h-[220px] sm:h-[260px] mb-8 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#0f172a] shadow-sm relative overflow-hidden">
                        <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
                           <div class="flex items-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                              <button (click)="panChart(100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-purple-600 transition-all" title="Move Left">
                                 <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <button (click)="zoomChart(1.1)" class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-purple-600 transition-all" title="Zoom In">
                                 <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                              </button>
                              <button (click)="resetChartZoom()" class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-purple-600 transition-all" title="Reset Zoom">
                                 <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              </button>
                              <button (click)="zoomChart(0.9)" class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-purple-600 transition-all" title="Zoom Out">
                                 <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                              </button>
                              <button (click)="panChart(-100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-purple-600 transition-all" title="Move Right">
                                 <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                              </button>
                           </div>
                           <div class="relative">
                              <select [(ngModel)]="selectedYearStatement" (ngModelChange)="onStatementYearChange($event)"
                                      class="pl-3 pr-8 py-1.5 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-purple-500 transition-colors cursor-pointer appearance-none">
                                 <option *ngFor="let y of availableYears" [ngValue]="y">{{y}}</option>
                              </select>
                              <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" /></svg>
                           </div>
                        </div>
                         <div class="w-full h-full pt-8 chart-touch-wrapper"
                              (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                            <canvas #baseChartRef="base-chart" baseChart [data]="chartData" [options]="chartOptions" [type]="chartType"></canvas>
                         </div>
                     </div>
                  }

                  @if (selectedHouse) {
                      <div class="overflow-x-auto no-scrollbar -mx-8 sm:mx-0">
                         <table class="w-full text-left border-collapse min-w-[650px]">
                            <thead>
                               <tr class="bg-green-600 text-white uppercase text-[9px] font-black tracking-widest">
                                  <th class="p-4 rounded-tl-2xl">Bill Date</th>
                                  <th class="p-4">Rent</th>
                                  <th class="p-4">Electric</th>
                                  <th class="p-4">Water</th>
                                  
                                  
                                  <th class="p-4">Total</th>
                                   <th class="p-4 rounded-tr-2xl">Status</th>
                               </tr>
                            </thead>
                            <tbody class="text-xs font-bold text-gray-700 dark:text-gray-300">
                               @for (bill of selectedHouse.bills; track $index) {
                                  <tr class="border-b border-gray-50 dark:border-gray-800/50">
                                     <td class="p-4 font-black text-green-600">{{ bill.billDate | date:'MMM dd, yyyy' }}</td>
                                     <td class="p-4" [appCountUp]="bill.rentAmount" prefix="₹"></td>
                                     <td class="p-4" [appCountUp]="bill.electricBill" prefix="₹"></td>
                                     <td class="p-4" [appCountUp]="bill.waterBill" prefix="₹"></td>
                                     
                                     
                                     <td class="p-4 font-black text-gray-900 dark:text-white bg-green-50/30" [appCountUp]="bill.total" prefix="₹"></td>
                                      <td class="p-4">
                                         <span class="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest"
                                            [class]="bill.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                                            {{ bill.status || 'Pending' }}
                                         </span>
                                      </td>
                                  </tr>
                               }
                            </tbody>
                         </table>
                      </div>
                  }

                  <div class="pr-3 space-y-0 custom-scrollbar mt-2">
                     @if (selectedChit) {
                        @let chitTrans = sortLatest(selectedChit.customer.payments);
                        @for (payment of chitTrans; track payment.id; let i = $index) {
                           <div class="history-step group relative pb-6">
                              @if (i < chitTrans.length - 1) { <div class="stepper-line bg-purple-500/30"></div> }
                              <div class="stepper-dot w-8 h-8 rounded-full flex items-center justify-center text-white bg-purple-600 shadow-lg shadow-purple-500/30 z-10 transition-transform group-hover:scale-110">
                                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                              <div class="p-4 bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-purple-500/30 shadow-sm transition-all hover:shadow-md hover:border-purple-200 flex justify-between items-center">
                                 <div>
                                    <p class="font-bold text-gray-900 dark:text-white">{{ payment.date | date:'longDate' }}</p>
                                    <p class="text-[10px] text-purple-500 font-black uppercase tracking-widest mt-1">REF: {{ payment.id?.slice(-8) || 'N/A' }}</p>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-xl font-black text-gray-900 dark:text-white" [appCountUp]="payment.amount" prefix="+₹"></p>
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
                              <div class="p-4 bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm transition-all flex justify-between items-center"
                                   [class]="item.type === 'interest' ? 'hover:border-indigo-200 hover:shadow-md dark:border-indigo-500/30' : 'hover:border-green-200 hover:shadow-md dark:border-green-500/30'">
                                <div>
                                   <p class="font-bold text-gray-900 dark:text-white leading-tight">{{ item.date | date:'longDate' }}</p>
                                   <p class="text-[9px] font-black uppercase tracking-widest mt-1" [class]="item.type === 'interest' ? 'text-indigo-500' : 'text-green-500'">
                                     {{ item.type === 'interest' ? 'Interest Payment' : 'Principal Repayment' }}
                                   </p>
                                </div>
                                <div class="text-right">
                                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount Paid</p>
                                  <p class="text-xl font-black leading-none" [class]="item.type === 'interest' ? 'text-indigo-600' : 'text-green-600'">
                                    <span [appCountUp]="item.amount" prefix="+₹"></span>
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
           </div>
        }
      </main>

      <!-- Bottom Mobile Nav -->
      <div class="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-500">
         <div class="bottom-nav-pill pointer-events-auto relative flex items-center px-4">
            
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
                            @if (identityPayload.idDocs && identityPayload.idDocs.length > 0) {
                               <div class="flex flex-wrap gap-2 justify-end">
                                  @for (doc of identityPayload.idDocs; track doc; let i = $index) {
                                     <a [href]="doc" target="_blank" class="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-sm transition-transform hover:scale-110 block" title="View Document {{ i + 1 }}">
                                        <img [src]="doc" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                        <div class="hidden w-full h-full flex-col items-center justify-center text-blue-400 absolute inset-0 bg-blue-50 dark:bg-blue-900/50">
                                           <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                           <span class="text-[7px] font-black uppercase">Doc</span>
                                        </div>
                                        <div class="absolute inset-0 bg-black/0 group-hover:bg-blue-900/20 transition-colors"></div>
                                     </a>
                                  }
                               </div>
                            } @else if (identityPayload.idDoc) {
                               <a [href]="identityPayload.idDoc" target="_blank" class="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-sm transition-transform hover:scale-110 block" title="View Document">
                                  <img [src]="identityPayload.idDoc" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                  <div class="hidden w-full h-full flex-col items-center justify-center text-blue-400 absolute inset-0 bg-blue-50 dark:bg-blue-900/50">
                                     <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                     <span class="text-[7px] font-black uppercase">Doc</span>
                                  </div>
                                  <div class="absolute inset-0 bg-black/0 group-hover:bg-blue-900/20 transition-colors"></div>
                               </a>
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
  private rentalService = inject(RentalService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  public biometricService = inject(BiometricService);

  customerChitties: { scheme: ChittiScheme, customer: Customer }[] = [];
  activeLoans: InterestScheme[] = [];
  tenantHouses: RentalHouse[] = [];
  isDarkMode = false;
  activeMobileMenu: 'home' | 'security' = 'home';
  activeTab: 'home' | 'security' = 'home';
  isBiometricEnabled = false;

  availableYears: number[] = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  selectedYearOverall: number = new Date().getFullYear();
  selectedYearStatement: number = new Date().getFullYear();

  selectedChit: { scheme: ChittiScheme, customer: Customer } | null = null;
  selectedLoan: InterestScheme | null = null;
  selectedHouse: RentalHouse | null = null;
  showIdentityPopup = false;
  identityPayload: any = null;

  openRentalHistory(house: RentalHouse) {
    this.selectedHouse = house;
    this.selectedChit = null;
    this.selectedLoan = null;
    this.scrollToTop();
  }

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
        idDoc: null,
        idDocs: []
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
        idDoc: loan.borrowerIdDoc || null,
        idDocs: loan.borrowerIdDocs || []
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
    let rentPending = this.tenantHouses.reduce((sum, house) => {
      const latestBill = house.bills?.length ? house.bills[house.bills.length - 1] : null;
      return sum + (latestBill ? latestBill.total : 0);
    }, 0);
    return chitPending + loanPending + rentPending;
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

        // Load Rental Houses for this tenant
        this.rentalService.getHouses().subscribe((allHouses: RentalHouse[]) => {
          this.tenantHouses = allHouses.filter(h => h.renterPhone === profile.phone);
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
    this.selectedHouse = null;
    this.selectedLoan = null;
    this.selectedYearStatement = new Date().getFullYear();
    this.generateChitChart(item);
  }
  openLoanHistory(loan: InterestScheme) {
    this.selectedLoan = loan;
    this.selectedHouse = null;
    this.selectedChit = null;
    this.selectedYearStatement = new Date().getFullYear();
    this.generateLoanChart(loan);
  }

  onStatementYearChange(year: number) {
    if (this.selectedChit) this.generateChitChart(this.selectedChit, year);
    if (this.selectedLoan) this.generateLoanChart(this.selectedLoan, year);
  }

  @ViewChild('baseChartRef') chart?: BaseChartDirective;

  resetChartZoom() {
    if (this.chart && this.chart.chart) {
      (this.chart.chart as any).resetZoom();
    }
  }

  zoomChart(amount: number) {
    if (this.chart && this.chart.chart) {
      (this.chart.chart as any).zoom(amount);
    }
  }

  panChart(amount: number) {
    if (this.chart && this.chart.chart) {
      (this.chart.chart as any).pan({ x: amount });
    }
  }

  getChartOptions(): ChartConfiguration['options'] {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 9, weight: 'bold' } },
          stacked: true
        },
        y: {
          beginAtZero: true,
          stacked: true,
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 9 }, callback: (val) => '₹' + Number(val).toLocaleString() }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { 
            color: textColor, 
            usePointStyle: true,
            padding: 10,
            font: { size: 9, weight: 'bold' } 
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#1f2937',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 13, weight: 'bold' },
          padding: 12,
          cornerRadius: 8,
          callbacks: { label: (ctx) => ` ₹${(ctx.parsed.y || 0).toLocaleString()}` }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            threshold: 10
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
            drag: {
              enabled: true,
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              borderColor: 'rgba(124, 58, 237, 0.4)',
              borderWidth: 1
            }
          }
        }
      }
    };
  }

  public chartOptions: ChartConfiguration['options'] = this.getChartOptions();
  public chartType: ChartType = 'line';
  public chartData: ChartData<'line'> = { labels: [], datasets: [] };
  public overallChartData: ChartData<'line'> = { labels: [], datasets: [] };

  generateOverallChart(year: number = this.selectedYearOverall) {
    this.selectedYearOverall = year;
    const labels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chittiData: number[] = new Array(12).fill(0);

    this.customerChitties.forEach(item => {
      (item.customer.payments || []).forEach(p => {
        const pd = new Date(p.date);
        if (pd.getFullYear() === year) chittiData[pd.getMonth()] += p.amount;
      });
    });

    const datasets: any[] = [];
    if (this.customerChitties.length > 0) {
       datasets.push({ data: chittiData, label: 'Chitti Installments', borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#a855f7' });
    }

    const loanColors = [
      { border: '#22c55e', bg: 'rgba(34,197,94,0.1)' }, // Green
      { border: '#6366f1', bg: 'rgba(99,102,241,0.1)' }, // Indigo
      { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }, // Amber
      { border: '#06b6d4', bg: 'rgba(6,182,212,0.1)' }, // Cyan
      { border: '#ec4899', bg: 'rgba(236,72,153,0.1)' }, // Pink
      { border: '#ef4444', bg: 'rgba(239,68,68,0.1)' }  // Red
    ];

    this.activeLoans.forEach((loan, index) => {
      const loanPrincipalData: number[] = new Array(12).fill(0);
      const loanInterestData: number[] = new Array(12).fill(0);

      (loan.settlements || []).forEach(s => {
        const sd = new Date(s.date);
        if (sd.getFullYear() === year) loanPrincipalData[sd.getMonth()] += s.amount;
      });
      (loan.interestCollections || []).forEach(c => {
        const cd = new Date(c.date);
        if (cd.getFullYear() === year) loanInterestData[cd.getMonth()] += c.amount;
      });

      const pColor = loanColors[(index * 2) % loanColors.length];
      const iColor = loanColors[(index * 2 + 1) % loanColors.length];
      const labelPrin = this.activeLoans.length > 1 ? `${loan.name} Prin.` : 'Loan Principal';
      const labelInt = this.activeLoans.length > 1 ? `${loan.name} Int.` : 'Loan Interest';

      datasets.push({ data: loanPrincipalData, label: labelPrin, borderColor: pColor.border, backgroundColor: pColor.bg, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: pColor.border });
      datasets.push({ data: loanInterestData, label: labelInt, borderColor: iColor.border, backgroundColor: iColor.bg, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: iColor.border });
    });

    this.overallChartData = {
      labels,
      datasets
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
        { data: paymentData, label: 'Installments Paid', borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#a855f7' }
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
        { data: principalData, label: 'Principal Paid', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22c55e' },
        { data: interestData, label: 'Interest Paid', borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1' }
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
    this.chartOptions = this.getChartOptions();
    if (this.chart) {
      this.chart.update();
    }
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

  lockScroll() { document.body.style.overflow = 'hidden'; }
  unlockScroll() { document.body.style.overflow = ''; }
}

