import { Component, inject, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricService } from '../../services/biometric.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { RentalService, RentalHouse, RentalBill, printHraReceipt } from '../../admin/services/rental.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { Capacitor } from '@capacitor/core';
import { TspdclService, TspdclBillDetails } from '../../admin/services/tspdcl.service';
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
        min-width: 100%;
        height: 64px;
        padding-bottom: env(safe-area-inset-bottom, 0);
        z-index: 100;
      }
      .nav-item-box {
        flex: 1 1 0%;
        min-width: 48px;
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

      @keyframes neon-pulse {
        0%, 100% { color: #f97316; filter: drop-shadow(0 0 2px #f97316); transform: scale(1); }
        25% { color: #00ffaa; filter: drop-shadow(0 0 8px #00ffaa); }
        50% { color: #f0f; filter: drop-shadow(0 0 10px #f0f); transform: scale(1.1); }
        75% { color: #0ff; filter: drop-shadow(0 0 8px #0ff); }
      }
      .game-icon-pulse { animation: neon-pulse 4s infinite ease-in-out; }
    </style>

    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 pb-32 sm:pb-0 relative overflow-x-hidden w-full max-w-full-mobile">
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
              <button (click)="goToGame()" class="p-2 transition-all hidden sm:flex items-center gap-2 group" title="Play Neon Racer">
                <div class="game-icon-pulse">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h.01M5 17h.01M3 13h18M5 10l2-4h10l2 4M3 13l1 4h16l1-4m-18 0h18M5 17h.01M19 17h.01" />
                  </svg>
                </div>
                <span class="text-xs font-black uppercase tracking-widest group-hover:text-orange-400 transition-colors">Racing</span>
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
            
            <!-- Rent & Utilities Hero Card (tenants only) -->
            <ng-container *ngIf="tenantHouses.length > 0 && tenantHouses[0] as house">
              <div class="mt-6 relative z-10">

                <!-- Property Identity Bar -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-base font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">{{ house.houseName }}</h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{{ house.fullAddress || 'Rental Property' }}</p>
                  </div>
                  <span class="ml-auto flex-shrink-0 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
                        [ngClass]="house.status === 'Occupied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'">
                    {{ house.status }}
                  </span>
                </div>

                <!-- Main Hero Card -->
                <div class="glass-card bg-white/90 dark:bg-[#0f172a] rounded-3xl border border-white/60 dark:border-white/10 shadow-lg overflow-hidden">

                  <!-- Payment Strips Row -->
                  <div class="grid grid-cols-2 divide-x divide-gray-100 dark:divide-white/5">

                    <!-- Rent Strip -->
                    <div class="p-4">
                      <div class="flex items-center gap-1.5 mb-2">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monthly Rent</span>
                      </div>
                      <p class="text-xl font-black tracking-tighter leading-none"
                         [ngClass]="(house.bills && house.bills.length > 0 && house.bills[house.bills.length-1].status === 'Paid') ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                        ₹{{ house.monthlyRent | number }}
                      </p>
                      <div class="flex items-center gap-1 mt-1.5">
                        <div class="w-1.5 h-1.5 rounded-full animate-pulse"
                             [ngClass]="(house.bills && house.bills.length > 0 && house.bills[house.bills.length-1].status === 'Paid') ? 'bg-green-500' : 'bg-red-400'"></div>
                        <span class="text-[9px] font-black uppercase tracking-wider"
                              [ngClass]="(house.bills && house.bills.length > 0 && house.bills[house.bills.length-1].status === 'Paid') ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                          {{ (house.bills && house.bills.length > 0 && house.bills[house.bills.length-1].status === 'Paid') ? 'Paid' : 'Unpaid' }}
                        </span>
                      </div>
                    </div>

                    <!-- Electricity Strip -->
                    <div class="p-4">
                      <div class="flex items-center gap-1.5 mb-2">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Electricity</span>
                        <button *ngIf="house.electricMeterNo" (click)="fetchTenantElectricityBill(house.electricMeterNo)"
                                [disabled]="isFetchingElectricity"
                                class="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-40" title="Refresh">
                          <svg class="w-3 h-3 text-gray-400" [ngClass]="{'animate-spin': isFetchingElectricity}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                      <ng-container *ngIf="!isFetchingElectricity; else electricLoader">
                        <p class="text-xl font-black tracking-tighter leading-none"
                           [ngClass]="((tenantElectricityBill && tenantElectricityBill.totalAmountPayable > 0) ? tenantElectricityBill.isPaid : (house.bills && house.bills.length > 0 ? house.bills[house.bills.length-1].status === 'Paid' : false)) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                          ₹{{ (tenantElectricityBill && tenantElectricityBill.totalAmountPayable > 0) ? (tenantElectricityBill.totalAmountPayable | number) : ((house.bills && house.bills.length > 0) ? (house.bills[house.bills.length-1].electricBill | number) : '—') }}
                        </p>
                        <div class="flex items-center gap-1 mt-1.5">
                          <div class="w-1.5 h-1.5 rounded-full animate-pulse"
                               [ngClass]="(tenantElectricityBill && tenantElectricityBill.totalAmountPayable > 0) 
                                 ? (tenantElectricityBill.isPaid ? 'bg-green-500' : 'bg-red-400') 
                                 : (house.bills && house.bills.length > 0 ? (house.bills[house.bills.length-1].status === 'Paid' ? 'bg-green-500' : 'bg-red-400') : 'bg-gray-300 dark:bg-gray-600')"></div>
                          <span class="text-[9px] font-black uppercase tracking-wider"
                                [ngClass]="(tenantElectricityBill && tenantElectricityBill.totalAmountPayable > 0) 
                                  ? (tenantElectricityBill.isPaid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400') 
                                  : (house.bills && house.bills.length > 0 ? (house.bills[house.bills.length-1].status === 'Paid' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400') : 'text-gray-400')">
                            {{ (tenantElectricityBill && tenantElectricityBill.totalAmountPayable > 0) 
                              ? (tenantElectricityBill.isPaid ? 'Paid' : 'Unpaid') 
                              : (house.bills && house.bills.length > 0 ? (house.bills[house.bills.length-1].status === 'Paid' ? 'Paid' : 'Unpaid') : 'Unsynced') }}
                          </span>
                        </div>
                      </ng-container>
                      <ng-template #electricLoader>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="inline-block w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></span>
                          <span class="text-[9px] text-gray-400 font-bold">Fetching...</span>
                        </div>
                      </ng-template>
                    </div>
                  </div>

                  <!-- Property Details Section -->
                  <div class="border-t border-gray-100 dark:border-white/5 mx-0 px-4 py-3 bg-gray-50/50 dark:bg-white/2">
                    <div class="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div>
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Advance Paid</p>
                        <p class="text-xs font-black text-gray-900 dark:text-white">₹{{ house.advanceAmount | number }}<span class="text-[8px] text-gray-400 font-bold ml-1">({{ house.advanceMonths }}mo)</span></p>
                      </div>
                      <div>
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tenant Since</p>
                        <p class="text-xs font-black text-gray-700 dark:text-gray-300">{{ house.arrivedDate | date:'dd MMM yy' }}</p>
                      </div>
                      <div *ngIf="house.renterPhone">
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
                        <div class="flex items-center gap-1.5">
                          <svg class="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p class="text-xs font-black text-gray-700 dark:text-gray-300 font-mono">{{ house.renterPhone }}</p>
                        </div>
                      </div>
                      <div *ngIf="house.renterAadhar">
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Aadhar No.</p>
                        <div class="flex items-center gap-1.5">
                          <svg class="w-3 h-3 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          <p class="text-xs font-black text-gray-700 dark:text-gray-300 font-mono tracking-wider">
                            XXXX-XXXX-{{ house.renterAadhar | slice:-4 }}
                          </p>
                        </div>
                      </div>
                      <div *ngIf="house.electricMeterNo">
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Meter No.</p>
                        <p class="text-xs font-black text-gray-700 dark:text-gray-300 font-mono">{{ house.electricMeterNo }}</p>
                      </div>
                      <div *ngIf="house.renterName">
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tenant Name</p>
                        <p class="text-xs font-black text-gray-700 dark:text-gray-300 truncate">{{ house.renterName }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Owner / Landlord Contact Section -->
                  <div *ngIf="ownerProfile" class="border-t border-gray-100 dark:border-white/5 px-4 py-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/10">
                    <div class="flex items-center gap-2 mb-2.5">
                      <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/30">
                        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p class="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.18em]">Owner / Landlord</p>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-black text-gray-900 dark:text-white truncate">{{ ownerProfile.displayName || 'Owner' }}</p>
                        <div *ngIf="ownerProfile.phone" class="flex items-center gap-1 mt-0.5">
                          <svg class="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p class="text-[10px] font-black text-gray-600 dark:text-gray-400 font-mono">{{ ownerProfile.phone }}</p>
                        </div>
                      </div>
                      <div class="flex gap-1.5 flex-shrink-0">
                        <a *ngIf="ownerProfile.phone" [href]="'tel:' + ownerProfile.phone"
                           class="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white text-[8px] font-black uppercase tracking-wider rounded-xl shadow-sm shadow-green-500/25">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call
                        </a>
                        <a *ngIf="ownerProfile.phone" [href]="'https://wa.me/91' + ownerProfile.phone" target="_blank"
                           class="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1ebe59] active:scale-95 transition-all text-white text-[8px] font-black uppercase tracking-wider rounded-xl shadow-sm shadow-green-500/20">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                          </svg>
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons Row -->
                  <div class="border-t border-gray-100 dark:border-white/5 p-3 flex gap-2">
                    <button (click)="openRentalHistory(house)"
                            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      History
                    </button>
                    <ng-container *ngIf="house.electricMeterNo">
                      <button (click)="openBillPortal(house.electricMeterNo)"
                              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-orange-500/20">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Bill View
                      </button>
                      <button (click)="openElectricityPortal(house.electricMeterNo)"
                              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-green-500/20">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Pay Now
                      </button>
                    </ng-container>
                  </div>

                </div>
              </div>
            </ng-container>

            <!-- Non-tenant outstanding summary -->
            <ng-container *ngIf="tenantHouses.length === 0 && (customerChitties.length > 0 || activeLoans.length > 0)">
              <div class="mt-6 glass-card bg-white/80 dark:bg-[#0f172a] rounded-3xl p-5 border border-purple-500/30 shadow-sm relative z-10">
                <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Total Outstanding</p>
                <p class="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="totalOutstanding" prefix="₹"></p>
              </div>
            </ng-container>
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

        <!-- RENTAL HOUSES: Additional/Multiple Properties (if tenant has more than 1) -->
        <section *ngIf="tenantHouses.length > 1" class="fade-in-up" style="animation-delay: 0.35s">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-5 w-1 bg-green-500 rounded-full"></div>
            <h3 class="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Other Properties</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            @for (house of tenantHouses; track house.id; let i = $index) {
              @if (i > 0) {
              <div class="glass-card bg-white/80 dark:bg-[#0f172a] rounded-3xl p-5 border border-green-500/20 dark:border-green-500/10 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative group">
                <div class="flex items-start justify-between mb-4">
                  <div class="min-w-0">
                    <h4 class="text-base font-black text-gray-900 dark:text-white truncate">{{ house.houseName }}</h4>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{{ house.fullAddress || 'Property' }}</p>
                  </div>
                  <span class="ml-2 flex-shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest"
                        [ngClass]="house.status === 'Occupied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'">
                    {{ house.status }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-4">
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Monthly Rent</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ house.monthlyRent | number }}</p>
                  </div>
                  <div class="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3">
                    <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Since</p>
                    <p class="text-sm font-black text-gray-700 dark:text-gray-300">{{ house.arrivedDate | date:'MMM yy' }}</p>
                  </div>
                </div>
                <button (click)="openRentalHistory(house)"
                        class="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                  History
                </button>
              </div>
              }
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
                      <div class="overflow-x-auto no-scrollbar w-full">
                         <table class="w-full text-left border-collapse min-w-[650px]">
                            <thead>
                               <tr class="bg-green-600 text-white uppercase text-[9px] font-black tracking-widest">
                                  <th class="p-4 rounded-tl-2xl">Bill Date</th>
                                  <th class="p-4">Rent</th>
                                  <th class="p-4">Electric</th>
                                  <th class="p-4">Water</th>
                                  <th class="p-4">Total</th>
                                  <th class="p-4">Status</th>
                                  <th class="p-4 rounded-tr-2xl text-center">Receipt</th>
                               </tr>
                            </thead>
                            <tbody class="text-xs font-bold text-gray-700 dark:text-gray-300">
                               @for (bill of selectedHouse.bills; track $index) {
                                  <tr class="border-b border-gray-50 dark:border-gray-800/50">
                                     <td class="p-4 font-black text-green-600">{{ bill.billDate | date:'MMM dd, yyyy' }}</td>
                                     <td class="p-4 text-green-500" [appCountUp]="bill.rentAmount" prefix="₹"></td>
                                      <td class="p-4" [class]="bill.status === 'Pending' && bill.electricBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.electricBill" prefix="₹"></td>
                                      <td class="p-4" [class]="bill.status === 'Pending' && bill.waterBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.waterBill" prefix="₹"></td>
                                     <td class="p-4 font-black text-gray-900 dark:text-white bg-green-50/30" [appCountUp]="bill.total" prefix="₹"></td>
                                      <td class="p-4">
                                         <span class="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest"
                                            [class]="bill.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                                            {{ bill.status === 'Paid' ? 'Paid' : 'Unpaid' }}
                                         </span>
                                      </td>
                                      <td class="p-4 text-center">
                                         <button *ngIf="bill.status === 'Paid'" (click)="printRentReceipt(selectedHouse, bill)" class="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg transition-all" title="Download Rent Receipt">
                                            <svg class="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                         </button>
                                         <span *ngIf="bill.status !== 'Paid'" class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">---</span>
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
      <div class="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-500 pb-safe">
         <div class="bottom-nav-pill pointer-events-auto relative flex items-center px-4 overflow-hidden">
            
            <div class="absolute inset-1 flex pointer-events-none z-0">
               <div [style.flex-grow]="activeMobileMenu === 'home' ? 0 : (activeMobileMenu === 'security' ? 2 : 1)" class="transition-all duration-500 ease-in-out"></div>
               <div class="flex-none flex items-center justify-center" style="width: 33.333%">
                  <div class="h-full aspect-square bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/30 transition-all duration-500"></div>
               </div>
               <div [style.flex-grow]="activeMobileMenu === 'home' ? 2 : (activeMobileMenu === 'security' ? 0 : 1)" class="transition-all duration-500 ease-in-out"></div>
            </div>

            <!-- Home -->
            <div (click)="scrollToTop(); activeMobileMenu = 'home'; activeTab = 'home'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'home' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
            </div>

            <div (click)="goToGame()" 
                 class="nav-item-box">
               <div class="game-icon-pulse">
                 <svg class="w-7 h-7 nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h.01M5 17h.01M3 13h18M5 10l2-4h10l2 4M3 13l1 4h16l1-4m-18 0h18M5 17h.01M19 17h.01" />
                 </svg>
               </div>
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
        <div class="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xl max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl mobile-animate-slide duration-500 flex flex-col">
               <div class="p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
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

      <!-- HRA Rent Receipt Modal Overlay -->
      <div *ngIf="showReceiptModal && selectedReceiptHouse && selectedReceiptBill" class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
         <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col" (click)="$event.stopPropagation()">
            <div class="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
               <!-- Modal Header -->
               <div class="flex justify-between items-center mb-6">
                  <div>
                     <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Rent Receipt</h3>
                     <p class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1.5">HRA Documentation</p>
                  </div>
                  <button (click)="closeReceiptModal()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>
               </div>

               <!-- Receipt Visual Body (Ticket Look) -->
               <div class="bg-gray-50 dark:bg-gray-800/60 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white dark:bg-gray-900 rounded-r-full -ml-2 border-r border-dashed border-gray-200 dark:border-gray-700"></div>
                  <div class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white dark:bg-gray-900 rounded-l-full -mr-2 border-l border-dashed border-gray-200 dark:border-gray-700"></div>

                  <div class="flex justify-between items-start mb-6">
                     <div>
                        <h4 class="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">BillaFinance</h4>
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Digital Receipt</p>
                     </div>
                     <div class="text-right">
                        <span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md">Paid</span>
                        <p class="text-[9px] font-bold text-gray-500 mt-1.5">No: R-{{selectedReceiptBill.year}}-{{selectedReceiptBill.month.toUpperCase()}}</p>
                     </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-xs mb-6 border-b border-gray-200/50 dark:border-gray-700/50 pb-4">
                     <div>
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Tenant</p>
                        <p class="font-bold text-gray-800 dark:text-gray-200">{{selectedReceiptHouse.renterName}}</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">{{selectedReceiptHouse.renterPhone}}</p>
                     </div>
                     <div class="text-right">
                        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Property</p>
                        <p class="font-bold text-gray-800 dark:text-gray-200">{{selectedReceiptHouse.houseName}}</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">Date: {{ (selectedReceiptBill.paidDate ? selectedReceiptBill.paidDate : selectedReceiptBill.billDate) | date:'dd/MM/yyyy' }}</p>
                     </div>
                  </div>

                  <div class="space-y-2.5 text-xs">
                     <div class="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>House Rent ({{selectedReceiptBill.month}} {{selectedReceiptBill.year}})</span>
                        <span class="font-bold text-gray-800 dark:text-gray-200">₹{{selectedReceiptBill.rentAmount | number:'1.0-0'}}</span>
                     </div>
                     <div class="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Electricity Charges</span>
                        <span class="font-bold text-gray-800 dark:text-gray-200">₹{{selectedReceiptBill.electricBill | number:'1.0-0'}}</span>
                     </div>
                     <div class="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Water Charges</span>
                        <span class="font-bold text-gray-800 dark:text-gray-200">₹{{selectedReceiptBill.waterBill | number:'1.0-0'}}</span>
                     </div>
                     <div class="flex justify-between text-base font-black text-gray-900 dark:text-white border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        <span>Total Paid</span>
                        <span class="text-indigo-600 dark:text-indigo-400">₹{{selectedReceiptBill.total | number:'1.0-0'}}</span>
                     </div>
                  </div>
               </div>

               <!-- Action Buttons -->
               <div class="flex gap-4 mt-6">
                  <button (click)="closeReceiptModal()" class="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all">
                     Close
                  </button>
                  <button (click)="downloadReceipt()" class="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                     Download
                  </button>
               </div>
            </div>
         </div>
      </div>

      <!-- Identity Popup Modal -->
      @if (showIdentityPopup && identityPayload) {
        <div class="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xl max-h-[90vh] rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl mobile-animate-slide duration-300 border border-gray-100 dark:border-gray-800 flex flex-col">
               <div class="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1">
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
  private tspdclService = inject(TspdclService);

  customerChitties: { scheme: ChittiScheme, customer: Customer }[] = [];
  activeLoans: InterestScheme[] = [];
  tenantHouses: RentalHouse[] = [];
  isDarkMode = false;
  activeMobileMenu: 'home' | 'security' = 'home';
  activeTab: 'home' | 'security' = 'home';
  isBiometricEnabled = false;

  tenantElectricityBill: TspdclBillDetails | null = null;
  isFetchingElectricity = false;
  ownerProfile: any = null;

  availableYears: number[] = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  selectedYearOverall: number = new Date().getFullYear();
  selectedYearStatement: number = new Date().getFullYear();

  selectedChit: { scheme: ChittiScheme, customer: Customer } | null = null;
  selectedLoan: InterestScheme | null = null;
  selectedHouse: RentalHouse | null = null;
  showIdentityPopup = false;
  identityPayload: any = null;

  showReceiptModal = false;
  selectedReceiptHouse: RentalHouse | null = null;
  selectedReceiptBill: RentalBill | null = null;

  openRentalHistory(house: RentalHouse) {
    this.selectedHouse = house;
    this.selectedChit = null;
    this.selectedLoan = null;
    this.scrollToTop();
  }

  printRentReceipt(house: RentalHouse, bill: RentalBill) {
    this.selectedReceiptHouse = house;
    this.selectedReceiptBill = bill;
    this.showReceiptModal = true;
    document.body.classList.add('modal-open');
  }

  closeReceiptModal() {
    this.showReceiptModal = false;
    this.selectedReceiptHouse = null;
    this.selectedReceiptBill = null;
    document.body.classList.remove('modal-open');
  }

  downloadReceipt() {
    if (!this.selectedReceiptHouse || !this.selectedReceiptBill) return;
    const ownerName = this.ownerProfile?.displayName || 'Property Owner';
    const house = this.selectedReceiptHouse;
    const bill = this.selectedReceiptBill;
    const receiptNo = `R-${bill.year}-${bill.month.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = bill.paidDate ? new Date(bill.paidDate).toLocaleDateString('en-IN') : new Date(bill.billDate).toLocaleDateString('en-IN');

    const html = `
      <html>
        <head>
          <title>Rent Receipt - ${bill.month} ${bill.year}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
            .receipt-container { max-width: 700px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title { font-size: 24px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: -0.5px; }
            .logo-sub { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
            .receipt-badge { background: #ecfdf5; color: #047857; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block; }
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .section-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .detail-name { font-size: 15px; font-weight: 800; color: #0f172a; }
            .detail-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .invoice-table th { border-bottom: 2px solid #f1f5f9; padding: 12px 8px; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; text-align: left; }
            .invoice-table td { padding: 16px 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; }
            .invoice-table .amount { text-align: right; }
            .total-row td { border-top: 2px solid #e2e8f0; border-bottom: none; font-size: 16px !important; font-weight: 900 !important; color: #4f46e5; }
            .footer-note { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; line-height: 1.5; }
            .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
            .signature-box { border-top: 1px dashed #cbd5e1; width: 180px; text-align: center; padding-top: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div>
                <div class="logo-title">BillaFinance</div>
                <div class="logo-sub">Rent Receipt</div>
              </div>
              <div style="text-align: right;">
                <span class="receipt-badge">Paid Receipt</span>
                <div class="detail-sub" style="margin-top: 8px; font-weight: 700;">No: ${receiptNo}</div>
                <div class="detail-sub">Date: ${dateStr}</div>
              </div>
            </div>

            <div class="details-grid">
              <div>
                <div class="section-title">Tenant Details</div>
                <div class="detail-name">${house.renterName}</div>
                <div class="detail-sub">Phone: ${house.renterPhone}</div>
                <div class="detail-sub" style="margin-top: 8px;">Address: ${house.fullAddress || 'N/A'}</div>
              </div>
              <div>
                <div class="section-title">Landlord Details</div>
                <div class="detail-name">${ownerName || 'Property Owner'}</div>
                <div class="detail-sub">PAN: ${house.landlordPan || 'N/A'}</div>
                <div class="detail-sub" style="margin-top: 8px;">Property: ${house.houseName}</div>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>House Rent for ${bill.month} ${bill.year}</td>
                  <td class="amount">₹${bill.rentAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Electricity Charges (TSPDCL)</td>
                  <td class="amount">₹${bill.electricBill.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Water Charges (HMWSSB)</td>
                  <td class="amount">₹${bill.waterBill.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Received</td>
                  <td class="amount">₹${bill.total.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="signature-section">
              <div style="font-size: 12px; font-style: italic; color: #64748b;">
                *Generated digitally via BillaFinance.
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div class="signature-box">Landlord Signature</div>
              </div>
            </div>

            <div class="footer-note">
              This is a computer-generated document and does not require a physical signature.<br>
              For claiming House Rent Allowance (HRA) under Section 10(13A) of the Income Tax Act.
            </div>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rent_receipt_${bill.month}_${bill.year}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  goToGame() {
    this.router.navigate(['/car']);
  }

  fetchTenantElectricityBill(uscNo: string) {
    if (!uscNo) return;
    this.isFetchingElectricity = true;
    this.tspdclService.fetchBillDetails(uscNo).subscribe({
      next: (details) => {
        this.tenantElectricityBill = details;
        this.isFetchingElectricity = false;
        if (details?.success) {
          this.toast.success('Electricity bill fetched successfully!');
        } else {
          this.toast.error('Could not fetch electricity bill.');
        }
      },
      error: (err) => {
        console.error(err);
        this.isFetchingElectricity = false;
        this.toast.error('Failed to fetch electricity bill.');
      }
    });
  }

  openElectricityPortal(uscNo: string) {
    const url = `https://www.tgsouthernpower.org/online-bill-payment?uscno=${uscNo}`;
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  }

  openBillPortal(uscNo: string) {
    const url = `https://www.tgsouthernpower.org/billinginfo?ukscno=${uscNo}&submit=SUBMIT`;
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
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
          if (this.tenantHouses.length > 0) {
            const house = this.tenantHouses[0];
            if (house.electricMeterNo) {
              this.fetchTenantElectricityBill(house.electricMeterNo);
            }
            // Fetch owner/admin profile using createdBy UID
            if (house.createdBy) {
              this.authService.getUserProfile(house.createdBy).then(ownerProf => {
                this.ownerProfile = ownerProf;
              }).catch(() => { this.ownerProfile = null; });
            }
          }
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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const accrued = this.getAccruedInterestThroughDate(loan, today);
    const paidInterest = this.getLoanInterestPaid(loan);

    return Math.max(0, accrued - paidInterest);
  }

  private parseLocalDateForReminder(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }

  private getAccruedInterestThroughDate(loan: InterestScheme, date: Date): number {
    const startDate = this.parseLocalDateForReminder(loan.startDate);
    if (!startDate) return 0;
    let totalDue = 0;
    let cycleIndex = 1;
    while (true) {
      const cycleStart = this.addMonthsClamped(startDate, cycleIndex - 1);
      const cycleDueDate = this.addMonthsClamped(startDate, cycleIndex);
      if (cycleDueDate.getTime() > date.getTime()) break;
      const settledBeforeCycle = (loan.settlements || []).reduce((sum, s) => {
        const sDate = this.parseLocalDateForReminder(s.date);
        return (sDate && sDate.getTime() < cycleDueDate.getTime()) ? sum + s.amount : sum;
      }, 0);
      const balanceAtStart = Math.max(0, loan.amount - settledBeforeCycle);
      totalDue += balanceAtStart * (loan.interestRate / 100);
      cycleIndex++;
    }
    return totalDue;
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

  @HostListener('window:focus')
  onWindowFocus() {
    const isModalOpen = (this.activeTab === 'security') || this.showReceiptModal || this.showIdentityPopup;
    if (!isModalOpen) {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
  }
}

