import { Component, inject, OnInit, ViewChild, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { InterestService, InterestScheme } from '../services/interest.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { CustomerService, Customer } from '../services/customer.service';
import { NotificationService } from '../services/notification.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, deleteDoc, doc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, firstValueFrom } from 'rxjs';
import { BiometricService } from '../../services/biometric.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

import { BillService, Bill, TrackedService, StoredBillRecord } from '../services/bill.service';
import { BillListComponent } from '../bills/bill-list/bill-list.component';
import { BillFormComponent } from '../bills/bill-form/bill-form.component';
import { BillPaymentModalComponent } from '../bills/bill-payment-modal/bill-payment-modal.component';
import { RentalService, RentalHouse, RentalBill, RentalExpense, PastTenancy, printHraReceipt } from '../services/rental.service';
import { RentalManagementComponent } from './components/rental-management.component';
import { TspdclService } from '../services/tspdcl.service';
import { HmwssbService } from '../services/hmwssb.service';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective, BillListComponent, BillFormComponent, BillPaymentModalComponent, CountUpDirective, RentalManagementComponent],
  template: `
    <style>
      @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      @keyframes pulseSlow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
      .card-animate { animation: fadeInUp 0.5s ease both; }
      .kpi-animate { animation: slideInRight 0.4s ease both; }
      .interest-card { animation: fadeInUp 0.5s ease both; }
      .scheme-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .scheme-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139,92,246,0.18), 0 8px 16px rgba(0,0,0,0.08); }
      .tab-active { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.08); color: #7c3aed !important; }
      .dark .tab-active { background: #374151; color: #a78bfa !important; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      .modal-open { overflow: hidden; }

      /* Mobile chart scroll lock */
      @media (max-width: 639px) {
        .chart-touch-wrapper { touch-action: none; }
      }

      @keyframes neon-pulse-admin {
        0%, 100% { color: #f97316; filter: drop-shadow(0 0 2px #f97316); transform: scale(1); }
        25% { color: #00ffaa; filter: drop-shadow(0 0 8px #00ffaa); }
        50% { color: #f0f; filter: drop-shadow(0 0 10px #f0f); transform: scale(1.1); }
        75% { color: #0ff; filter: drop-shadow(0 0 8px #0ff); }
      }
      .game-icon-pulse { animation: neon-pulse-admin 4s infinite ease-in-out; }

      .bottom-nav-pill {
        display: flex;
        width: 100%;
        min-width: 100%;
        height: 64px;
        padding-bottom: env(safe-area-inset-bottom, 0);
        z-index: 100;
      }
      .bottom-nav-pill::-webkit-scrollbar { display: none; }
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
        color: #505d6f;
        opacity: 0.6;
        transition: all 0.3s ease;
      }
      .dark .icon-inactive {
        color: rgba(255, 255, 255, 0.5);
        opacity: 0.4;
      }
      .nav-item-box:active .nav-icon {
        transform: scale(0.9);
      }
      .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); }
      .dark .glass-card { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255,255,255,0.05); }

      .history-step { position: relative; padding-left: 3.5rem; }
      .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
      .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .animate-slide-up { animation: slideUp 0.3s ease-out both; }
    </style>

    <div class="min-h-screen bg-[#f0f4f9] dark:bg-gray-950 font-sans transition-colors duration-500 overflow-x-hidden w-full flex flex-col lg:flex-row relative">
      <!-- DESKTOP SIDEBAR -->
      <aside class="hidden lg:flex flex-col w-72 bg-[#09152b] dark:bg-gray-900 fixed left-0 top-0 h-screen justify-between p-6 z-30 shadow-xl border-r border-gray-800/10">
         <div class="space-y-8">
            <!-- Logo area -->
            <div class="flex items-center gap-3 px-2">
               <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
               </div>
               <span class="text-xl font-black text-white tracking-tight">FinDash</span>
            </div>

            <!-- Navigation Links -->
            <nav class="space-y-1.5">
               <!-- Overview -->
               <button (click)="activeTab = 'overview'; activeMobileMenu = 'overview'"
                       [class]="activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                  Overview
               </button>

               <!-- Loans -->
               <button *ngIf="showInterestTab" (click)="activeTab = 'interest'; activeMobileMenu = 'interest'"
                       [class]="activeTab === 'interest' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Loans
               </button>

               <!-- Chitti -->
               <button *ngIf="showChittiTab" (click)="activeTab = 'chitti'; activeMobileMenu = 'chitti'"
                       [class]="activeTab === 'chitti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  Chitti Schemes
               </button>

               <!-- Bills -->
               <button *ngIf="showBillsTab" (click)="activeTab = 'bills'; activeMobileMenu = 'bills'"
                       [class]="activeTab === 'bills' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <div class="flex items-center gap-3">
                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                     Utility Bills
                  </div>
                  <span *ngIf="billStats.pendingAmount > 0" class="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded-md animate-pulse">
                     {{ billStats.pendingAmount | currency:'INR':'symbol':'1.0-0' }}
                  </span>
               </button>

               <!-- Rentals -->
               <button *ngIf="showRentalsTab" (click)="activeTab = 'rentals'; activeMobileMenu = 'rentals'"
                       [class]="activeTab === 'rentals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  Rental Properties
               </button>

               <!-- Customers -->
               <button *ngIf="showCustomersTab" (click)="activeTab = 'customers'; activeMobileMenu = 'customers'"
                       [class]="activeTab === 'customers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  Customers
               </button>

               <!-- Security Settings -->
               <button (click)="activeTab = 'security'; activeMobileMenu = 'security'"
                       [class]="activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                       class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Security Settings
               </button>
            </nav>
         </div>

         <!-- Help Card at bottom -->
         <div class="bg-gradient-to-br from-indigo-950 to-indigo-900/50 p-4 rounded-2xl border border-indigo-800/40 text-slate-200 shadow-lg flex flex-col gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
               <p class="text-xs font-black text-white">Need Help?</p>
               <p class="text-[10px] text-slate-400 leading-tight mt-1">View documentation or contact support.</p>
            </div>
            <button class="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md">
               Contact Support
            </button>
         </div>
      </aside>

      <!-- RIGHT CONTENT AREA -->
      <div class="flex-1 flex flex-col min-h-screen min-w-0 lg:pl-72">
      <!-- Decorative Background Glows (Subtle) -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <!-- Top Navigation -->
      <nav class="lg:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm transition-all duration-300 animate-fade-down">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">FinServe Admin</span>
            </div>
            <div class="flex space-x-2 items-center" *ngIf="authService.userProfile$ | async as profile">
              
              <!-- Theme Toggle -->
              <button (click)="toggleTheme()" class="p-2.5 text-gray-400 hover:text-purple-600 transition-colors mr-1">
                 <svg *ngIf="!isDarkMode" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                 <svg *ngIf="isDarkMode" class="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </button>
              <div class="flex flex-col items-end mr-6 hidden sm:flex">
                <span class="text-gray-900 dark:text-white text-[13px] font-black uppercase leading-tight">{{ profile.displayName || 'Admin' }}</span>
                <span class="text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] opacity-80">{{ profile.username }}</span>
              </div>
              <div class="flex flex-col items-end mr-3 sm:hidden">
                <span class="text-gray-900 dark:text-white text-[11px] font-black uppercase leading-tight">{{ profile.displayName?.split(' ')?.[0] || 'Admin' }}</span>
                <span class="text-gray-500 text-[8px] font-black uppercase tracking-tight opacity-80">&#64;{{ profile.username }}</span>
              </div>
              <!-- Logout Button -->
              <button (click)="logout()" class="p-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Secure Logout">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>

              <!-- Remaining Menus Dropdown Container -->
              <div class="relative more-menu-container flex items-center">
                 <button (click)="toggleMoreMenu($event)" class="p-2.5 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 rounded-xl transition-all" title="Remaining Menus">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                 </button>
                 <!-- Dropdown overlay card (solid bg for high contrast/visibility in dark mode) -->
                 <div *ngIf="showMoreMenu" class="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-50 overflow-hidden animate-fade-down duration-200">
                    <div class="py-2 flex flex-col">
                       <!-- Profile (For both) -->
                       <button (click)="selectMoreMenu('profile')" 
                               class="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors w-full text-left">
                          <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          My Profile
                       </button>
                       <!-- Chitties (Regular Admin only) -->
                       <button *ngIf="!isSuperAdmin && showChittiTab" 
                               (click)="selectMoreMenu('chitti')" 
                               class="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors w-full text-left">
                          <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Chitties
                       </button>
                       <!-- Customers (Regular Admin only) -->
                       <button *ngIf="!isSuperAdmin && showCustomersTab" 
                               (click)="selectMoreMenu('customers')" 
                               class="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors w-full text-left">
                          <svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                          </svg>
                          Customers
                       </button>
                       <!-- Manage Admins (Super Admin only) -->
                       <button *ngIf="isSuperAdmin" 
                               (click)="selectMoreMenu('manage-admins')" 
                               class="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full text-left">
                          <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                          </svg>
                          Manage Admins
                       </button>
                       <!-- Security (For both) -->
                       <button (click)="selectMoreMenu('security')" 
                               class="flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full text-left">
                          <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          </svg>
                          Security
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- DESKTOP TOP BAR (PAGE HEADER) -->
        <header class="hidden lg:flex bg-[#f0f4f9] dark:bg-gray-950 items-center justify-between px-8 py-6 sticky top-0 z-20 transition-all duration-300">
           <div>
              <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                 {{ activeTab === 'overview' ? 'Business Overview' :
                    activeTab === 'interest' ? 'Loans Management' :
                    activeTab === 'chitti' ? 'Chitti Schemes' :
                    activeTab === 'bills' ? 'Utility Bills' :
                    activeTab === 'rentals' ? 'Rental Properties' :
                    activeTab === 'customers' ? 'Customers Directory' :
                    activeTab === 'security' ? 'Security settings' : 'Dashboard' }}
              </h2>
              <p class="text-xs font-semibold text-gray-400 tracking-wider mt-2.5 uppercase leading-none">
                 {{ activeTab === 'overview' ? 'Aggregated statistics and metrics for your operations' :
                    activeTab === 'interest' ? 'Track borrower balances and interest payments' :
                    activeTab === 'chitti' ? 'Manage active chit schemes and collections' :
                    activeTab === 'bills' ? 'Utility tracking and automated bill retrieval' :
                    activeTab === 'rentals' ? 'Monitor housing tenancies, rent, and utility bills' :
                    activeTab === 'customers' ? 'Manage customer profile details and records' :
                    activeTab === 'security' ? 'Manage your secure login credentials' : 'Operations and administrative panel' }}
              </p>
           </div>
           
           <div class="flex items-center gap-3" *ngIf="authService.userProfile$ | async as profile">
              <!-- DATA Switch -->
              <div *ngIf="activeTab === 'overview'" class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl p-2.5 shadow-sm border border-gray-150 dark:border-gray-700">
                 <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1.5">DATA</span>
                 <label class="relative inline-flex items-center cursor-pointer scale-90">
                    <input type="checkbox" [(ngModel)]="showOverviewData" class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                 </label>
              </div>

              <!-- Year select dropdown -->
              <div *ngIf="activeTab === 'overview'" class="bg-white dark:bg-gray-800 rounded-2xl p-2.5 shadow-sm border border-gray-150 dark:border-gray-700 flex items-center pr-1.5 relative">
                 <svg class="w-3.5 h-3.5 text-gray-400 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                 <select [(ngModel)]="selectedOverviewYear" (ngModelChange)="onOverviewYearChange($event)"
                         class="bg-transparent border-none outline-none text-xs font-black text-gray-700 dark:text-gray-300 pl-8 pr-8 py-1 cursor-pointer appearance-none">
                    <option [ngValue]="-1">All Years</option>
                    <option *ngFor="let y of availableOverviewYears" [ngValue]="y">{{y}}</option>
                 </select>
                 <svg class="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>

              <!-- Theme Toggle -->
              <button (click)="toggleTheme()" class="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-300 border border-gray-150 dark:border-gray-750 rounded-2xl shadow-sm transition-all">
                 <svg *ngIf="!isDarkMode" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                 <svg *ngIf="isDarkMode" class="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </button>

              <!-- Notifications -->
              <button class="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-300 border border-gray-150 dark:border-gray-750 rounded-2xl shadow-sm relative transition-all">
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                 <span class="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              </button>

              <!-- User profile dropdown / Avatar button -->
              <div class="relative more-menu-container flex items-center">
                 <button (click)="toggleMoreMenu($event)" class="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-150 dark:border-gray-700 rounded-2xl shadow-sm transition-all">
                    <div class="w-7 h-7 rounded-xl bg-indigo-650 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                       {{ (profile.displayName || 'A').charAt(0) }}
                    </div>
                    <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                 </button>
                 
                 <!-- Dropdown menu -->
                 <div *ngIf="showMoreMenu" class="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-900 z-50 overflow-hidden">
                    <div class="py-2 flex flex-col">
                       <button (click)="selectMoreMenu('profile')" class="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full text-left">
                          <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                          My Profile
                       </button>
                       <button (click)="selectMoreMenu('security')" class="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full text-left">
                          <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                          Change Password
                       </button>
                       <hr class="border-gray-100 dark:border-gray-800 my-1">
                       <button (click)="logout()" class="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors w-full text-left">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                          Secure Logout
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </header>

        <main class="flex-1 p-6 lg:p-8 bg-[#f0f4f9] dark:bg-gray-950 relative z-10 animate-fade-up delay-100">

        <!-- Tab Switcher (Only for regular admins) -->
        <div *ngIf="!isSuperAdmin" class="hidden sm:flex lg:hidden p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl w-full sm:max-w-md mb-8 relative gap-1 overflow-x-auto no-scrollbar whitespace-nowrap border border-gray-100 dark:border-gray-700">
          <button (click)="activeTab = 'overview'; activeMobileMenu = 'overview'"
                  [class.tab-active]="activeTab === 'overview'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            OVERVIEW
          </button>
          <button *ngIf="showInterestTab" (click)="activeTab = 'interest'; activeMobileMenu = 'interest'"
                  [class.tab-active]="activeTab === 'interest'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            LOANS
          </button>
          <button *ngIf="showChittiTab" (click)="activeTab = 'chitti'; activeMobileMenu = 'chitti'"
                  [class.tab-active]="activeTab === 'chitti'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            CHITTI
          </button>

          <button *ngIf="showBillsTab" (click)="activeTab = 'bills'; activeMobileMenu = 'bills'"
                  [class.tab-active]="activeTab === 'bills'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10 flex items-center justify-center gap-1.5">
            BILLS
            <span *ngIf="billStats.pendingAmount > 0" class="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-md animate-pulse">
               {{ billStats.pendingAmount | currency:'INR':'symbol':'1.0-0' }}
            </span>
          </button>
          <button *ngIf="showRentalsTab" (click)="activeTab = 'rentals'; activeMobileMenu = 'rentals'"
                  [class.tab-active]="activeTab === 'rentals'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            RENTALS
          </button>
        </div>

        <!-- ═══════════ ADMIN OVERVIEW VIEW ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'overview') {
           <div class="space-y-8 card-animate">
                 <!-- ═══════════ MOBILE VIEW ONLY LAYOUT (lg:hidden) ═══════════ -->
                 <div class="lg:hidden animate-fade-in duration-300">
                    <!-- Blue Gradient Top Background Section -->
                    <div class="-mx-4 px-4 pt-4 pb-20 bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-900 dark:to-indigo-850 -mt-6">
                       <!-- Sub-Tabs Selector styled for blue header -->
                       <div class="flex justify-center mb-6">
                          <div class="inline-flex p-1 bg-white/10 dark:bg-black/25 backdrop-blur rounded-2xl border border-white/10 shadow-inner">
                             <button (click)="overviewSubTab = 'finance'" 
                                     [class]="overviewSubTab === 'finance' ? 'bg-white text-indigo-700 shadow-md font-black' : 'text-white/80 hover:text-white font-bold'"
                                     class="px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all">
                                Finance
                             </button>
                             <button (click)="overviewSubTab = 'rentals'" 
                                     [class]="overviewSubTab === 'rentals' ? 'bg-white text-indigo-700 shadow-md font-black' : 'text-white/80 hover:text-white font-bold'"
                                     class="px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all">
                                Rentals
                             </button>
                          </div>
                       </div>

                       <!-- Mobile Year & Data Controls -->
                       <div class="flex justify-center items-center gap-3 mb-6">
                          <!-- Year Selector -->
                          <div class="inline-flex items-center gap-2 bg-white/10 dark:bg-black/25 backdrop-blur rounded-2xl p-1.5 border border-white/10 shadow-inner relative pl-3 pr-2.5">
                             <span class="text-[9px] font-black text-white/70 uppercase tracking-widest">Year:</span>
                             <select [ngModel]="selectedOverviewYear" (ngModelChange)="onOverviewYearChange($event)"
                                     class="bg-transparent border-none outline-none text-xs font-black text-white pr-6 cursor-pointer appearance-none">
                                <option class="text-gray-900" [ngValue]="-1">All Years</option>
                                <option class="text-gray-900" *ngFor="let y of availableOverviewYears" [ngValue]="y">{{y}}</option>
                             </select>
                             <svg class="w-3.5 h-3.5 text-white/70 absolute right-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                          </div>

                          <!-- DATA Toggle -->
                          <div class="inline-flex items-center gap-2 bg-white/10 dark:bg-black/25 backdrop-blur rounded-2xl p-2 border border-white/10 shadow-inner">
                             <span class="text-[9px] font-black text-white/70 uppercase tracking-widest pl-1.5">DATA</span>
                             <label class="relative inline-flex items-center cursor-pointer scale-75">
                                <input type="checkbox" [(ngModel)]="showOverviewData" class="sr-only peer">
                                <div class="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                             </label>
                          </div>
                       </div>

                       <!-- Mobile Chart Cards sitting on the blue background (inset with margins) -->
                       @if (overviewSubTab === 'finance') {
                          @if (!showOverviewData) {
                             <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-4 shadow-xl border border-gray-100/10 dark:border-gray-800 animate-in zoom-in-95 duration-500 mx-2">
                                <div class="flex justify-between items-center mb-4">
                                   <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Financial Trends ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h3>
                                   <div class="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                      <button (click)="panChart('overview', 100)" class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-indigo-600 transition-all"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                                      <button (click)="zoomChart('overview', 1.1)" class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-indigo-600 transition-all"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></button>
                                      <button (click)="resetChartZoom('overview')" class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-indigo-600 transition-all"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                                      <button (click)="zoomChart('overview', 0.9)" class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-indigo-600 transition-all"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
                                      <button (click)="panChart('overview', -100)" class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-indigo-600 transition-all"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                                   </div>
                                </div>
                                <div class="w-full h-[240px] chart-touch-wrapper" (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                                   <canvas #overviewChart="base-chart" baseChart [data]="overviewChartData" [options]="overviewChartOptions" [type]="overviewChartType"></canvas>
                                </div>
                             </div>
                          } @else {
                             <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-4 shadow-xl border border-gray-100/10 dark:border-gray-800 animate-in zoom-in-95 duration-500 mx-2">
                                <div class="flex justify-between items-center mb-4">
                                   <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Transactions</h3>
                                   <span class="text-[10px] text-gray-400 font-bold uppercase">{{ overviewTransactions.length }} Items</span>
                                </div>
                                <div class="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                                   @for (tx of overviewTransactions; track $index) {
                                      <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60">
                                         <div class="flex items-center gap-3 min-w-0">
                                            <div [class]="tx.bg + ' w-8 h-8 rounded-xl flex items-center justify-center ' + tx.color + ' font-black text-xs shrink-0'">{{ tx.icon }}</div>
                                            <div class="min-w-0">
                                               <p class="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{{ tx.whom }}</p>
                                               <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{{ tx.type }} • {{ tx.date | date:'dd MMM yyyy' }}</p>
                                            </div>
                                         </div>
                                         <div class="text-right shrink-0">
                                            <span [class]="tx.color + ' text-xs font-black'">₹{{ tx.amount | number }}</span>
                                         </div>
                                      </div>
                                   }
                                   @if (overviewTransactions.length === 0) {
                                      <div class="py-8 text-center text-gray-400 italic text-xs">No transactions found.</div>
                                   }
                                </div>
                             </div>
                          }
                       } @else if (overviewSubTab === 'rentals') {
                          @if (!showOverviewData) {
                             <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-4 shadow-xl border border-gray-100/10 dark:border-gray-800 animate-in zoom-in-95 duration-500 mx-2">
                                <div class="flex justify-between items-center mb-4">
                                   <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Rent Collected per Room ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h3>
                                   <div class="flex gap-2">
                                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                      <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                   </div>
                                </div>
                                <div class="w-full h-[240px] chart-touch-wrapper" (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                                   <canvas #rentalOverviewChart="base-chart" baseChart [data]="rentalOverviewChartData" [options]="rentalOverviewChartOptions" [type]="rentalOverviewChartType"></canvas>
                                </div>
                             </div>
                          } @else {
                             <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-4 shadow-xl border border-gray-100/10 dark:border-gray-800 animate-in zoom-in-95 duration-500 mx-2">
                                <div class="flex justify-between items-center mb-4">
                                   <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest">Properties ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h3>
                                   <span class="text-[10px] text-gray-400 font-bold uppercase">{{ houses.length }} Rooms</span>
                                </div>
                                <div class="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                                   @for (house of houses; track house.id) {
                                      @let rData = getHouseRentalData(house);
                                      <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60">
                                         <div class="min-w-0">
                                            <p class="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{{ house.houseName }}</p>
                                            <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                               {{ house.status === 'Occupied' ? house.renterName : 'Vacant' }}
                                            </p>
                                         </div>
                                         <div class="text-right shrink-0">
                                            <span class="text-[10px] font-black text-emerald-600 block">C: ₹{{ rData.paidRent | number }}</span>
                                            <span class="text-[10px] font-black text-amber-600 block mt-0.5">P: ₹{{ rData.pendingRent | number }}</span>
                                         </div>
                                      </div>
                                   }
                                   @if (houses.length === 0) {
                                      <div class="py-8 text-center text-gray-400 italic text-xs">No properties registered.</div>
                                   }
                                </div>
                             </div>
                          }
                       }
                    </div>

                    <!-- White/Slate Gray Bottom Main Content Area -->
                    <div class="-mx-4 bg-slate-50 dark:bg-gray-950 rounded-t-[2.5rem] -mt-16 pt-20 px-4 pb-12 relative z-0 shadow-[0_-15px_40px_rgba(0,0,0,0.03)] border-t border-gray-100 dark:border-gray-900">
                       @if (overviewSubTab === 'finance') {
                          <!-- Premium Colored KPI stack rows matching the Mockup -->
                          <div class="flex flex-col gap-3">
                             <!-- Row 1: Given Loans -->
                             <div class="bg-blue-50/70 dark:bg-blue-950/20 p-5 rounded-[1.5rem] border border-blue-100/40 dark:border-blue-900/30 flex items-center justify-between shadow-sm active:scale-98 transition-all">
                                <div class="flex items-center gap-3">
                                   <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                   </div>
                                   <div>
                                      <p class="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-tight">Total Given Loans</p>
                                      <p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-tighter">▲ 18.4% vs 2025</p>
                                   </div>
                                </div>
                                <div class="flex items-center gap-2">
                                   <h3 class="text-base font-black text-blue-950 dark:text-white tracking-tighter" [appCountUp]="totalGivenLoans" prefix="₹"></h3>
                                   <svg class="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>

                             <!-- Row 2: Settlements -->
                             <div class="bg-emerald-50/70 dark:bg-emerald-950/20 p-5 rounded-[1.5rem] border border-emerald-100/40 dark:border-emerald-900/30 flex items-center justify-between shadow-sm active:scale-98 transition-all">
                                <div class="flex items-center gap-3">
                                   <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                   </div>
                                   <div>
                                      <p class="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-tight">Total Settlements</p>
                                      <p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-tighter">▲ 12.7% vs 2025</p>
                                   </div>
                                </div>
                                <div class="flex items-center gap-2">
                                   <h3 class="text-base font-black text-emerald-950 dark:text-white tracking-tighter" [appCountUp]="totalSettlement" prefix="₹"></h3>
                                   <svg class="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>

                             <!-- Row 3: Pending Principal -->
                             <div class="bg-rose-50/70 dark:bg-rose-950/20 p-5 rounded-[1.5rem] border border-rose-100/40 dark:border-rose-900/30 flex items-center justify-between shadow-sm active:scale-98 transition-all">
                                <div class="flex items-center gap-3">
                                   <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                   </div>
                                   <div>
                                      <p class="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-tight">Pending Principal</p>
                                      <p class="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-1 uppercase tracking-tighter">▼ 8.2% vs 2025</p>
                                   </div>
                                </div>
                                <div class="flex items-center gap-2">
                                   <h3 class="text-base font-black text-rose-950 dark:text-white tracking-tighter" [appCountUp]="totalPendingPrincipal" prefix="₹"></h3>
                                   <svg class="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>

                             <!-- Row 4: Interest Collected -->
                             <div class="bg-purple-50/70 dark:bg-purple-950/20 p-5 rounded-[1.5rem] border border-purple-100/40 dark:border-purple-900/30 flex items-center justify-between shadow-sm active:scale-98 transition-all">
                                <div class="flex items-center gap-3">
                                   <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-sm">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                   </div>
                                   <div>
                                      <p class="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-tight">Interest Collected</p>
                                      <p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-tighter">▲ 15.6% vs 2025</p>
                                   </div>
                                </div>
                                <div class="flex items-center gap-2">
                                   <h3 class="text-base font-black text-purple-950 dark:text-white tracking-tighter" [appCountUp]="totalCollectedInterest" prefix="₹"></h3>
                                   <svg class="w-4 h-4 text-purple-400 dark:text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>

                             <!-- Row 5: Pending Interest -->
                             <div class="bg-orange-50/70 dark:bg-orange-950/20 p-5 rounded-[1.5rem] border border-orange-100/40 dark:border-orange-900/30 flex items-center justify-between shadow-sm active:scale-98 transition-all">
                                <div class="flex items-center gap-3">
                                   <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-650 dark:text-orange-400 shrink-0 shadow-sm">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                   </div>
                                   <div>
                                      <p class="text-xs font-black text-orange-900 dark:text-orange-200 uppercase tracking-tight">Pending Interest</p>
                                      <p class="text-[9px] font-bold text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-tighter">▲ 9.3% vs 2025</p>
                                   </div>
                                </div>
                                <div class="flex items-center gap-2">
                                   <h3 class="text-base font-black text-orange-950 dark:text-white tracking-tighter" [appCountUp]="totalPendingInterest" prefix="₹"></h3>
                                   <svg class="w-4 h-4 text-orange-400 dark:text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>
                          </div>
                       } @else if (overviewSubTab === 'rentals') {
                          <!-- Mobile Rental stats & list -->
                          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div class="grid grid-cols-2 gap-4">
                                <div class="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-150/40 dark:border-gray-800 shadow-sm">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Rent</span>
                                   <h4 class="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none" [appCountUp]="rentalStats.totalCollectedRent" prefix="₹"></h4>
                                </div>
                                <div class="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-150/40 dark:border-gray-800 shadow-sm">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pending</span>
                                   <h4 class="text-base font-black text-amber-600 dark:text-amber-400 leading-none" [appCountUp]="rentalStats.totalPendingRent" prefix="₹"></h4>
                                </div>
                                <div class="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-150/40 dark:border-gray-800 shadow-sm">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Occupancy</span>
                                   <h4 class="text-base font-black text-blue-650 dark:text-blue-400 leading-none">{{ rentalStats.occupancyRate }}%</h4>
                                </div>
                                <div class="bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-150/40 dark:border-gray-800 shadow-sm">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rooms</span>
                                   <h4 class="text-base font-black text-purple-650 dark:text-purple-400 leading-none">{{ rentalStats.occupiedHouses }} / {{ rentalStats.totalHouses }}</h4>
                                </div>
                             </div>

                             <div class="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-150/40 dark:border-gray-800 shadow-sm">
                                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Latest Rent Collections</h4>
                                <div class="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                                   @for (pay of rentalStats.recentPayments; track $index) {
                                      <div class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60">
                                         <div class="min-w-0">
                                            <p class="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{{ pay.houseName }}</p>
                                            <p class="text-[9px] text-gray-450 font-bold uppercase tracking-wide truncate mt-0.5">{{ pay.renterName }} • {{ pay.date | date:'MMM dd, yyyy' }}</p>
                                         </div>
                                         <div class="text-right shrink-0">
                                            <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 block">+₹{{ pay.amount }}</span>
                                         </div>
                                      </div>
                                   }
                                   @if (rentalStats.recentPayments.length === 0) {
                                      <div class="py-8 text-center text-gray-455 dark:text-slate-500 italic text-xs">
                                         No paid rent records found.
                                      </div>
                                   }
                                </div>
                             </div>
                          </div>
                       }
                    </div>
                 </div>

                 <!-- ═══════════ DESKTOP ONLY VIEW LAYOUT (hidden lg:block) ═══════════ -->
                 <div class="hidden lg:block space-y-8 animate-fade-in duration-300" style="margin-top:0;">
                    <!-- Sub-Tabs Selector inside Desktop View -->
                    <div class="flex justify-center mb-6">
                       <div class="inline-flex p-1 bg-white dark:bg-gray-800 backdrop-blur rounded-2xl border border-gray-150 dark:border-gray-800/60 shadow-inner">
                          <button (click)="overviewSubTab = 'finance'" 
                                  [class]="overviewSubTab === 'finance' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
                                  class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                             Finance Overview
                          </button>
                          <button (click)="overviewSubTab = 'rentals'" 
                                  [class]="overviewSubTab === 'rentals' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
                                  class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                             Rental Overview
                          </button>
                       </div>
                    </div>

                    @if (overviewSubTab === 'finance') {
                       <!-- Desktop KPI Cards Grid -->
                       <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <!-- Card 1: Given Loans -->
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all">
                             <div>
                                <div class="flex justify-between items-start mb-2">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Given Loans</span>
                                   <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                   </div>
                                </div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="totalGivenLoans" prefix="₹"></h3>
                             </div>
                             <div class="mt-4 flex items-center gap-1">
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">▲ 18.4%</span>
                                <span class="text-[8px] font-bold text-gray-455 dark:text-gray-500 uppercase tracking-tighter">vs 2025</span>
                             </div>
                          </div>

                          <!-- Card 2: Settlements -->
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all">
                             <div>
                                <div class="flex justify-between items-start mb-2">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Settlements</span>
                                   <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                   </div>
                                </div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="totalSettlement" prefix="₹"></h3>
                             </div>
                             <div class="mt-4 flex items-center gap-1">
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">▲ 12.7%</span>
                                <span class="text-[8px] font-bold text-gray-455 dark:text-gray-500 uppercase tracking-tighter">vs 2025</span>
                             </div>
                          </div>

                          <!-- Card 3: Pending Principal -->
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all">
                             <div>
                                <div class="flex justify-between items-start mb-2">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending Principal</span>
                                   <div class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                   </div>
                                </div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="totalPendingPrincipal" prefix="₹"></h3>
                             </div>
                             <div class="mt-4 flex items-center gap-1">
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 uppercase tracking-tighter">▼ 8.2%</span>
                                <span class="text-[8px] font-bold text-gray-455 dark:text-gray-500 uppercase tracking-tighter">vs 2025</span>
                             </div>
                          </div>

                          <!-- Card 4: Interest Collected -->
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all">
                             <div>
                                <div class="flex justify-between items-start mb-2">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Interest Collected</span>
                                   <div class="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                                   </div>
                                </div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="totalCollectedInterest" prefix="₹"></h3>
                             </div>
                             <div class="mt-4 flex items-center gap-1">
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">▲ 15.6%</span>
                                <span class="text-[8px] font-bold text-gray-455 dark:text-gray-500 uppercase tracking-tighter">vs 2025</span>
                             </div>
                          </div>

                          <!-- Card 5: Pending Interest -->
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all">
                             <div>
                                <div class="flex justify-between items-start mb-2">
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending Interest</span>
                                   <div class="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-655 dark:text-orange-400">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                   </div>
                                </div>
                                <h3 class="text-xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="totalPendingInterest" prefix="₹"></h3>
                             </div>
                             <div class="mt-4 flex items-center gap-1">
                                <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-405 uppercase tracking-tighter">▲ 9.3%</span>
                                <span class="text-[8px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-tighter">vs 2025</span>
                             </div>
                          </div>
                       </div>

                       @if (!showOverviewData) {
                          <!-- Line Chart Card with high rounded corners -->
                          <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-150 dark:border-gray-800 animate-in zoom-in-95 duration-500 flex flex-col gap-4">
                             <div class="flex justify-between items-center">
                                <h3 class="text-sm font-black text-gray-500 uppercase tracking-widest">Financial Trends ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h3>
                                <div class="flex items-center gap-2">
                                   <div class="flex items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                                      <button (click)="panChart('overview', 100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Move Left">
                                         <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                      </button>
                                      <button (click)="zoomChart('overview', 1.1)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Zoom In">
                                         <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                      </button>
                                      <button (click)="resetChartZoom('overview')" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Reset Zoom">
                                         <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                      </button>
                                      <button (click)="zoomChart('overview', 0.9)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Zoom Out">
                                         <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                                      </button>
                                      <button (click)="panChart('overview', -100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Move Right">
                                         <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                                      </button>
                                   </div>
                                   <p class="text-[10px] font-bold text-indigo-500/60 uppercase tracking-widest italic hidden sm:block">Scroll to Zoom</p>
                                </div>
                             </div>
                             <div class="w-full h-[320px] chart-touch-wrapper" (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                                <canvas #overviewChart="base-chart" baseChart [data]="overviewChartData" [options]="overviewChartOptions" [type]="overviewChartType"></canvas>
                             </div>
                          </div>
                       } @else {
                          <!-- Transaction History Table Card -->
                          <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-150 dark:border-gray-800 animate-in zoom-in-95 duration-500 flex flex-col gap-4">
                             <div class="flex justify-between items-center px-2">
                                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest">Transaction History</h4>
                                <div class="flex gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                                   @for (f of overviewFilters; track f) {
                                      <button (click)="overviewFilter = f; generateOverviewChart()"
                                              [class.bg-blue-600]="overviewFilter === f"
                                              [class.text-white]="overviewFilter === f"
                                              class="px-3 py-1.5 text-[8px] font-black rounded-lg transition-all uppercase tracking-widest cursor-pointer"
                                              [class.text-gray-400]="overviewFilter !== f">
                                         {{ f }}
                                      </button>
                                   }
                                </div>
                             </div>
                             <div class="overflow-x-auto">
                                <table class="w-full">
                                   <thead class="bg-gray-50 dark:bg-gray-800/50">
                                      <tr>
                                         <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                         <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                         <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                         <th class="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                      </tr>
                                   </thead>
                                   <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                      @for (tx of overviewTransactions; track $index) {
                                         <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                            <td class="px-6 py-4">
                                               <div class="flex items-center gap-3">
                                                  <div [class]="tx.bg + ' w-8 h-8 rounded-xl flex items-center justify-center ' + tx.color + ' font-black text-xs border border-white dark:border-gray-700'">{{ tx.icon }}</div>
                                                  <span class="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ tx.type }}</span>
                                               </div>
                                            </td>
                                            <td class="px-6 py-4 text-[11px] font-bold text-gray-600 dark:text-gray-300">{{ tx.whom }}</td>
                                            <td class="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400">{{ tx.date | date:'dd MMM yyyy' }}</td>
                                            <td class="px-6 py-4 text-right">
                                               <span [class]="tx.color + ' text-sm font-black'" [appCountUp]="tx.amount" prefix="₹"></span>
                                            </td>
                                         </tr>
                                      }
                                      @if (overviewTransactions.length === 0) {
                                         <tr>
                                            <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic text-[11px] uppercase tracking-widest opacity-60">No transactions found for this period.</td>
                                         </tr>
                                      }
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       }
                    } @else if (overviewSubTab === 'rentals') {
                       <!-- ═══════════ RENTAL PROPERTIES OVERVIEW ═══════════ -->
                       <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div class="flex items-center gap-4 mb-8">
                             <div class="w-12 h-12 rounded-2xl bg-indigo-650 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                             </div>
                             <div>
                                <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Rental Properties Overview</h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Rent collected, occupancy status, and stats per individual room</p>
                             </div>
                          </div>

                          <!-- Mini Stats Grid -->
                          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                             <div class="bg-emerald-50/40 dark:bg-emerald-950/20 p-5 rounded-[2rem] border border-emerald-100/40 dark:border-emerald-900/30">
                                <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none block mb-1">Total Rent Collected</span>
                                <h4 class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="rentalStats.totalCollectedRent" prefix="₹"></h4>
                             </div>
                             <div class="bg-amber-50/40 dark:bg-amber-950/20 p-5 rounded-[2rem] border border-amber-100/40 dark:border-amber-900/30">
                                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none block mb-1">Total Rent Pending</span>
                                <h4 class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1" [appCountUp]="rentalStats.totalPendingRent" prefix="₹"></h4>
                             </div>
                             <div class="bg-blue-50/40 dark:bg-blue-950/20 p-5 rounded-[2rem] border border-blue-100/40 dark:border-blue-900/30">
                                <span class="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none block mb-1">Occupancy Rate</span>
                                <h4 class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{{ rentalStats.occupancyRate }}%</h4>
                             </div>
                             <div class="bg-purple-50/40 dark:bg-purple-950/20 p-5 rounded-[2rem] border border-purple-100/40 dark:border-purple-900/30">
                                <span class="text-[9px] font-black text-purple-500 uppercase tracking-widest leading-none block mb-1">Occupied Rooms</span>
                                <h4 class="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{{ rentalStats.occupiedHouses }} / {{ rentalStats.totalHouses }}</h4>
                             </div>
                          </div>

                          <!-- Chart and Renter Information Grid -->
                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             @if (!showOverviewData) {
                                <!-- Chart: Overall Collected for Individual Room -->
                                <div class="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden">
                                   <div class="flex justify-between items-center mb-6">
                                      <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Overall Collected per Individual Room ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h4>
                                      <div class="flex gap-2">
                                         <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                         <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                      </div>
                                   </div>
                                   <div class="w-full flex-1 relative chart-touch-wrapper" (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                                      <canvas #rentalOverviewChart="base-chart" baseChart [data]="rentalOverviewChartData" [options]="rentalOverviewChartOptions" [type]="rentalOverviewChartType"></canvas>
                                   </div>
                                </div>
                             } @else {
                                <!-- Rental Rooms Ledger Table -->
                                <div class="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-150 dark:border-gray-800 shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden">
                                   <div class="flex justify-between items-center mb-4">
                                      <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rental Rooms Ledger ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h4>
                                   </div>
                                   <div class="overflow-y-auto no-scrollbar flex-1">
                                      <table class="w-full">
                                         <thead class="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                                            <tr>
                                               <th class="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Room / House</th>
                                               <th class="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Renter</th>
                                               <th class="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                               <th class="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Collected</th>
                                               <th class="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending</th>
                                            </tr>
                                         </thead>
                                         <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                            @for (house of houses; track house.id) {
                                               @let rData = getHouseRentalData(house);
                                               <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                                  <td class="px-4 py-3.5">
                                                     <span class="text-xs font-black text-gray-900 dark:text-white uppercase">{{ house.houseName }}</span>
                                                  </td>
                                                  <td class="px-4 py-3.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                     {{ house.status === 'Occupied' ? house.renterName : 'Vacant' }}
                                                  </td>
                                                  <td class="px-4 py-3.5 text-xs">
                                                     <span [class]="house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
                                                           class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        {{ house.status }}
                                                     </span>
                                                  </td>
                                                  <td class="px-4 py-3.5 text-right text-xs font-black text-emerald-600" [appCountUp]="rData.paidRent" prefix="₹"></td>
                                                  <td class="px-4 py-3.5 text-right text-xs font-black text-amber-600" [appCountUp]="rData.pendingRent" prefix="₹"></td>
                                               </tr>
                                            }
                                            @if (houses.length === 0) {
                                               <tr>
                                                  <td colspan="5" class="px-4 py-12 text-center text-gray-400 italic text-[11px] uppercase tracking-widest opacity-60">No properties registered.</td>
                                               </tr>
                                            }
                                         </tbody>
                                      </table>
                                   </div>
                                </div>
                             }

                             <!-- Renters and Room Information -->
                             <div class="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-150 dark:border-gray-800/80 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden">
                                <div class="mb-4">
                                   <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Latest Rent Collections</h4>
                                   <div class="space-y-3 overflow-y-auto no-scrollbar max-h-[260px]">
                                      @for (pay of rentalStats.recentPayments; track $index) {
                                         <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60">
                                            <div class="min-w-0">
                                               <p class="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{{ pay.houseName }}</p>
                                               <p class="text-[9px] text-gray-450 font-bold uppercase tracking-wide truncate mt-0.5">{{ pay.renterName }} • {{ pay.date | date:'mediumDate' }}</p>
                                            </div>
                                            <div class="text-right shrink-0">
                                               <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-tight block">+₹{{ pay.amount }}</span>
                                               <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest block bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-lg mt-0.5">Paid</span>
                                            </div>
                                         </div>
                                      }
                                      @if (rentalStats.recentPayments.length === 0) {
                                         <div class="py-12 text-center text-gray-455 dark:text-slate-500 italic text-xs">
                                            No paid rent records found.
                                         </div>
                                      }
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    }
                 </div>
              </div>
           }

        <!-- ═══════════ SUPER ADMIN VIEW ═══════════ -->
        @if (isSuperAdmin && activeTab !== 'security') {
           <div class="space-y-10 card-animate">
              
              <!-- Super Admin Header -->
              <div class="flex justify-between items-center px-2">
                 <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Admin Management</h2>
                    <p class="text-sm font-medium text-gray-500 mt-1">Manage administrative staff and module permissions.</p>
                 </div>
                 <button (click)="showAdminForm = !showAdminForm; isAdminEditMode = false; adminForm.reset(); adminForm.get('username')?.enable();" 
                    class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all flex items-center gap-2">
                    <svg *ngIf="!showAdminForm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    <svg *ngIf="showAdminForm" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    {{ showAdminForm ? 'Close Form' : 'Register Admin' }}
                 </button>
              </div>

              <!-- Admin Members List -->
              <section class="space-y-6">
                 <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Active Administrative Staff</h3>
                    
                    <!-- Search Filter (Only if > 5 admins) -->
                    <div *ngIf="admins.length > 5" class="w-full sm:w-64 relative">
                       <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                       </span>
                       <input type="text" [(ngModel)]="adminSearchQuery" placeholder="Search admins..." 
                          class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-gray-900 dark:text-white shadow-sm transition-all">
                    </div>
                 </div>

                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (admin of getFilteredAdmins(); track admin.uid) {
                       <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col group hover:shadow-md transition-all relative overflow-hidden">
                          <div class="flex justify-between items-start mb-4">
                             <div>
                                <div class="flex items-center gap-2">
                                   <h4 class="font-black text-gray-900 dark:text-white leading-none">{{ admin.displayName }}</h4>
                                   <span class="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter leading-none">&#64;{{ admin.username }}</span>
                                </div>
                                <p class="text-xs text-gray-500 font-bold mt-2 leading-none">{{ admin.phone }}</p>
                             </div>
                             <div class="flex gap-1 transition-all">
                                <button (click)="editAdminMember(admin)" class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl" title="Edit Staff">
                                   <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button (click)="removeAdminMember(admin)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl" title="Revoke Access">
                                   <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                             </div>
                          </div>
                          
                          <!-- Admin Identity & Password Details -->
                          <div class="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                             <div class="flex justify-between items-end">
                                <div>
                                   <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Resident Address</p>
                                   <p class="text-xs text-gray-600 dark:text-gray-300 font-bold leading-relaxed line-clamp-1">{{ admin.address || 'No address provided' }}</p>
                                </div>
                                <div class="bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                                   <p class="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-0.5">Customers</p>
                                   <p class="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">{{ getAdminCustomerCount(admin.uid) }}</p>
                                </div>
                             </div>
                             
                             <div class="grid grid-cols-2 gap-4">
                                @if (admin.idType) {
                                   <div>
                                      <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{{ admin.idType }}</p>
                                      <p class="text-xs font-black text-gray-900 dark:text-white">{{ admin.idValue || '---' }}</p>
                                   </div>
                                }
                                <div>
                                   <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic text-indigo-400">Access Password</p>
                                   <div class="flex items-center gap-2">
                                      <button type="button" (click)="togglePasswordReveal(admin.username!)" class="text-indigo-500 hover:text-indigo-700 transition-colors" [title]="revealedPasswords[admin.username!] ? 'Hide' : 'Reveal'">
                                         <svg *ngIf="!revealedPasswords[admin.username!]" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                         <svg *ngIf="revealedPasswords[admin.username!]" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.253 0 2.426.287 3.477.799m-1.763 3.064a3 3 0 11-4.243 4.243m4.242-4.242L9.88 9.88m-2.012-2.012L2.031 2.031" /></svg>
                                      </button>
                                      <span *ngIf="revealedPasswords[admin.username!]" class="text-xs font-mono font-black text-rose-500 animate-in fade-in duration-300">{{ revealedPasswords[admin.username!] }}</span>
                                      <span *ngIf="!revealedPasswords[admin.username!]" class="text-xs font-mono font-bold text-gray-300 italic">Hidden</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    }
                    @if (getFilteredAdmins().length === 0) {
                       <div class="col-span-full py-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] opacity-50">
                          <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No administrative members found</p>
                       </div>
                    }
                 </div>
              </section>
           </div>
        }

        <!-- ═══════════ BILLS TRACKER (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'bills' && showBillsTab) {
          <div class="card-animate flex flex-col" style="animation-delay:0.05s">
            
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 order-1">
               <div>
                  <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bills & Payments</h2>
                  <p class="text-sm font-medium text-gray-500 mt-1">Utility tracking and automated bill retrieval.</p>
               </div>
            </div>
            
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 order-2">
               <div class="bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-[2rem] border border-indigo-100/50 dark:border-indigo-800/30">
                  <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total Pending</p>
                  <p class="text-3xl font-black text-gray-900 dark:text-white leading-none" [appCountUp]="billStats.pendingAmount" prefix="₹"></p>
               </div>
               <div class="bg-amber-50/50 dark:bg-amber-900/20 p-6 rounded-[2rem] border border-amber-100/50 dark:border-amber-800/30">
                  <p class="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Electricity Total</p>
                  <p class="text-3xl font-black text-gray-900 dark:text-white leading-none" [appCountUp]="billStats.electricityTotal" prefix="₹"></p>
               </div>
               <div class="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-100/50 dark:border-blue-800/30">
                  <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Water Arrears</p>
                  <p class="text-3xl font-black text-gray-900 dark:text-white leading-none" [appCountUp]="billStats.waterTotal" prefix="₹"></p>
               </div>
               <div class="bg-emerald-50/50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-800/30">
                  <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Paid Bills</p>
                  <p class="text-3xl font-black text-gray-900 dark:text-white leading-none" [appCountUp]="billStats.paidThisMonthAmount" prefix="₹"></p>
               </div>
            </div>
            
            <div class="mb-12 order-3">
               <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 px-2">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                       <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div>
                      <h3 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Registered Services</h3>
                      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Automated tracking for these numbers</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <!-- View Toggle -->
                    <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/50">
                      <button (click)="isBillListView = false" 
                              [class.bg-white]="!isBillListView"
                              [class.dark:bg-gray-700]="!isBillListView"
                              [class.shadow-sm]="!isBillListView"
                              class="p-2 rounded-lg transition-all text-gray-500" [class.text-indigo-600]="!isBillListView">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-16zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      </button>
                      <button (click)="isBillListView = true" 
                              [class.bg-white]="isBillListView"
                              [class.dark:bg-gray-700]="isBillListView"
                              [class.shadow-sm]="isBillListView"
                              class="p-2 rounded-lg transition-all text-gray-500" [class.text-indigo-600]="isBillListView">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                      </button>
                    </div>

                    <div class="relative flex-1 md:flex-none hidden sm:block">
                       <select [(ngModel)]="serviceTypeFilter" class="w-full md:w-40 pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="all">All Types</option>
                          <option value="electricity">Electricity</option>
                          <option value="water">Water</option>
                          <option value="internet">Internet</option>
                          <option value="mobile">Mobile</option>
                          <option value="other">Other</option>
                       </select>
                       <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>

                    <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/50 hidden sm:flex">
                      <button type="button" (click)="billStatusFilter = 'all'"
                              class="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                              [class.bg-white]="billStatusFilter === 'all'"
                              [class.dark:bg-gray-700]="billStatusFilter === 'all'"
                              [class.shadow-sm]="billStatusFilter === 'all'"
                              [class.text-indigo-600]="billStatusFilter === 'all'"
                              [class.text-gray-500]="billStatusFilter !== 'all'">All</button>
                      <button type="button" (click)="billStatusFilter = 'unpaid'"
                              class="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                              [class.bg-white]="billStatusFilter === 'unpaid'"
                              [class.dark:bg-gray-700]="billStatusFilter === 'unpaid'"
                              [class.shadow-sm]="billStatusFilter === 'unpaid'"
                              [class.text-rose-600]="billStatusFilter === 'unpaid'"
                              [class.text-gray-500]="billStatusFilter !== 'unpaid'">Unpaid</button>
                      <button type="button" (click)="billStatusFilter = 'paid'"
                              class="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                              [class.bg-white]="billStatusFilter === 'paid'"
                              [class.dark:bg-gray-700]="billStatusFilter === 'paid'"
                              [class.shadow-sm]="billStatusFilter === 'paid'"
                              [class.text-emerald-600]="billStatusFilter === 'paid'"
                              [class.text-gray-500]="billStatusFilter !== 'paid'">Paid</button>
                    </div>
                    <button (click)="openBillsFilterModal()" class="sm:hidden p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-indigo-600 shadow-sm">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </button>
                    <button (click)="handleSyncBills()" [disabled]="isSyncing" class="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2">
                       <svg class="h-3.5 w-3.5" [class.animate-spin]="isSyncing" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                       <span class="hidden sm:inline">{{ isSyncing ? 'Syncing...' : 'Deep Sync' }}</span>
                       <span class="sm:hidden">{{ isSyncing ? '...' : 'Sync' }}</span>
                    </button>
                    <button (click)="scrollToTop(); openServiceForm()" class="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">
                      <span class="hidden sm:inline">Register Service</span>
                      <span class="sm:hidden">New</span>
                    </button>
                  </div>
               </div>

               @if (activeBillTab === 'tracking') {
                 <div class="grid grid-cols-1 gap-6">
                    <!-- Skeleton Loaders -->
                    @if (isSyncing) {
                      @for (i of [1,2,3]; track i) {
                        <div class="rounded-[2rem] bg-gray-100 dark:bg-gray-800/50 p-6 h-[280px] animate-pulse">
                           <div class="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-4"></div>
                           <div class="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                           <div class="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded-full mb-6"></div>
                           <div class="mt-auto h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                        </div>
                      }
                    }
                    
                @if (!isBillListView) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (service of filteredTrackedServices; track service.id) {
                      <div class="group relative overflow-hidden rounded-[2rem] bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 p-6 flex flex-col justify-between h-full">
                         <!-- Individual Sync Loader Overlay -->
                         @if (service.id && syncingServices[service.id]) {
                            <div class="absolute inset-0 z-20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                               <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                               <p class="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-4">Syncing Live Data...</p>
                            </div>
                         }
                         <!-- Decorative Gradient Background -->
                         <div class="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"
                              [ngClass]="{
                                 'from-amber-400 to-orange-600': service.serviceType === 'electricity',
                                 'from-blue-400 to-indigo-600': service.serviceType === 'water',
                                 'from-purple-400 to-pink-600': service.serviceType === 'internet',
                                 'from-emerald-400 to-teal-600': service.serviceType === 'mobile',
                                 'from-rose-400 to-red-600': service.serviceType === 'other'
                              }"></div>

                         <div class="relative z-10">
                            <div class="flex justify-between items-start mb-4">
                               <div class="p-3 rounded-2xl bg-gradient-to-br shadow-lg group-hover:rotate-12 transition-transform duration-500"
                                    [ngClass]="{
                                       'from-amber-400 to-orange-500 text-white': service.serviceType === 'electricity',
                                       'from-blue-400 to-indigo-500 text-white': service.serviceType === 'water',
                                       'from-purple-400 to-pink-500 text-white': service.serviceType === 'internet',
                                       'from-emerald-400 to-teal-500 text-white': service.serviceType === 'mobile',
                                       'from-rose-400 to-red-500 text-white': service.serviceType === 'other'
                                    }">
                                  <svg *ngIf="service.serviceType === 'electricity'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                  <svg *ngIf="service.serviceType === 'water'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                  <svg *ngIf="service.serviceType === 'internet'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M2.93 9.344a15 15 0 0121.142 0"/></svg>
                                  <svg *ngIf="service.serviceType === 'mobile'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                               </div>
                               
                               <div class="flex gap-1">
                                  <button (click)="handleFetchLiveBill(service)" [disabled]="service.id && syncingServices[service.id]"
                                          class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all" title="Quick Sync">
                                     <svg class="w-4 h-4" [class.animate-spin]="service.id && syncingServices[service.id]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                  </button>
                                  <button (click)="openServiceDetails(service)" class="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all" title="View History & Insights">
                                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                  </button>
                                  <a *ngIf="service.serviceType === 'electricity'" [href]="'https://www.tgsouthernpower.org/billinginfo?ukscno=' + service.serviceNumber + '&submit=SUBMIT'" target="_blank"
                                     class="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all" [title]="'View Portal for ' + service.serviceNumber">
                                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                  </a>
                                  @if (service.serviceType === 'water') {
                                    <button (click)="openWaterBill(service.serviceNumber)"
                                       class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all" [title]="'View Portal for ' + service.serviceNumber">
                                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                    </button>
                                  }
                                  <button (click)="openServiceForm(service)" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all" title="Edit">
                                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button (click)="handleRemoveService(service.id!)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" title="Remove Service">
                                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                               </div>
                            </div>

                            <h4 class="text-xl font-black text-gray-900 dark:text-white truncate leading-tight mb-0.5">{{ service.title || service.provider }}</h4>
                            <div class="flex items-center gap-2 mb-6">
                               <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ service.serviceNumber }}</p>
                               @if (service.consumerName) {
                                  <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <p class="text-[9px] font-black text-indigo-500 uppercase tracking-tighter truncate max-w-[100px]">{{ service.consumerName }}</p>
                               }
                               <div *ngIf="service.lastSynced" class="flex items-center gap-1 text-[9px] font-bold text-green-500">
                                  <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                  SYNCED
                               </div>
                            </div>
                         </div>

                         <div class="relative z-10">
                            <div class="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                               <div class="flex justify-between items-end">
                                  <div>
                                     <p class="text-[9px] font-black uppercase tracking-widest mb-1"
                                        [class]="isTrackedServicePaid(service) ? 'text-emerald-500' : 'text-gray-400'">
                                        {{ service.lastAmountLabel || (service.serviceType === 'water' ? 'Total Arrears' : 'Payable Amount') }}
                                     </p>
                                     <p class="text-2xl font-black"
                                        [class]="isTrackedServicePaid(service) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'">
                                        ₹{{ service.lastAmount !== undefined && service.lastAmount !== null ? service.lastAmount : '0' }}
                                     </p>
                                  </div>
                                  <div class="text-right">
                                     <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        {{ isTrackedServicePaid(service) ? 'Paid Date' : 'Due Date' }}
                                     </p>
                                     <p class="text-xs font-black" [class]="isTrackedServicePaid(service) ? 'text-emerald-500' : 'text-rose-500'">
                                        {{ getTrackedServiceDisplayDate(service) || 'Pending Sync' }}
                                     </p>
                                  </div>
                               </div>
                               <div class="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div class="flex-1">
                                   <button *ngIf="service.lastAmount" (click)="storeBillAsRecord(service)" class="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
                                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                      Store Record
                                   </button>
                                   <button *ngIf="!service.lastAmount" (click)="handleFetchLiveBill(service)" class="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
                                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                      Fetch Live
                                   </button>
                                </div>
                                <button *ngIf="service.lastAmount && !isTrackedServicePaid(service)"
                                    (click)="handlePayNow(service)"
                                    [class]="service.serviceType === 'water' ? 'px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-indigo-600/20 uppercase tracking-widest hover:scale-105 transition-all' : 'px-4 py-2 bg-orange-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-orange-600/20 uppercase tracking-widest hover:scale-105 transition-all'">
                                    Pay Now
                                 </button>
                             </div>
                            </div>
                         </div>
                      </div>
                    }
                  </div>
                } @else {
                  <!-- List View Template -->
                  <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    @for (service of filteredTrackedServices; track service.id) {
                      <div (click)="openServiceDetails(service)" 
                           class="bg-white/60 dark:bg-gray-800/60 backdrop-blur p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex justify-between items-center group hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm">
                        <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br"
                               [ngClass]="{
                                 'from-amber-400 to-orange-500': service.serviceType === 'electricity',
                                 'from-blue-400 to-indigo-500': service.serviceType === 'water',
                                 'from-purple-400 to-pink-500': service.serviceType === 'internet',
                                 'from-emerald-400 to-teal-500': service.serviceType === 'mobile',
                                 'from-rose-400 to-red-500': service.serviceType === 'other'
                               }">
                             <svg *ngIf="service.serviceType === 'electricity'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                             <svg *ngIf="service.serviceType !== 'electricity'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </div>
                          <div>
                            <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ service.title || service.provider }}</h4>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{{ service.serviceNumber }}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-lg font-black tracking-tighter"
                             [class]="isTrackedServicePaid(service) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'">₹{{ service.lastAmount || 0 }}</p>
                          <p class="text-[9px] font-black uppercase tracking-widest"
                             [class]="isTrackedServicePaid(service) ? 'text-emerald-500' : 'text-rose-500'">{{ getTrackedServiceDisplayDate(service) }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
                    @if (filteredTrackedServices.length === 0 && !isSyncing) {
                      <div class="col-span-full py-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-40">
                         <p class="text-sm font-black text-gray-400 uppercase tracking-widest">No services matching this filter</p>
                      </div>
                    }
                 </div>
               } @else {
                 <!-- Stored Bill Records View -->
                 <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="flex justify-between items-center mb-6">
                       <div class="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                          <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2">Filter Year</span>
                          <select [(ngModel)]="selectedStoredYear" (ngModelChange)="loadStoredRecords()"
                                  class="bg-transparent border-none outline-none text-xs font-black text-indigo-600 dark:text-indigo-400 pr-8 cursor-pointer uppercase">
                             <option *ngFor="let y of archiveAvailableYears" [value]="y">{{y}} Records</option>
                          </select>
                       </div>
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ storedRecords.length }} Records Found</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       @for (record of storedRecords; track record.id) {
                          <div class="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                             <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                   <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                </div>
                                <div>
                                   <h4 class="text-sm font-black text-gray-900 dark:text-white leading-tight truncate max-w-[150px]">{{ record.consumerName }}</h4>
                                   <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{{ record.date | date:'dd MMM yyyy' }} • #{{ record.serviceNumber }}</p>
                                </div>
                             </div>
                             <div class="flex items-center gap-4">
                                <div class="text-right">
                                   <p class="text-lg font-black text-gray-900 dark:text-white tracking-tighter">₹{{ record.amount }}</p>
                                   <span class="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{{ record.month }}</span>
                                </div>
                                <button (click)="handleDeleteStoredRecord(record.id!)" class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                   <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                             </div>
                          </div>
                       }
                       @if (storedRecords.length === 0) {
                          <div class="col-span-full py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem]">
                             <svg class="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                             <p class="text-xs font-black text-gray-400 uppercase tracking-widest">No stored records for {{ selectedStoredYear }}</p>
                          </div>
                       }
                    </div>
                 </div>
               }
            </div>
          </div>
        }

        <!-- ═══════════ INTEREST DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'interest' && showInterestTab) {
          <div class="card-animate flex flex-col" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Interest Management</h2>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{{ interests.length }} active loan schemes</p>
              </div>
              <button (click)="goToCreateInterest()" class="px-6 py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all whitespace-nowrap">
                 <svg class="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                 <span class="hidden sm:inline">New Loan</span>
              </button>
            </div>


            <!-- Analytics & Insights -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <!-- Bar Chart Card -->
              <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 h-[220px] sm:h-[320px] relative overflow-hidden card-animate">
                <div class="flex justify-between items-center mb-4 sm:mb-6">
                   <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Collections · {{ selectedYear }}</h3>
                   <div class="flex items-center gap-3">
                      <div class="flex items-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-sm">
                         <button (click)="panChart('loan', 100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Move Left">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                         </button>
                         <button (click)="zoomChart('loan', 1.1)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Zoom In">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                         </button>
                         <button (click)="resetChartZoom('loan')" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Reset Zoom">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                         </button>
                         <button (click)="zoomChart('loan', 0.9)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Zoom Out">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                         </button>
                         <button (click)="panChart('loan', -100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Move Right">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                         </button>
                      </div>
                      <div class="flex gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style="animation-delay: 0.2s"></div>
                      </div>
                   </div>
                </div>
                <div class="h-[140px] sm:h-[220px] w-full chart-touch-wrapper"
                     (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                  <canvas #loanChart="base-chart" baseChart
                    [data]="barChartData"
                    [options]="barChartOptions"
                    [type]="barChartType">
                  </canvas>
                </div>
              </div>

              <!-- Filter & Summary Card -->
              <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-auto sm:h-[320px] kpi-animate">
                <div>
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 sm:mb-6">Analytics Filter</h3>
                  
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-1">
                    <div>
                      <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Year</label>
                      <select [(ngModel)]="selectedYear" (ngModelChange)="updateLoanAnalytics()"
                              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                        @for (year of availableYears; track year) {
                          <option [value]="year">{{ year }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Month</label>
                      <select [(ngModel)]="selectedMonth" (ngModelChange)="updateLoanAnalytics()"
                              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                        <option [value]="-1">All Months</option>
                        <option [value]="0">January</option>
                        <option [value]="1">February</option>
                        <option [value]="2">March</option>
                        <option [value]="3">April</option>
                        <option [value]="4">May</option>
                        <option [value]="5">June</option>
                        <option [value]="6">July</option>
                        <option [value]="7">August</option>
                        <option [value]="8">September</option>
                        <option [value]="9">October</option>
                        <option [value]="10">November</option>
                        <option [value]="11">December</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="pt-3 sm:pt-4 border-t border-gray-50 dark:border-gray-700/50 mt-4 sm:mt-0">
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Filtered Interest</p>
                  <p class="text-2xl sm:text-3xl font-black text-indigo-600" [appCountUp]="filteredTotalInterest" prefix="₹"></p>
                </div>
              </div>
            </div>

            <!-- Search & Filters Row -->
            <div class="flex flex-col md:flex-row gap-4 mb-8">
               <div class="flex-1 bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-1.5 flex items-center shadow-sm border border-gray-100 dark:border-gray-700/50">
                  <div class="pl-4 pr-2 text-gray-400">
                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input type="text" [(ngModel)]="loanSearchQuery" placeholder="Search borrowers..."
                         class="w-full py-3 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white font-black placeholder:text-gray-400">
               </div>

               <div class="p-1 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-xl flex gap-1 border border-gray-200 dark:border-gray-700/50 shadow-inner w-fit">
                  <button (click)="loanStatusFilter = 'Active'"
                          [class.tab-active]="loanStatusFilter === 'Active'"
                          class="px-5 py-2 text-[9px] font-black rounded-lg transition-all duration-300 text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">
                     ACTIVE
                  </button>
                  <button (click)="loanStatusFilter = 'Inactive'"
                          [class.tab-active]="loanStatusFilter === 'Inactive'"
                          class="px-5 py-2 text-[9px] font-black rounded-lg transition-all duration-300 text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">
                     INACTIVE
                  </button>
                  <button (click)="loanStatusFilter = 'All'"
                          [class.tab-active]="loanStatusFilter === 'All'"
                          class="px-5 py-2 text-[9px] font-black rounded-lg transition-all duration-300 text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">
                     ALL
                  </button>
               </div>
            </div>

            <!-- Interest Cards -->
            <div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (loan of getFilteredLoans(); track loan.id; let i = $index) {
                <div class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'"
                     (click)="toggleLoanExpansion(loan.id!)">
                  
                  <!-- Collapsed Mobile View -->
                  <div class="sm:hidden p-5 flex justify-between items-center transition-all" *ngIf="!expandedLoans[loan.id!]">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="loan.status === 'Inactive' ? 'bg-gray-400' : 'bg-indigo-500'"></span>
                        <h3 class="text-sm font-black text-gray-900 dark:text-white truncate">{{ loan.name }}</h3>
                      </div>
                      <p class="text-[10px] text-gray-400 font-bold ml-3.5">
                        {{ loan.borrowerName }} · 
                        <span class="text-indigo-500 font-black uppercase">{{ (getLastInterestDate(loan) | date:'dd MMM') || 'No Collection' }}</span>
                      </p>
                      <p class="text-[8px] font-black text-gray-400 ml-3.5 mt-0.5 uppercase tracking-tighter">
                        Started: {{ loan.startDate | date:'dd MMM yyyy' }}
                        @if (loan.status === 'Inactive' && getLoanCompletionDate(loan)) {
                          · Completed: {{ getLoanCompletionDate(loan) | date:'dd MMM yyyy' }}
                        }
                      </p>
                    </div>
                    <div class="text-right ml-4">
                      <p class="text-xs font-black text-gray-900 dark:text-white" [appCountUp]="loan.amount" prefix="₹"></p>
                      <p class="text-[9px] font-black text-indigo-500">{{ loan.interestRate }}% Int.</p>
                    </div>
                    <svg class="w-4 h-4 text-gray-300 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                  </div>

                  <!-- Full Card View (Always on Desktop, Expandable on Mobile) -->
                  <div [class.hidden]="!expandedLoans[loan.id!]" class="sm:block transition-all duration-300">
                    <div class="h-1.5" [ngClass]="loan.status === 'Inactive' ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'"></div>
                    <div class="p-6">
                      <div class="flex justify-between items-start mb-4">
                         <span class="text-xs font-bold text-blue-600 dark:text-blue-400 capitalize">{{ loan.interestRate }}% Interest p.m.</span>
                         <div class="flex items-center gap-2">
                           <span class="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter" [ngClass]="loan.status === 'Inactive' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'">{{ loan.status || 'Active' }}</span>
                           <svg class="w-4 h-4 text-gray-400 sm:hidden rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                         </div>
                      </div>
                      <div class="flex justify-between items-start mb-4">
                         <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors truncate flex-1" (click)="$event.stopPropagation(); viewInterestDetails(loan.id!)">{{ loan.name }}</h3>
                         <div class="flex flex-col items-end">
                           <div class="flex items-center gap-2">
                             @if (isLoanReminderDue(loan)) {
                               <span class="text-[8px] font-black px-2 py-0.5 bg-orange-500 text-white rounded-md uppercase animate-pulse">Reminder Due</span>
                             }
                              <div class="flex items-center gap-2">
                                <a [href]="'tel:' + loan.borrowerPhone" (click)="$event.stopPropagation()" class="w-7 h-7 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-indigo-500/30" title="Call Borrower">
                                   <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </a>

                                <button (click)="$event.stopPropagation(); shareLoanReminder(loan)" class="w-7 h-7 bg-[#25D366] hover:bg-[#1ebe59] rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-green-500/30" title="WhatsApp Reminder">
                                    <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                                    </svg>
                                </button>

                             </div>
                           </div>
                           <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Last Collection</p>
                           <p class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase leading-none">{{ (getLastInterestDate(loan) | date:'dd MMM yyyy') || 'None' }}</p>
                         </div>
                      </div>
                       <div class="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                         <p class="text-xs text-gray-500 font-bold">{{ loan.borrowerName }}</p>
                         <p class="text-[10px] font-black text-indigo-500/70 uppercase">Started: {{ loan.startDate | date:'dd MMM yyyy' }}</p>
                         @if (loan.status === 'Inactive' && getLoanCompletionDate(loan)) {
                           <p class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Completed: {{ getLoanCompletionDate(loan) | date:'dd MMM yyyy' }}</p>
                         }
                       </div>
                      <div class="grid grid-cols-2 gap-3 mb-3">
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                          <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Principal</p>
                          <p class="text-sm font-black text-gray-900 dark:text-white" [appCountUp]="loan.amount" prefix="₹"></p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl text-right border border-gray-100/50 dark:border-gray-700/50">
                          <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Int.</p>
                          <p class="text-sm font-black text-indigo-600" [appCountUp]="getMonthlyInterest(loan)" prefix="₹"></p>
                        </div>
                      </div>
                      @if (loan.status !== 'Inactive' && getPendingInterestForLoan(loan) > 0) {
                        <div class="mb-4 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-2xl flex justify-between items-center border border-rose-100/30 dark:border-rose-900/20">
                           <p class="text-[9px] font-black text-rose-500 uppercase tracking-widest italic opacity-70">Overall Interest Due</p>
                           <p class="text-sm font-black text-rose-600 dark:text-rose-400" [appCountUp]="getPendingInterestForLoan(loan)" prefix="₹"></p>
                        </div>
                      }
                      <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                         <button (click)="$event.stopPropagation(); viewInterestDetails(loan.id!)" class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Loan Statement</button>
                         <div class="flex space-x-1">
                            <button (click)="$event.stopPropagation(); toggleLoanStatus(loan)" class="p-2 text-gray-400 hover:text-orange-500 transition-all" [title]="loan.status === 'Inactive' ? 'Mark Active' : 'Mark Inactive'"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></button>
                            <button (click)="$event.stopPropagation(); editInterest(loan.id!)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                            <button (click)="$event.stopPropagation(); deleteInterest(loan.id!)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

              @if (getFilteredLoans().length === 0) {
                <div class="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-50">
                  <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No loans found matching your criteria</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- ═══════════ CHITTI DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'chitti' && showChittiTab) {
          <div class="card-animate flex flex-col" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 order-1">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chitti Management</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ chittis.length }} active schemes</p>
              </div>
            </div>

            <!-- Action Row -->
            <div class="mb-8 order-4">
              <button (click)="goToCreateChit()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Scheme
              </button>
            </div>

            <!-- Analytics & Insights -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 order-2 lg:order-3">
              <!-- Bar Chart Card -->
              <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 h-[220px] sm:h-[320px] relative overflow-hidden card-animate">
                <div class="flex justify-between items-center mb-4 sm:mb-6">
                   <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Collections · {{ chittiSelectedYear }}</h3>
                   <div class="flex items-center gap-3">
                      <div class="flex items-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-sm">
                         <button (click)="panChart('chitti', 100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Move Left">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                         </button>
                         <button (click)="zoomChart('chitti', 1.1)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Zoom In">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                         </button>
                         <button (click)="resetChartZoom('chitti')" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Reset Zoom">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                         </button>
                         <button (click)="zoomChart('chitti', 0.9)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Zoom Out">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                         </button>
                         <button (click)="panChart('chitti', -100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Move Right">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                         </button>
                      </div>
                      <div class="flex gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style="animation-delay: 0.2s"></div>
                      </div>
                   </div>
                </div>
                <div class="h-[140px] sm:h-[220px] w-full chart-touch-wrapper"
                     (touchstart)="lockScroll()" (touchend)="unlockScroll()" (touchcancel)="unlockScroll()">
                  <canvas #chittiChart="base-chart" baseChart
                    [data]="chittiBarChartData"
                    [options]="barChartOptions"
                    [type]="barChartType">
                  </canvas>
                </div>
              </div>

              <!-- Filter & Summary Card -->
              <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-auto sm:h-[320px] kpi-animate">
                <div>
                  <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 sm:mb-6">Analytics Filter</h3>
                  
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-1">
                    <div>
                      <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Year</label>
                      <select [(ngModel)]="chittiSelectedYear" (ngModelChange)="updateChittiAnalytics()"
                              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                        @for (year of chittiAvailableYears; track year) {
                          <option [value]="year">{{ year }}</option>
                        }
                      </select>
                    </div>

                    <div>
                      <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Month</label>
                      <select [(ngModel)]="chittiSelectedMonth" (ngModelChange)="updateChittiAnalytics()"
                              class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                        <option [value]="-1">All Months</option>
                        <option [value]="0">January</option>
                        <option [value]="1">February</option>
                        <option [value]="2">March</option>
                        <option [value]="3">April</option>
                        <option [value]="4">May</option>
                        <option [value]="5">June</option>
                        <option [value]="6">July</option>
                        <option [value]="7">August</option>
                        <option [value]="8">September</option>
                        <option [value]="9">October</option>
                        <option [value]="10">November</option>
                        <option [value]="11">December</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="pt-3 sm:pt-4 border-t border-gray-50 dark:border-gray-700/50 mt-4 sm:mt-0">
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Filtered Collection</p>
                  <p class="text-2xl sm:text-3xl font-black text-pink-600" [appCountUp]="filteredTotalChitti" prefix="₹"></p>
                </div>
              </div>
            </div>

            <!-- Chitti Cards -->
            <div class="order-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (chit of chittis; track chit.id; let i = $index) {
                <div class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
                  <div class="h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
                  <div class="p-6">
                    <div class="flex justify-between items-start mb-4 text-xs font-bold text-gray-400 capitalize">{{ chit.tenure }} Months Tenure</div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 transition-colors truncate mb-1" (click)="viewChitDetails(chit.id!)">{{ chit.name }}</h3>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white" [appCountUp]="chit.monthlyAmount" prefix="₹"></p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl text-right border border-gray-100/50 dark:border-gray-700/50">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Members</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white">{{ getCustomerCount(chit.id!, 'chitti') }}</p>
                      </div>
                    </div>
                    <div class="mb-4 bg-purple-50/30 dark:bg-purple-900/10 p-3 rounded-2xl flex justify-between items-center border border-purple-100/30 dark:border-purple-900/20">
                       <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest italic opacity-70">Total Collection</p>
                       <p class="text-sm font-black text-purple-600 dark:text-purple-400" [appCountUp]="getTotalChittiPaid(chit.id!)" prefix="₹"></p>
                    </div>

                    <!-- Professional Progress Bar -->
                    <div class="mt-4 mb-4">
                      <div class="flex justify-between items-center mb-2">
                         <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Timeline</p>
                         <p class="text-[10px] font-black text-purple-600 dark:text-purple-400">
                            {{ getMonthsPassed(chit.startDate) }} / {{ chit.tenure }} Mons
                         </p>
                      </div>
                      <div class="w-full h-1.5 progress-professional rounded-full overflow-hidden">
                         <div class="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                              [style.width.%]="(getMonthsPassed(chit.startDate) / chit.tenure) * 100"></div>
                      </div>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                       <button (click)="viewChitDetails(chit.id!)" class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">View Details</button>
                       <div class="flex space-x-1">
                          <button (click)="editChit(chit.id!)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                          <button (click)="deleteChit(chit.id!)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                       </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ═══════════ CUSTOMERS DIRECTORY (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'customers' && showCustomersTab) {
          <div class="card-animate" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Customer Directory</h2>
                  <p class="text-xs sm:text-sm text-gray-500 mt-0.5">{{ allCustomers.length }} registered users</p>
               </div>
            </div>

            <div class="flex gap-3 mb-8">
               <div class="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-1.5 flex items-center">
                  <div class="relative w-full">
                     <input type="text" [(ngModel)]="customerSearchQuery" placeholder="Search customers..."
                            class="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm text-gray-900 dark:text-white font-black placeholder:text-gray-400">
                     <svg class="absolute left-3.5 top-4 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
               </div>
               <button (click)="openAddCustomerModal()" class="px-6 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95 whitespace-nowrap">
                  <svg class="h-5 w-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  <span class="hidden sm:inline text-[10px] font-black uppercase tracking-widest">New Customer</span>
               </button>
            </div>

            <!-- Module Filters -->
            <div class="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
               @for (f of ['all', 'chitti', 'interest', 'rent']; track f) {
                  <button (click)="customerModuleFilter = f"
                          [class]="customerModuleFilter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700'"
                          class="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap">
                     {{ f === 'all' ? 'All Modules' : (f === 'chitti' ? 'Chitties' : (f === 'interest' ? 'Loans / Interest' : 'Rentals / Rent')) }}
                  </button>
               }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               @for (cust of getFilteredCustomers(); track cust.id; let i = $index) {
                  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
                     <div class="absolute top-4 right-4 flex items-center gap-1 transition-all">
                        <a href="tel:{{cust.phone}}" (click)="$event.stopPropagation()" class="p-2 text-gray-400 hover:text-green-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 transition-colors cursor-pointer z-10 flex items-center justify-center" title="Call">
                           <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        </a>
                        <button (click)="openEditCustomer(cust); $event.stopPropagation()" class="p-2 text-gray-400 hover:text-purple-600 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 transition-colors cursor-pointer z-10" title="Edit">
                           <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="deleteCustomer(cust.id!); $event.stopPropagation()" class="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 transition-colors cursor-pointer z-10" title="Delete">
                           <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                     <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-lg shadow-inner">
                           {{ cust.name?.charAt(0) || '?' }}
                        </div>
                        <div class="min-w-0 pr-28">
                           <h4 class="font-black text-gray-900 dark:text-white truncate">{{ cust.name }}</h4>
                           <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ cust.username ? '@' + cust.username : 'Temporary' }}</p>
                        </div>
                     </div>
                     <div class="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Type: <span class="text-purple-600">{{ cust.schemeType || 'Interest' }}</span></p>
                        <button (click)="viewCustomerAccounts(cust); $event.stopPropagation()" class="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline z-10 cursor-pointer relative">View Accounts →</button>
                     </div>
                  </div>
               }
            </div>
            @if (getFilteredCustomers().length === 0) {
               <div class="py-20 text-center opacity-60 italic text-gray-500 dark:text-gray-400">No customers matching your search.</div>
            }
          </div>
        }

        <!-- ═══════════ RENTALS MANAGEMENT (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'rentals' && showRentalsTab) {
          <app-rental-management
            [houses]="houses"
            [bills]="bills"
            [activeHouseId]="activeHouseId"
            [activeHouse]="getActiveHouse() || null"
            [rentalView]="rentalView"
            [selectedYear]="rentalSelectedYear"
            [availableYears]="rentalAvailableYears"
            [filteredTotalRent]="filteredTotalRent"
            [chartData]="rentalBarChartData"
            [rentalUtilityBills]="rentalUtilityBills"
            [refetchingHouseIds]="refetchingHouseIds"
            [trackedServices]="trackedServices"
            (onRegisterProperty)="openRentalHouseForm()"
            (onEditProperty)="openRentalHouseForm($event)"
            (onDeleteProperty)="deleteRentalHouse($event)"
            (onViewLedger)="viewHouseBills($event)"
            (onBackToHouses)="rentalView = 'houses'; activeHouseId = null"
            (onAddMonthlyRecord)="openMonthlyBillForm()"
            (onEditBill)="openMonthlyBillForm($event.bill, $event.index)"
            (onDeleteBill)="deleteMonthlyBill($event)"
            (onYearChange)="rentalSelectedYear = $event; updateRentalAnalytics()"
            (onLockScroll)="lockScroll()"
            (onUnlockScroll)="unlockScroll()"
            (onRefetchBills)="refreshUtilityBills($event)"
            (onSendRentReminder)="sendRentReminder($event)"
            (onPrintRentReceipt)="printRentReceipt($event)"
            (onAddExpense)="addHouseExpense($event.houseId, $event.expense)"
            (onDeleteExpense)="deleteHouseExpense($event.houseId, $event.expenseId)"
            (onVacateTenant)="vacateTenant($event.houseId, $event.settlement)">
          </app-rental-management>
        }



        <!-- ═══════════ SECURITY & PASSWORD ═══════════ -->
        @if (activeTab === 'security') {
           <div class="max-w-md mx-auto card-animate">
              <div class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
                 <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                       <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Account Security</h3>
                    <p class="text-sm text-gray-400 mt-1">Update your administrative login password</p>
                 </div>

                 <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="space-y-6">
                    <div>
                       <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">New Password</label>
                       <div class="relative">
                          <input [type]="showAdminPassword ? 'text' : 'password'" formControlName="newPassword" placeholder="Minimum 6 characters"
                             class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold pr-14">
                          <button type="button" (click)="showAdminPassword = !showAdminPassword" 
                             class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                             <svg *ngIf="!showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             <svg *ngIf="showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.253 0 2.426.287 3.477.799m-1.763 3.064a3 3 0 11-4.243 4.243m4.242-4.242L9.88 9.88m-2.012-2.012L2.031 2.031" /></svg>
                          </button>
                       </div>
                    </div>
                    <div>
                       <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                       <div class="relative">
                  <input [type]="showAdminPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Repeat new password"
                             class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold pr-14">
                          <button type="button" (click)="showAdminPassword = !showAdminPassword" 
                             class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                             <svg *ngIf="!showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             <svg *ngIf="showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.253 0 2.426.287 3.477.799m-1.763 3.064a3 3 0 11-4.243 4.243m4.242-4.242L9.88 9.88m-2.012-2.012L2.031 2.031" /></svg>
                          </button>
                       </div>
                    </div>
                    <button type="submit" [disabled]="passwordForm.invalid || isSaving"
                       class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
                       {{ isSaving ? 'Updating...' : 'Change Password' }}
                    </button>
                 </form>

                 <!-- ═══════════ BIOMETRIC AUTH ═══════════ -->
                 @if (biometricService.isAvailable$ | async) {
                    <div class="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                       <div class="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                          <div class="flex items-center gap-4">
                             <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.268 0 2.39.234 3.41.659m-4.74 12.57c-1.285-.378-2.56-1.1-3.33-2.14m7.41 1.53A9.914 9.914 0 0021 12c0-5.523-4.477-10-10-10a10.003 10.003 0 00-6.73 2.6c1.176.4 2.223 1.096 3.033 1.983m0 0l2.224 2.224"/>
                                  <path d="M12 18v.01" />
                                  <path d="M9 15v.01" />
                                  <path d="M15 15v.01" />
                                </svg>
                             </div>
                             <div>
                                <p class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Fingerprint Login</p>
                                <p class="text-[10px] text-gray-400 font-bold">Use biometrics to sign in quickly</p>
                             </div>
                          </div>
                          <label class="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" [checked]="isBiometricEnabled" (change)="toggleBiometric($event)" class="sr-only peer">
                             <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                          </label>
                       </div>
                    </div>
                 }

                 <!-- Data Management / Backfill -->
                 <div class="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ownership Management</h4>
                    <p class="text-xs text-gray-500 mb-4 font-medium">Assign existing unowned data to a specific admin username.</p>
                    
                    <div class="mb-4">
                       <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Target Username</label>
                       <div class="relative">
                          <span class="absolute left-4 top-3.5 text-gray-400 font-bold">&#64;</span>
                          <input type="text" [(ngModel)]="migrationUsername" placeholder="e.g. ram"
                             class="w-full pl-8 pr-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-black">
                       </div>
                     </div>
                  </div>
               </div>
            </div>
         }
      </main>

      <!-- GLOBAL MODAL STACK (Root Level for Rendering Independence) -->
      
        <!-- Logged-in User Profile Modal Overlay -->
        <div *ngIf="showProfileModal && currentUserProfile" class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden" (click)="closeProfileModal()">
           <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col my-auto border border-gray-100 dark:border-gray-800" (click)="$event.stopPropagation()">
              <div class="p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                 <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                       <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                       </div>
                       <div>
                          <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">My Profile</h3>
                          <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Administrator Identity</p>
                       </div>
                    </div>
                    <button (click)="closeProfileModal()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                       </svg>
                    </button>
                 </div>
              </div>

              <div class="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <!-- User details circle header -->
                 <div class="flex flex-col items-center text-center space-y-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-purple-500/35">
                       {{ currentUserProfile.displayName?.charAt(0) || 'A' }}
                    </div>
                    <div>
                       <h4 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ currentUserProfile.displayName || 'Administrator' }}</h4>
                       <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">&#64;{{ currentUserProfile.username }}</p>
                    </div>
                    <span class="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                       {{ isSuperAdmin ? 'Super Administrator' : 'System Administrator' }}
                    </span>
                 </div>

                 <!-- Grid Details -->
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                       <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                       <p class="text-xs font-black text-gray-900 dark:text-white">{{ currentUserProfile.phone || 'N/A' }}</p>
                    </div>
                    <div class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                       <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Identity Document</p>
                       <p class="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{{ currentUserProfile.idType ? (currentUserProfile.idType + ': ' + currentUserProfile.idValue) : 'Not Provided' }}</p>
                    </div>
                    <div class="col-span-2 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                       <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Residential Address</p>
                       <p class="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-line leading-relaxed">{{ currentUserProfile.address || 'Address information not registered' }}</p>
                    </div>
                 </div>

                 <!-- Module Access checklist for regular admins -->
                 <div *ngIf="!isSuperAdmin" class="space-y-3 pt-2">
                    <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Module Access Configurations</h5>
                    <div class="grid grid-cols-2 gap-2">
                       <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all"
                            [ngClass]="showInterestTab 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-600'">
                          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="showInterestTab ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"/>
                          </svg>
                          Loans Module
                       </div>
                       <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all"
                            [ngClass]="showChittiTab 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-600'">
                          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="showChittiTab ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"/>
                          </svg>
                          Chitti Module
                       </div>
                       <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all"
                            [ngClass]="showCustomersTab 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-600'">
                          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="showCustomersTab ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"/>
                          </svg>
                          Customers Directory
                       </div>
                       <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all"
                            [ngClass]="showBillsTab 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-600'">
                          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="showBillsTab ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"/>
                          </svg>
                          Bills Tracker
                       </div>
                       <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all col-span-2"
                            [ngClass]="showRentalsTab 
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-600'">
                          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" [attr.d]="showRentalsTab ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'"/>
                          </svg>
                          Rentals Management
                       </div>
                    </div>
                 </div>

                 <button (click)="closeProfileModal()" class="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.01] transition-all">Close Profile</button>
              </div>
           </div>
        </div>

        <!-- HRA Rent Receipt Modal Overlay -->
        <div *ngIf="showReceiptModal && selectedReceiptHouse && selectedReceiptBill" class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
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

        <!-- 1. Admin/Edit Profile Form Overlay -->
        @if (showAdminForm || isAdminEditMode) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col relative my-auto">
               <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                     </div>
                     <div>
                        <h3 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ isAdminEditMode ? 'Update Account' : 'Register Admin' }}</h3>
                        <p class="text-sm font-medium text-gray-500 mt-1">Configure system access and administrative identity.</p>
                     </div>
                  </div>
                  <button (click)="closeAdminForm()" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
                  <form [formGroup]="adminForm" (ngSubmit)="createAdminMember()" class="space-y-6">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                            <input type="text" formControlName="name" placeholder="Enter Full Name"
                               class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                         </div>
                         <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Username (Login ID)</label>
                            <input type="text" formControlName="username" placeholder="Login username"
                               class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-black"
                                [ngClass]="{'bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed': isAdminEditMode}">
                         </div>
                         <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                            <input type="tel" formControlName="phone" placeholder="10 Digit Number"
                               class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                         </div>
                         <div>
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                               {{ isAdminEditMode ? 'Reset Password (Optional)' : 'Admin Password' }}
                            </label>
                            <div class="relative">
                               <input [type]="showAdminPassword ? 'text' : 'password'" formControlName="password" 
                                  [placeholder]="isAdminEditMode ? 'Leave blank to keep current' : 'Enter password'"
                                  class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold pr-14">
                               <button type="button" (click)="showAdminPassword = !showAdminPassword" 
                                  class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                  <svg *ngIf="!showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  <svg *ngIf="showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274 4.057-5.064-7 9.542-7 1.253 0 2.426.287 3.477.799m-1.763 3.064a3 3 0 11-4.243 4.243m4.242-4.242L9.88 9.88m-2.012-2.012L2.031 2.031" /></svg>
                               </button>
                            </div>
                         </div>
                          <div class="md:col-span-2">
                             <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Residential Address</label>
                             <textarea formControlName="address" rows="3" placeholder="Enter complete address"
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold resize-none"></textarea>
                          </div>
                          <div class="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                             <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Module Access</label>
                             <div class="flex flex-wrap gap-4">
                                <label class="flex items-center space-x-2 cursor-pointer">
                                   <input type="checkbox" formControlName="tab_interest" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                                   <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Loans</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                   <input type="checkbox" formControlName="tab_chitti" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                                   <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Chitti</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                   <input type="checkbox" formControlName="tab_customers" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                                   <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Customers</span>
                                </label>
                                <label class="flex items-center space-x-2 cursor-pointer">
                                   <input type="checkbox" formControlName="tab_bills" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                                   <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Bills</span>
                                </label>
                             </div>
                          </div>
                      </div>
                      <div class="flex gap-4 pt-6">
                         <button type="button" (click)="closeAdminForm()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                         <button type="submit" [disabled]="adminForm.invalid || isSaving" class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20">
                            {{ isSaving ? 'Saving...' : (isAdminEditMode ? 'Update Account' : 'Finalize Access') }}
                         </button>
                      </div>
                  </form>
               </div>
            </div>
          </div>
        }

        <!-- 2. Service Registration Overlay -->
        @if (showServiceModal) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto">
              <div class="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
                 <div class="flex justify-between items-center mb-8">
                    <div>
                       <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Register Service</h3>
                       <p class="text-sm text-gray-500 font-medium mt-2">Link a service for automated tracking.</p>
                    </div>
                    <button (click)="closeServiceModal()" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all text-gray-500">
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
                 <form [formGroup]="trackedServiceForm" (ngSubmit)="handleRegisterService()" class="space-y-4">
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Category</label>
                       <select formControlName="serviceType" class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold appearance-none">
                          <option value="electricity">Electricity</option>
                          <option value="mobile">Mobile</option>
                          <option value="water">Water</option>
                          <option value="internet">Internet</option>
                       </select>
                    </div>
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service Title / Name</label>
                       <input type="text" formControlName="title" placeholder="e.g., Home Electricity, My Shop Water" class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold">
                    </div>
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Service / Consumer ID</label>
                       <input type="text" formControlName="serviceNumber" placeholder="Enter USCNO / Service Number" class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold">
                    </div>
                    <div class="pt-6 flex gap-3">
                       <button type="button" (click)="closeServiceModal()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                       <button type="submit" [disabled]="trackedServiceForm.invalid || isSaving" class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 uppercase text-[10px] tracking-widest">
                          {{ isSaving ? 'Registering...' : 'Link Account' }}
                       </button>
                    </div>
                 </form>
              </div>
            </div>
          </div>
        }

        <!-- 3. Service Details & Insights Overlay -->
        @if (showServiceDetailsModal && selectedTrackedService) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col my-auto">
               <!-- Modal Header -->
               <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div class="flex items-center gap-4">
                     <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                     </div>
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{{ selectedTrackedService.title || selectedTrackedService.provider }}</h3>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">#{{ selectedTrackedService.serviceNumber }} • {{ selectedTrackedService.consumerName || 'Unnamed' }}</p>
                     </div>
                  </div>
                  <button (click)="closeServiceDetailsModal()" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <!-- Tab Selector -->
               <div class="px-8 pt-6 flex gap-8 border-b border-gray-100 dark:border-gray-800">
                  <button (click)="activeDetailsTab = 'current'" 
                          [class.border-indigo-500]="activeDetailsTab === 'current'"
                          [class.text-indigo-600]="activeDetailsTab === 'current'"
                          class="pb-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-transparent transition-all">Current Status</button>
                  <button (click)="activeDetailsTab = 'history'" 
                          [class.border-indigo-500]="activeDetailsTab === 'history'"
                          [class.text-indigo-600]="activeDetailsTab === 'history'"
                          class="pb-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-transparent transition-all">Payment History</button>
               </div>

               <!-- Modal Body -->
               <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  @if (activeDetailsTab === 'current') {
                    <div class="">
                       <!-- Service Identification Card -->
                       <div class="bg-gray-50 dark:bg-gray-800/30 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 mb-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          @if (selectedTrackedService.serviceType !== 'water') {
                             <div class="flex flex-col">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Service ID (Alphanumeric)</span>
                                <span class="text-base font-black text-gray-900 dark:text-white uppercase">{{ selectedTrackedService.altServiceNumber || 'N/A' }}</span>
                             </div>
                             <div class="flex flex-col">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">ERO / Office</span>
                                <span class="text-base font-black text-gray-900 dark:text-white uppercase">{{ selectedTrackedService.ero || 'N/A' }}</span>
                             </div>
                             <div class="flex flex-col">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Section Name</span>
                                <span class="text-base font-black text-gray-900 dark:text-white uppercase">{{ selectedTrackedService.sectionName || 'N/A' }}</span>
                             </div>
                          }
                          <div class="flex flex-col {{ selectedTrackedService.serviceType === 'water' ? 'md:col-span-2' : '' }}">
                             <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Full Address</span>
                             <span class="text-base font-black text-gray-900 dark:text-white uppercase leading-snug">{{ selectedTrackedService.address || 'N/A' }}</span>
                          </div>
                       </div>

                       @if (selectedTrackedService.lastAmount) {
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div class="p-8 rounded-[2rem] flex flex-col justify-center"
                                  [class]="isTrackedServicePaid(selectedTrackedService) ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800'">
                                <p class="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                                   [class]="isTrackedServicePaid(selectedTrackedService) ? 'text-emerald-400' : 'text-indigo-400'">{{ selectedTrackedService.lastAmountLabel || (selectedTrackedService.serviceType === 'water' ? 'Total Arrears Balance' : 'Total Amount Payable') }}</p>
                                <p class="text-5xl font-black tracking-tighter"
                                   [class]="isTrackedServicePaid(selectedTrackedService) ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'"
                                   [appCountUp]="selectedTrackedService.lastAmount" prefix="₹"></p>
                             </div>
                             <div class="space-y-4">
                                <div class="p-6 rounded-3xl"
                                     [class]="isTrackedServicePaid(selectedTrackedService) ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800'">
                                   <p class="text-[9px] font-black uppercase tracking-widest mb-1"
                                      [class]="isTrackedServicePaid(selectedTrackedService) ? 'text-emerald-400' : 'text-rose-400'">{{ isTrackedServicePaid(selectedTrackedService) ? 'Paid Date' : 'Due Date' }}</p>
                                   <p class="text-xl font-black"
                                      [class]="isTrackedServicePaid(selectedTrackedService) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">{{ getTrackedServiceDisplayDate(selectedTrackedService) }}</p>
                                </div>
                                <div class="flex gap-3">
                                   <div class="flex-1 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                                      <div>
                                         <p class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
                                         <p class="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase">Synced</p>
                                      </div>
                                      <button (click)="handleFetchLiveBill(selectedTrackedService)" class="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-emerald-600 hover:rotate-180 transition-all duration-700">
                                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                      </button>
                                   </div>
                                   <button (click)="storeBillAsRecord(selectedTrackedService)" class="px-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
                                      Store This Bill
                                   </button>
                                </div>
                             </div>
                          </div>
                       } @else {
                          <div class="py-20 text-center">
                             <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg class="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <h4 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">No Pending Bills</h4>
                             <p class="text-sm font-medium text-gray-500 mt-2">All dues for this service have been cleared.</p>
                          </div>
                       }
                    </div>
                  } @else {
                     <div class=" space-y-6">
                        <!-- Synced Payment History -->
                        @if (selectedServiceHistory.length) {
                          <div>
                            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-2">Payment History (Synced)</h4>
                            <div class="space-y-3">
                              @for (bill of selectedServiceHistory; track bill.id) {
                                 <div class="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                    <div>
                                       <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ bill.month }} {{ bill.year }}</p>
                                       <p class="text-xl font-black text-gray-900 dark:text-white">₹{{ bill.amount }}</p>
                                    </div>
                                    <div class="flex items-center gap-4">
                                       <span class="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black rounded-xl uppercase tracking-widest">PAID</span>
                                       <button (click)="handleDeleteBill(bill)" class="p-2.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                    </div>
                                 </div>
                              }
                            </div>
                          </div>
                        }

                        <!-- Archived Bill Summaries (Manual Storage) -->
                        @if (selectedStoredHistory.length) {
                          <div>
                            <h4 class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 pl-2">Archived Summaries (Stored)</h4>
                            <div class="space-y-3">
                              @for (record of selectedStoredHistory; track record.id) {
                                 <div class="p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/50 flex justify-between items-center group hover:border-indigo-400 transition-all">
                                    <div class="flex items-center gap-4">
                                       <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                       </div>
                                       <div>
                                          <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ record.date | date:'dd MMM yyyy' }} • {{ record.month }} {{ record.year }}</p>
                                          <p class="text-lg font-black text-gray-900 dark:text-white">₹{{ record.amount }}</p>
                                       </div>
                                    </div>
                                    <button (click)="handleDeleteStoredRecord(record.id!)" class="p-2.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                 </div>
                              }
                            </div>
                          </div>
                        }

                        @if (!selectedServiceHistory.length && !selectedStoredHistory.length) {
                           <div class="py-20 text-center opacity-40 italic text-sm">No historical data found for this service.</div>
                        }
                     </div>
                  }
               </div>
            </div>
          </div>
        }

        <!-- 4. Payment Overlay -->
        @if (showPaymentModal && payingBill) {
          <app-bill-payment-modal
            class="fixed inset-0 z-[3000]"
            [bill]="payingBill"
            (paid)="onBillPaid()"
            (cancel)="closePaymentModal()">
          </app-bill-payment-modal>
        }

        <!-- 5. Live Bill Search Overlay -->
        @if (showLiveBillModal && selectedLiveBill) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] my-auto">
               <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <div>
                        <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Bill Summary</h3>
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live from Provider Portal</p>
                     </div>
                  </div>
                  <button (click)="closeLiveBillModal()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div class="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                  <div class="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                     <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Consumer Information</p>
                     <p class="text-lg font-black text-gray-900 dark:text-white uppercase">{{ selectedLiveBill.consumerName || 'Unknown' }}</p>
                     <p class="text-[11px] font-bold text-gray-400 mt-1">
                       #{{ selectedLiveBill.uniqueServiceNumber }}
                       @if (selectedLiveBill.ero) { · {{ selectedLiveBill.ero }} }
                     </p>
                  </div>
                  <div class="p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"
                       [class]="isLiveBillPaid(selectedLiveBill) ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-indigo-600 shadow-indigo-600/20'">
                     <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                     <div class="relative z-10 flex justify-between items-center">
                        <div>
                           <p class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">{{ selectedLiveBill.amountLabel || 'Amount Due' }}</p>
                           <p class="text-3xl font-black">₹{{ selectedLiveBill.totalAmountPayable }}</p>
                        </div>
                        <div class="text-right">
                           <p class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">{{ isLiveBillPaid(selectedLiveBill) ? 'Paid Date' : 'Due Date' }}</p>
                           <p class="text-base font-black">{{ getLiveBillDisplayDate(selectedLiveBill) }}</p>
                        </div>
                     </div>
                  </div>
                  <div class="flex gap-3">
                     <button (click)="closeLiveBillModal()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Close</button>
                     <button (click)="handleAddToTracker()" class="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 uppercase text-[10px] tracking-widest">Add to Tracker</button>
                  </div>
               </div>
            </div>
          </div>
        }

        <!-- 6. Customer Profile Overlay -->
        @if (showCustomerModal) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] relative my-auto">
               <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                     </div>
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{{ isEditModal ? 'Update Customer' : 'Add Customer' }}</h3>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{{ isEditModal ? 'Edit personal information' : 'Create a new customer profile' }}</p>
                     </div>
                  </div>
                  <button (click)="closeCustomerModal()" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:rotate-90 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
                  @if (!isEditModal) {
                    <div class="flex border-b border-gray-100 dark:border-gray-800 mb-8">
                      <button (click)="existingMode = false" class="flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all" [class.text-purple-600]="!existingMode" [class.border-b-2]="!existingMode" [class.border-purple-600]="!existingMode" [class.text-gray-400]="existingMode">+ New Customer</button>
                      <button (click)="existingMode = true" class="flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all" [class.text-purple-600]="existingMode" [class.border-b-2]="existingMode" [class.border-purple-600]="existingMode" [class.text-gray-400]="!existingMode">Pick Existing</button>
                    </div>
                  }

                  @if (existingMode && !isEditModal) {
                    <div class="space-y-4">
                       <input type="text" [(ngModel)]="pickerSearch" placeholder="Search by name or phone..." class="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
                       <div class="grid grid-cols-1 gap-3">
                          @for (p of filteredPickerCustomers; track p.phone) {
                             <div (click)="selectFromPicker(p)" class="p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-all flex justify-between items-center group">
                                <div>
                                   <p class="font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ p.name }}</p>
                                   <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{{ p.phone }}</p>
                                </div>
                                <svg class="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                             </div>
                          }
                       </div>
                    </div>
                  } @else {
                    <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()" class="space-y-6">
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                             <input type="text" formControlName="name" placeholder="John Doe" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Username (Login)</label>
                             <input type="text" formControlName="username" (input)="onUsernameInput()" placeholder="johndoe" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                             <input type="text" formControlName="phone" placeholder="10 digit number" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                             <input type="email" formControlName="email" placeholder="john@example.com" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-4">
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Scheme Type</label>
                             <select formControlName="schemeType" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white font-bold appearance-none">
                                <option value="chitti">Chitti</option>
                                <option value="interest">Interest (Loan)</option>
                                <option value="rent">Rent</option>
                             </select>
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Target Scheme</label>
                             <select formControlName="schemeId" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white font-bold appearance-none">
                                <option value="" disabled>Select Scheme</option>
                                @if (customerForm.get('schemeType')?.value === 'chitti') {
                                   @for (s of chittis; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                                } @else if (customerForm.get('schemeType')?.value === 'interest') {
                                   @for (s of interests; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                                } @else if (customerForm.get('schemeType')?.value === 'rent') {
                                   @for (h of houses; track h.id) { <option [value]="h.id">{{ h.houseName }}</option> }
                                }
                             </select>
                          </div>
                       </div>
                       
                       <div class="pt-8 flex gap-4">
                          <button type="button" (click)="closeCustomerModal()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                          <button type="submit" [disabled]="customerForm.invalid || isSaving" class="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-purple-500/20">
                             {{ isSaving ? 'Saving...' : (isEditModal ? 'Update Profile' : 'Create Profile') }}
                          </button>
                       </div>
                    </form>
                  }
               </div>
            </div>
          </div>
        }

        <!-- 7. Bill Entry Overlay -->
        @if (showBillForm) {
          <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
            <div class="w-full max-w-2xl max-h-[90vh] my-auto flex flex-col">
              <app-bill-form class="flex-1 flex flex-col min-h-0" [bill]="editingBill" (save)="handleSaveBill($event)" (cancel)="closeBillForm()"></app-bill-form>
            </div>
          </div>
        }

        <!-- 8. Rental House Registration Overlay -->
        @if (showRentalHouseForm) {
           <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
              <div class="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-[3rem] flex flex-col shadow-2xl my-auto">
                 <div class="p-8 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div class="flex justify-between items-center">
                       <div class="flex items-center gap-4">
                          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                             <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          </div>
                          <div>
                             <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ isRentalEditMode ? 'Update' : 'Register' }} Property</h3>
                             <p class="text-sm text-gray-500 font-medium">Define house details and meter numbers</p>
                          </div>
                       </div>
                       <button (click)="closeRentalHouseForm()" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all text-gray-500">
                          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                    </div>
                 </div>

                 <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <form [formGroup]="rentalHouseForm" (ngSubmit)="saveRentalHouse()" class="space-y-6">
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">House Name / ID <span class="text-red-500">*</span></label>
                             <input type="text" formControlName="houseName" placeholder="e.g., G-101, Penthouse" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold" [class.ring-2]="rentalHouseForm.get('houseName')?.invalid && rentalHouseForm.get('houseName')?.touched" [class.ring-red-500]="rentalHouseForm.get('houseName')?.invalid && rentalHouseForm.get('houseName')?.touched">
                             @if (rentalHouseForm.get('houseName')?.invalid && rentalHouseForm.get('houseName')?.touched) {
                                <p class="text-xs text-red-500 font-semibold mt-1 px-1">House Name / ID is required</p>
                             }
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Monthly Rent <span class="text-red-500">*</span></label>
                             <input type="number" formControlName="monthlyRent" placeholder="0.00" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold" [class.ring-2]="rentalHouseForm.get('monthlyRent')?.invalid && rentalHouseForm.get('monthlyRent')?.touched" [class.ring-red-500]="rentalHouseForm.get('monthlyRent')?.invalid && rentalHouseForm.get('monthlyRent')?.touched">
                             @if (rentalHouseForm.get('monthlyRent')?.invalid && rentalHouseForm.get('monthlyRent')?.touched) {
                                <p class="text-xs text-red-500 font-semibold mt-1 px-1">Monthly Rent is required</p>
                             }
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Advance Amount <span class="text-red-500">*</span></label>
                             <input type="number" formControlName="advanceAmount" placeholder="0.00" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold" [class.ring-2]="rentalHouseForm.get('advanceAmount')?.invalid && rentalHouseForm.get('advanceAmount')?.touched" [class.ring-red-500]="rentalHouseForm.get('advanceAmount')?.invalid && rentalHouseForm.get('advanceAmount')?.touched">
                             @if (rentalHouseForm.get('advanceAmount')?.invalid && rentalHouseForm.get('advanceAmount')?.touched) {
                                <p class="text-xs text-red-500 font-semibold mt-1 px-1">Advance Amount is required</p>
                             }
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Advance (In Months) <span class="text-red-500">*</span></label>
                             <input type="number" formControlName="advanceMonths" placeholder="e.g., 3" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold" [class.ring-2]="rentalHouseForm.get('advanceMonths')?.invalid && rentalHouseForm.get('advanceMonths')?.touched" [class.ring-red-500]="rentalHouseForm.get('advanceMonths')?.invalid && rentalHouseForm.get('advanceMonths')?.touched">
                             @if (rentalHouseForm.get('advanceMonths')?.invalid && rentalHouseForm.get('advanceMonths')?.touched) {
                                <p class="text-xs text-red-500 font-semibold mt-1 px-1">Advance Months is required</p>
                             }
                          </div>
                          <div class="space-y-2">
                              <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Renter Name <span class="text-red-500">*</span></label>
                              <!-- Customer Picker Input -->
                              <div class="relative">
                                <input type="text"
                                       [value]="renterSearchQuery"
                                       (input)="onRenterSearchChange($any($event.target).value)"
                                       (focus)="showRenterDropdown = true"
                                       (blur)="onRenterSearchBlur()"
                                       placeholder="Type name or phone to search customers..."
                                       autocomplete="off"
                                       class="w-full pl-6 pr-10 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold"
                                       [class.ring-2]="rentalHouseForm.get('renterName')?.invalid && rentalHouseForm.get('renterName')?.touched"
                                       [class.ring-red-500]="rentalHouseForm.get('renterName')?.invalid && rentalHouseForm.get('renterName')?.touched">
                                <!-- Clear / Lock indicator -->
                                @if (renterSelectedFromList && renterSearchQuery) {
                                  <button type="button" (click)="onRenterSearchChange('')"
                                          class="absolute inset-y-0 right-3 flex items-center text-indigo-500 hover:text-red-500 transition-colors">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                  </button>
                                } @else {
                                  <span class="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                  </span>
                                }
                                <!-- Customer dropdown -->
                                @if (showRenterDropdown && filteredRenterCustomers.length > 0) {
                                  <div class="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl max-h-52 overflow-y-auto">
                                    @for (cust of filteredRenterCustomers; track cust.id) {
                                      <button type="button" (click)="selectRenterFromCustomer(cust)"
                                              class="w-full px-5 py-3 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group border-b border-gray-50 dark:border-gray-700/50 last:border-b-0">
                                        <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                                          {{ (cust.name || '?').charAt(0).toUpperCase() }}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                          <p class="text-sm font-black text-gray-900 dark:text-white truncate">{{ cust.name }}</p>
                                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ cust.phone }}</p>
                                        </div>
                                        <svg class="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
                                        </svg>
                                      </button>
                                    }
                                  </div>
                                }
                              </div>
                              @if (rentalHouseForm.get('renterName')?.invalid && rentalHouseForm.get('renterName')?.touched) {
                                 <p class="text-xs text-red-500 font-semibold mt-1 px-1">Tenant Name is required</p>
                              }
                              <!-- hidden form control keeps validation working -->
                              <input type="hidden" formControlName="renterName">
                           </div>
                           <div class="space-y-2">
                              <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                Renter Phone <span class="text-red-500">*</span>
                                @if (renterSelectedFromList) {
                                  <span class="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Auto-filled</span>
                                }
                              </label>
                              <input type="tel" formControlName="renterPhone" placeholder="10 digit number"
                                     class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold"
                                     [readonly]="renterSelectedFromList"
                                     [class.opacity-70]="renterSelectedFromList"
                                     [class.cursor-not-allowed]="renterSelectedFromList"
                                     [class.ring-2]="rentalHouseForm.get('renterPhone')?.invalid && rentalHouseForm.get('renterPhone')?.touched"
                                     [class.ring-red-500]="rentalHouseForm.get('renterPhone')?.invalid && rentalHouseForm.get('renterPhone')?.touched">
                              @if (rentalHouseForm.get('renterPhone')?.touched) {
                                 @if (rentalHouseForm.get('renterPhone')?.hasError('required')) {
                                    <p class="text-xs text-red-500 font-semibold mt-1 px-1">Phone number is required</p>
                                 } @else if (rentalHouseForm.get('renterPhone')?.invalid) {
                                    <p class="text-xs text-red-500 font-semibold mt-1 px-1">Must be a valid 10-digit number</p>
                                 }
                              }
                           </div>
                           <div class="space-y-2">
                              <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                Tenant Aadhar Number
                                <span class="ml-1 text-[9px] normal-case font-medium text-gray-300 dark:text-gray-600 tracking-normal">(optional)</span>
                                @if (renterSelectedFromList) {
                                  <span class="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Auto-filled</span>
                                }
                              </label>
                              <input type="text" formControlName="renterAadhar" placeholder="12-digit Aadhar number" maxlength="12" inputmode="numeric"
                                     class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold tracking-[0.25em]"
                                     [readonly]="renterSelectedFromList"
                                     [class.opacity-70]="renterSelectedFromList"
                                     [class.cursor-not-allowed]="renterSelectedFromList"
                                     [class.ring-2]="rentalHouseForm.get('renterAadhar')?.invalid && rentalHouseForm.get('renterAadhar')?.touched"
                                     [class.ring-red-500]="rentalHouseForm.get('renterAadhar')?.invalid && rentalHouseForm.get('renterAadhar')?.touched">
                              @if (rentalHouseForm.get('renterAadhar')?.invalid && rentalHouseForm.get('renterAadhar')?.touched) {
                                 <p class="text-xs text-red-500 font-semibold mt-1 px-1">Aadhar must be exactly 12 digits</p>
                              }
                           </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Arrived Date <span class="text-red-500">*</span></label>
                             <input type="date" formControlName="arrivedDate" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold" [class.ring-2]="rentalHouseForm.get('arrivedDate')?.invalid && rentalHouseForm.get('arrivedDate')?.touched" [class.ring-red-500]="rentalHouseForm.get('arrivedDate')?.invalid && rentalHouseForm.get('arrivedDate')?.touched">
                             @if (rentalHouseForm.get('arrivedDate')?.invalid && rentalHouseForm.get('arrivedDate')?.touched) {
                                <p class="text-xs text-red-500 font-semibold mt-1 px-1">Arrival Date is required</p>
                             }
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Status</label>
                             <select formControlName="status" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold appearance-none">
                                <option value="Occupied">Occupied</option>
                                <option value="Vacant">Vacant</option>
                             </select>
                          </div>
                          <div class="space-y-2 md:col-span-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Full Address</label>
                             <textarea formControlName="fullAddress" rows="3" placeholder="Enter complete property address" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold resize-none"></textarea>
                          </div>
                       </div>

                       <div class="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Electricity Meter No (Optional)</label>
                             <input type="text" formControlName="electricMeterNo" placeholder="Enter meter number" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                          <div class="space-y-2">
                             <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Water Bill No (Optional)</label>
                             <input type="text" formControlName="waterBillNo" placeholder="Enter bill/CAN number" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                          </div>
                       </div>

                       <div class="pt-8 flex gap-4">
                          <button type="button" (click)="closeRentalHouseForm()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                          <button type="submit" [disabled]="isSaving" class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20">
                             {{ isSaving ? 'Saving...' : (isRentalEditMode ? 'Update Details' : 'Register Property') }}
                          </button>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
         }

         <!-- 9. Monthly Bill Entry Overlay -->
         @if (showMonthlyBillForm && activeHouseId) {
            <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
               <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl my-auto">
                  <div class="p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                     <div class="flex justify-between items-center">
                        <div>
                           <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Rent Collected</h3>
                           <p class="text-sm text-gray-500 font-medium">Record monthly rent and utility collections</p>
                        </div>
                        <button (click)="closeMonthlyBillForm()" class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                           <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                  </div>

                  <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
                     <form [formGroup]="monthlyBillForm" (ngSubmit)="saveMonthlyBill()" class="space-y-5">
                        <div class="space-y-2">
                           <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Collection Date</label>
                           <input type="date" formControlName="billDate" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                           <div class="space-y-2">
                              <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Rent Amount</label>
                              <input type="number" formControlName="rentAmount" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                           </div>
                           <div class="space-y-2">
                              <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Water Bill</label>
                              <input type="number" formControlName="waterBill" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                           </div>
                        </div>
                        <div class="space-y-2">
                           <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Electricity Bill</label>
                           <input type="number" formControlName="electricBill" readonly class="w-full px-6 py-4 rounded-2xl bg-gray-100/70 dark:bg-gray-800/50 border-none outline-none focus:ring-0 cursor-not-allowed opacity-85 text-gray-900 dark:text-white font-bold">
                        </div>

                        <div class="space-y-2">
                            <label class="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Electricity bill payment</label>
                            <select formControlName="status" class="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold appearance-none">
                               <option value="Paid">Paid</option>
                               <option value="Pending">Unpaid</option>
                            </select>
                         </div>

                         <div class="pt-6 flex gap-4">
                           <button type="button" (click)="closeMonthlyBillForm()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                           <button type="submit" [disabled]="monthlyBillForm.invalid || isSaving" class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20">
                              {{ isSaving ? 'Saving...' : 'Record Collection' }}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         }

         <!-- 10. Account Selection Overlay -->
         @if (showAccountsModal && selectedCustomerForAccounts) {
            <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-8 overflow-hidden">
               <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] flex flex-col shadow-2xl max-h-[90vh] my-auto">
                  <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{{ selectedCustomerForAccounts.name }}</h3>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Pick an account to manage</p>
                     </div>
                     <button (click)="closeAccountsModal()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  <div class="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                     @for (acc of customerAccountsList; track acc.id) {
                        <div (click)="handleAccountSelection(acc)" class="p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-all flex justify-between items-center group">
                           <div>
                              <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{{ acc.type }}</p>
                              <p class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ acc.name }}</p>
                           </div>
                           <svg class="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                     }
                  </div>
               </div>
            </div>
         }

        <!-- 11. Mobile Filter Modal (Bills) -->
        @if (showBillsFilterModal) {
            <div class="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-8 overflow-hidden" (click)="closeBillsFilterModal()">
               <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col" (click)="$event.stopPropagation()">
                  <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                     <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Filter Bills</h3>
                     <button (click)="closeBillsFilterModal()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  <div class="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                     <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Service Category</label>
                        <div class="grid grid-cols-2 gap-3">
                           @for (type of ['all', 'electricity', 'water', 'internet', 'mobile', 'other']; track type) {
                              <button (click)="serviceTypeFilter = type; closeBillsFilterModal()"
                                      [class]="serviceTypeFilter === type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'"
                                      class="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left">
                                 {{ type }}
                              </button>
                           }
                        </div>
                     </div>
                     <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Payment Status</label>
                        <div class="flex gap-2">
                           @for (status of ['all', 'paid', 'unpaid']; track status) {
                              <button (click)="billStatusFilter = status; closeBillsFilterModal()"
                                      [class]="billStatusFilter === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'"
                                      class="flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                 {{ status }}
                              </button>
                           }
                        </div>
                     </div>
                     <button (click)="closeBillsFilterModal()" class="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Show Results</button>
                  </div>
               </div>
            </div>
        }

      <!-- Mobile Bottom Navigation -->
      <div class="fixed bottom-0 left-0 right-0 z-[100] sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-500 pb-safe">
         <div class="w-full overflow-hidden">
            <div class="bottom-nav-pill pointer-events-auto relative flex items-center px-2">
            
            @if (visibleMobileTabs.indexOf(activeMobileMenu) !== -1) {
               <div class="absolute inset-1 flex pointer-events-none z-0">
                  <div [style.flex-grow]="visibleMobileTabs.indexOf(activeMobileMenu)" class="transition-all duration-500 ease-in-out"></div>
                  <div class="flex-none flex items-center justify-center" style="width: calc(100% / {{ visibleMobileTabs.length }})">
                     <div class="h-full aspect-square bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/40 dark:shadow-purple-500/60 transition-all duration-500"></div>
                  </div>
                  <div [style.flex-grow]="visibleMobileTabs.length - 1 - visibleMobileTabs.indexOf(activeMobileMenu)" class="transition-all duration-500 ease-in-out"></div>
               </div>
            }

            <!-- Overview -->
            <div (click)="scrollToTop(); activeMobileMenu = 'overview'; activeTab = 'overview'" 
                 class="nav-item-box">
               <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'overview' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
               </svg>
            </div>

            <!-- Interest (Loans) -->
            @if (!isSuperAdmin && showInterestTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'interest'; activeTab = 'interest'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'interest' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
               </div>
            }

            <!-- Bills -->
            @if (!isSuperAdmin && showBillsTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'bills'; activeTab = 'bills'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'bills' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
            }

            <!-- Rentals -->
            @if (!isSuperAdmin && showRentalsTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'rentals'; activeTab = 'rentals'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'rentals' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
               </div>
            }
         </div>
      </div>
      <!-- End of RIGHT CONTENT AREA -->
      </div>
   </div>
</div>
  `
})
export class AdminDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private billService = inject(BillService);
  private rentalService = inject(RentalService);
  private toast = inject(ToastService);
  public biometricService = inject(BiometricService);
  private notificationService = inject(NotificationService);

  activeTab: 'chitti' | 'interest' | 'customers' | 'security' | 'bills' | 'overview' | 'rentals' | '' = '';
  showOverviewData = false;
  isDarkMode = false;
  activeMobileMenu: 'chitti' | 'interest' | 'customers' | 'security' | 'bills' | 'overview' | 'rentals' | '' = '';
  currentUserProfile: UserProfile | null = null;
  showMoreMenu = false;
  showProfileModal = false;
  customerModuleFilter = 'all';

  toggleMoreMenu(event: Event) {
    event.stopPropagation();
    this.showMoreMenu = !this.showMoreMenu;
  }

  selectMoreMenu(menu: 'customers' | 'manage-admins' | 'security' | 'profile' | 'chitti') {
    this.showMoreMenu = false;
    if (menu === 'manage-admins') {
      this.goToManageAdmins();
    } else if (menu === 'profile') {
      this.showProfileModal = true;
      document.body.classList.add('modal-open');
    } else {
      this.activeTab = menu;
      this.activeMobileMenu = menu;
    }
  }

  closeProfileModal() {
    this.showProfileModal = false;
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.more-menu-container')) {
      this.showMoreMenu = false;
    }
  }

  @HostListener('window:focus')
  onWindowFocus() {
    const isModalOpen = this.showProfileModal || this.showReceiptModal || this.showAdminForm || this.isAdminEditMode ||
      this.showServiceModal || this.showServiceDetailsModal || this.showLiveBillModal || this.showCustomerModal ||
      this.showBillForm || this.showRentalHouseForm || this.showMonthlyBillForm || this.showAccountsModal ||
      this.showBillsFilterModal;
    if (!isModalOpen) {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
  }

  get showInterestTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.interest !== false; }
  get showChittiTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.chitti !== false; }
  get showCustomersTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.customers !== false; }
  get showBillsTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.bills !== false; }
  get showRentalsTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.rentals === true; }

  chittis: ChittiScheme[] = [];
  interests: InterestScheme[] = [];
  allCustomers: Customer[] = [];
  bills: Bill[] = [];
  billStats = {
    pendingAmount: 0,
    dueTodayCount: 0,
    paidThisMonthAmount: 0,
    electricityTotal: 0,
    waterTotal: 0
  };

  // Stored Records
  storedRecords: StoredBillRecord[] = [];
  selectedStoredYear = new Date().getFullYear();
  activeBillTab: 'tracking' | 'stored' = 'tracking';
  isSyncing = false;
  isFetchingLiveBill = false;
  showLiveBillModal = false;
  showBillsFilterModal = false;
  selectedLiveBill: any = null;
  showBillForm = false;
  editingBill?: Bill;
  trackedServices: TrackedService[] = [];
  serviceTypeFilter: string = 'all';
  billStatusFilter: string = 'all';
  showServiceModal = false;
  editingTrackedService?: TrackedService;
  trackedServiceForm: FormGroup;
  // Comprehensive Details
  showServiceDetailsModal = false;
  selectedTrackedService: TrackedService | null = null;

  showReceiptModal = false;
  selectedReceiptHouse: RentalHouse | null = null;
  selectedReceiptBill: RentalBill | null = null;
  selectedServiceHistory: Bill[] = [];
  selectedStoredHistory: StoredBillRecord[] = [];
  activeDetailsTab: 'current' | 'history' = 'current';
  syncingServices: Record<string, boolean> = {};

  // Payment Modal
  showPaymentModal = false;
  payingBill?: Bill;
  customerSearchQuery: string = '';
  loanSearchQuery: string = '';
  loanStatusFilter: 'Active' | 'Inactive' | 'All' = 'Active';
  isBiometricEnabled = false;
  expandedLoans: { [id: string]: boolean } = {};
  showAdminForm = false;
  adminSearchQuery = '';
  admins: UserProfile[] = [];

  // Rentals State
  houses: RentalHouse[] = [];
  showRentalHouseForm = false;
  rentalHouseForm: FormGroup;
  isRentalEditMode = false;
  editingRentalId: string | null = null;
  activeHouseId: string | null = null;
  rentalView: 'houses' | 'ledger' = 'houses';
  rentalUtilityBills: Record<string, {
    electricity?: number;
    water?: number;
    electricityPaid?: boolean;
    waterPaid?: boolean;
    electricityPaidDate?: string;
    waterPaidDate?: string;
  }> = {};
  refetchingHouseIds: Record<string, boolean> = {};
  overviewFilter: 'All' | 'Loan Issue' | 'Interest' | 'Settlement' = 'All';
  readonly overviewFilters: ('All' | 'Loan Issue' | 'Interest' | 'Settlement')[] = ['All', 'Loan Issue', 'Interest', 'Settlement'];
  overviewSubTab: 'finance' | 'rentals' = 'finance';
  showMonthlyBillForm = false;
  monthlyBillForm: FormGroup;

  get filteredTrackedServices() {
    return this.trackedServices.filter(service => {
      const matchesType = this.serviceTypeFilter === 'all' || service.serviceType === this.serviceTypeFilter;
      const isPaid = this.isTrackedServicePaid(service);
      const matchesStatus = this.billStatusFilter === 'all'
        || (this.billStatusFilter === 'paid' && isPaid)
        || (this.billStatusFilter === 'unpaid' && !isPaid);

      return matchesType && matchesStatus;
    });
  }
  editingBillIndex: number | null = null;

  get overviewTransactions() {
    const year = this.selectedOverviewYear;
    const txs: any[] = [];

    this.interests.forEach(loan => {
      // Loan Issuance
      if (loan.startDate && (this.overviewFilter === 'All' || this.overviewFilter === 'Loan Issue')) {
        const sd = new Date(loan.startDate);
        if (sd.getFullYear() === year) {
          txs.push({
            type: 'Loan Issue',
            amount: loan.amount,
            date: loan.startDate,
            whom: loan.borrowerName || loan.name,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'L'
          });
        }
      }

      // Settlements
      if (this.overviewFilter === 'All' || this.overviewFilter === 'Settlement') {
        (loan.settlements || []).forEach(s => {
          const sd = new Date(s.date);
          if (sd.getFullYear() === year) {
            txs.push({
              type: 'Settlement',
              amount: s.amount,
              date: s.date,
              whom: loan.borrowerName || loan.name,
              color: 'text-green-600',
              bg: 'bg-green-50 dark:bg-green-900/20',
              icon: 'S'
            });
          }
        });
      }

      // Interest Collections
      if (this.overviewFilter === 'All' || this.overviewFilter === 'Interest') {
        (loan.interestCollections || []).forEach(c => {
          const cd = new Date(c.date);
          if (cd.getFullYear() === year) {
            txs.push({
              type: 'Interest',
              amount: c.amount,
              date: c.date,
              whom: loan.borrowerName || loan.name,
              color: 'text-purple-600',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              icon: 'I'
            });
          }
        });
      }
    });

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  sortLatestBills(bills: RentalBill[]) {
    return [...(bills || [])].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
  }

  findOriginalBillIndex(bill: RentalBill, house: RentalHouse) {
    return (house.bills || []).indexOf(bill);
  }

  getHouseStats(house: RentalHouse) {
    const bills = house.bills || [];
    const collected = bills.filter(b => b.rentAmount > 0).reduce((sum, b) => sum + (b.rentAmount || 0), 0);
    let pending = bills.filter(b => b.status && b.status.toLowerCase() === 'pending').reduce((sum, b) => sum + (b.electricBill || 0) + (b.waterBill || 0), 0);
    const months = bills.length;

    // Automatic Pending Rent Logic
    if (house.status === 'Occupied' && house.arrivedDate) {
      const now = new Date();
      const arrived = new Date(house.arrivedDate);

      // Starting from the arrival date, check every month until today
      let tempDate = new Date(arrived.getFullYear(), arrived.getMonth(), arrived.getDate());

      while (tempDate <= now) {
        const monthNameLong = tempDate.toLocaleString('default', { month: 'long' }).toLowerCase();
        const monthNameShort = tempDate.toLocaleString('default', { month: 'short' }).toLowerCase();
        const year = tempDate.getFullYear();

        const monthlyBill = bills.find(b => {
          if (b.billDate) {
            const d = new Date(b.billDate);
            if (!isNaN(d.getTime())) {
              return d.getMonth() === tempDate.getMonth() && d.getFullYear() === tempDate.getFullYear();
            }
          }
          const bMonth = (b.month || '').toLowerCase();
          return (bMonth === monthNameLong || bMonth === monthNameShort) && b.year === year;
        });
        if (!monthlyBill) {
          pending += (house.monthlyRent || 0);
        } else if (!(monthlyBill.rentAmount > 0)) {
          pending += (house.monthlyRent || 0);
        }

        // Move to next month safely
        tempDate.setMonth(tempDate.getMonth() + 1);
      }
    }

    return { collected, pending, months };
  }

  normalizeServiceNumber(num: any): string {
    if (num === null || num === undefined) return '';
    const str = String(num).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return str.replace(/^0+/, '');
  }

  getHouseUtilityBill(house: RentalHouse, type: 'electricity' | 'water'): number {
    // 1. Check local monthly bills first for the latest recorded value
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
      if (amt > 0) {
        return amt;
      }
    }

    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return 0;
    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);

    // 2. Check tracked services next (live portal values)
    const service = (this.trackedServices || []).find(s =>
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service && service.lastAmount !== undefined && service.lastAmount !== null && service.lastAmount > 0) {
      return service.lastAmount;
    }

    // 3. Check cached sync details
    const cachedAmount = house.id ? this.rentalUtilityBills[house.id]?.[type] : undefined;
    if (cachedAmount !== undefined && cachedAmount > 0) return cachedAmount;

    // 4. Check global bills next
    if (cleanServiceNo) {
      const matchingBills = (this.bills || []).filter(b =>
        b.serviceNumber &&
        this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
        b.serviceType?.toLowerCase() === type.toLowerCase() &&
        !b.isDeleted
      );
      if (matchingBills.length > 0) {
        const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
        return sortedBills[0].amount || 0;
      }
    }

    return 0;
  }

  isHouseUtilityPaid(house: RentalHouse, type: 'electricity' | 'water'): boolean {
    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return false;

    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);
    if (!cleanServiceNo) return false;

    // 1. Check global bills first
    const matchingBills = (this.bills || []).filter(b =>
      b.serviceNumber &&
      this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
      b.serviceType?.toLowerCase() === type.toLowerCase() &&
      !b.isDeleted
    );
    if (matchingBills.length > 0) {
      const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
      const latestGlobalBill = sortedBills[0];
      const statusStr = (latestGlobalBill.status || '').toLowerCase();
      if (statusStr === 'completed' || statusStr === 'paid') {
        return true;
      }
    }

    // 2. Check local monthly bills next
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const statusStr = (latestBill.status || '').toLowerCase();
      if (statusStr === 'paid') {
        return true;
      }
      if (statusStr === 'pending') {
        const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
        if (amt === 0) {
          return true;
        }
      }
    }

    // 3. Check cached sync details
    if (house.id) {
      const cached = this.rentalUtilityBills[house.id];
      if (cached) {
        const isPaid = type === 'electricity' ? cached.electricityPaid === true : cached.waterPaid === true;
        if (isPaid) return true;
      }
    }

    // 4. Check tracked service status
    const service = this.trackedServices.find(s =>
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service && this.isTrackedServicePaid(service)) {
      return true;
    }

    return false;
  }

  getHouseUtilityPaidDate(house: RentalHouse, type: 'electricity' | 'water'): string {
    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return '';

    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);
    if (!cleanServiceNo) return '';

    // 1. Check global bills first
    const matchingBills = (this.bills || []).filter(b =>
      b.serviceNumber &&
      this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
      b.serviceType?.toLowerCase() === type.toLowerCase() &&
      !b.isDeleted
    );
    if (matchingBills.length > 0) {
      const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
      const latestGlobalBill = sortedBills[0];
      const statusStr = (latestGlobalBill.status || '').toLowerCase();
      if (statusStr === 'completed' || statusStr === 'paid') {
        return latestGlobalBill.paidDate || latestGlobalBill.dueDate || '';
      }
    }

    // 2. Check local monthly bills next
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const statusStr = (latestBill.status || '').toLowerCase();
      if (statusStr === 'paid') {
        return latestBill.paidDate || latestBill.billDate;
      }
      if (statusStr === 'pending') {
        const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
        if (amt === 0) {
          return latestBill.billDate;
        }
      }
    }

    // 3. Check cached sync details
    if (house.id) {
      const cached = this.rentalUtilityBills[house.id];
      if (cached) {
        const date = type === 'electricity' ? cached.electricityPaidDate : cached.waterPaidDate;
        if (date) return date;
      }
    }

    // 4. Check tracked services
    const service = this.trackedServices.find(s =>
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service && this.isTrackedServicePaid(service)) {
      return service.lastPaidDate || '';
    }

    return '';
  }

  isRentIncreaseDue(house: RentalHouse): boolean {
    if (!house.arrivedDate || house.status !== 'Occupied') return false;

    // Check if 1 year has passed since arrivedDate OR lastRentIncreaseDate
    const referenceDateStr = house.lastRentIncreaseDate || house.arrivedDate;
    const refDate = new Date(referenceDateStr);
    const today = new Date();

    // Simple year check
    let yearsPassed = today.getFullYear() - refDate.getFullYear();
    const monthDiff = today.getMonth() - refDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < refDate.getDate())) {
      yearsPassed--;
    }

    return yearsPassed >= 1;
  }

  getCompletedMonthsOccupied(house: RentalHouse): number {
    if (!house.arrivedDate || house.status !== 'Occupied') return 0;
    const arrived = new Date(house.arrivedDate);
    const today = new Date();

    let months = (today.getFullYear() - arrived.getFullYear()) * 12 + (today.getMonth() - arrived.getMonth());

    if (today.getDate() < arrived.getDate()) {
      months--;
    }
    return Math.max(0, months);
  }

  async refreshUtilityBills(house: RentalHouse) {
    if (!house.id) return;
    this.refetchingHouseIds[house.id] = true;
    try {
      await this.syncRentalUtilityBills(house);
      this.toast.success(`Utility bills updated for ${house.houseName}`);
    } catch (e) {
      this.toast.error(`Failed to fetch bills for ${house.houseName}`);
    } finally {
      this.refetchingHouseIds[house.id] = false;
    }
  }

  toggleLoanExpansion(id: string) {
    if (window.innerWidth < 640) {
      this.expandedLoans[id] = !this.expandedLoans[id];
    }
  }

  @ViewChild('overviewChart') overviewChart?: BaseChartDirective;
  @ViewChild('rentalOverviewChart') rentalOverviewChart?: BaseChartDirective;
  @ViewChild('loanChart') loanChart?: BaseChartDirective;
  @ViewChild('chittiChart') chittiChart?: BaseChartDirective;
  @ViewChild('rentalChart') rentalChart?: BaseChartDirective;

  resetChartZoom(type: 'overview' | 'loan' | 'chitti' | 'rental') {
    const chart = this.getChartByType(type);
    if (chart && chart.chart) {
      (chart.chart as any).resetZoom();
    }
  }

  zoomChart(type: 'overview' | 'loan' | 'chitti' | 'rental', amount: number) {
    const chart = this.getChartByType(type);
    if (chart && chart.chart) {
      (chart.chart as any).zoom(amount);
    }
  }

  panChart(type: 'overview' | 'loan' | 'chitti' | 'rental', amount: number) {
    const chart = this.getChartByType(type);
    if (chart && chart.chart) {
      (chart.chart as any).pan({ x: amount });
    }
  }

  private getChartByType(type: string): BaseChartDirective | undefined {
    switch (type) {
      case 'overview': return this.overviewChart;
      case 'loan': return this.loanChart;
      case 'chitti': return this.chittiChart;
      case 'rental': return this.rentalChart;
      default: return undefined;
    }
  }

  // Analytics State
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = -1; // -1 for All
  availableYears: number[] = [new Date().getFullYear()];
  archiveAvailableYears: number[] = [new Date().getFullYear()];
  isBillListView: boolean = false;
  filteredTotalInterest: number = 0;

  rentalSelectedYear: number = new Date().getFullYear();
  rentalAvailableYears: number[] = [new Date().getFullYear()];
  filteredTotalRent: number = 0;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, weight: 'bold' },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { size: 9 },
          callback: (value) => `₹${Number(value).toLocaleString()}`
        }
      }
    },
    plugins: {
      legend: { display: false },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 10 },
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
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context) => ` ₹${(context.parsed.y || 0).toLocaleString()}`
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 0,
        left: 0,
        right: 0
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: Array(12).fill(0),
        label: 'Interest',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.8)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#a855f7');
          return gradient;
        },
        hoverBackgroundColor: '#4f46e5',
        borderRadius: 4,
        barThickness: window.innerWidth < 640 ? 8 : 12
      }
    ]
  };

  // Chitti Analytics State
  chittiSelectedYear: number = new Date().getFullYear();
  chittiSelectedMonth: number = -1; // -1 for All
  chittiAvailableYears: number[] = [new Date().getFullYear()];
  filteredTotalChitti: number = 0;

  public chittiBarChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: Array(12).fill(0),
        label: 'Collections',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(236, 72, 153, 0.8)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(1, '#8b5cf6');
          return gradient;
        },
        hoverBackgroundColor: '#db2777',
        borderRadius: 4,
        barThickness: window.innerWidth < 640 ? 8 : 12
      }
    ]
  };

  public rentalBarChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: Array(12).fill(0),
        label: 'Collected Rent',
        backgroundColor: '#6366f1',
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  editingCustomer: Customer | null = null;
  customerForm: FormGroup;
  isSaving = false;

  showCustomerModal = false;
  isEditModal = false;
  existingMode = false;
  pickerSearch = '';
  isSuperAdmin = false;

  // ─── Renter Customer Picker (Property Registration Form) ───────────────
  renterSearchQuery = '';
  showRenterDropdown = false;
  renterSelectedFromList = false;

  showAccountsModal = false;
  selectedCustomerForAccounts: Customer | null = null;
  customerAccountsList: any[] = [];

  // Login Provisioning Check states
  isCheckingUsername = false;
  usernameStatus: 'none' | 'available' | 'taken' = 'none';
  private usernameTimeout: any;

  onUsernameInput() {
    const username = this.customerForm.get('username')?.value;
    if (!username || this.isEditModal) {
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
      const clean = username.trim().toLowerCase().replace(/^@/, '');
      const exists = await this.authService.checkUserExists(clean);
      this.usernameStatus = exists ? 'taken' : 'available';
    } catch (e) {
      this.usernameStatus = 'none';
    } finally {
      this.isCheckingUsername = false;
    }
  }

  passwordForm: FormGroup;
  adminForm: FormGroup;
  private tspdclService = inject(TspdclService);
  private hmwssbService = inject(HmwssbService);
  private firestore = inject(Firestore);

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      username: ['', Validators.required],
      email: [''],
      schemeType: ['chitti'],
      schemeId: ['', Validators.required],
      joinedDate: [new Date().toISOString().split('T')[0], Validators.required],
      status: ['Active', Validators.required]
    });
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\.]+$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: [''],
      idType: [''],
      idValue: [''],
      address: [''],
      tab_interest: [true],
      tab_chitti: [true],
      tab_customers: [true],
      tab_bills: [true],
      tab_rentals: [false]
    });
    this.rentalHouseForm = this.fb.group({
      houseName: ['', Validators.required],
      advanceAmount: [0, Validators.required],
      advanceMonths: [0, Validators.required],
      monthlyRent: [0, Validators.required],
      renterName: ['', Validators.required],
      renterPhone: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.minLength(10), Validators.maxLength(10)]],
      renterAadhar: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      arrivedDate: [new Date().toISOString().split('T')[0], Validators.required],
      electricMeterNo: [''],
      waterBillNo: [''],
      fullAddress: [''],
      lastRentIncreaseDate: [''],
      status: ['Occupied']
    });
    this.monthlyBillForm = this.fb.group({
      billDate: [new Date().toISOString().split('T')[0], Validators.required],
      rentAmount: [0, Validators.required],
      electricBill: [0],
      waterBill: [0],
      status: ['Paid', Validators.required]
    });
    this.trackedServiceForm = this.fb.group({
      serviceType: ['electricity', Validators.required],
      title: ['', Validators.required],
      provider: [''],
      serviceNumber: ['', Validators.required]
    });
  }

  get totalGivenLoans() {
    return this.interests
      .filter(loan => this.selectedOverviewYear === -1 || (loan.startDate && new Date(loan.startDate).getFullYear() === this.selectedOverviewYear))
      .reduce((sum, loan) => sum + loan.amount, 0);
  }
  get totalSettlement() {
    return this.interests.reduce((sum, loan) => {
      const settled = (loan.settlements || [])
        .filter(s => this.selectedOverviewYear === -1 || new Date(s.date).getFullYear() === this.selectedOverviewYear)
        .reduce((s, st) => s + st.amount, 0);
      return sum + settled;
    }, 0);
  }
  get totalPendingPrincipal() {
    return this.totalGivenLoans - this.totalSettlement;
  }
  get totalCollectedInterest() {
    return this.interests.reduce((sum, loan) => {
      const col = (loan.interestCollections || []).reduce((s, c) => s + c.amount, 0);
      return sum + col;
    }, 0);
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

  getMonthsPaid(loan: InterestScheme): number {
    const principalPaid = (loan.settlements || []).reduce((s, st) => s + st.amount, 0);
    const balance = Math.max(0, loan.amount - principalPaid);
    if (balance <= 0) return 999;

    const monthlyInterest = balance * (loan.interestRate / 100);
    if (monthlyInterest <= 0) return 999;

    const totalInterestPaid = (loan.interestCollections || []).reduce((s, c) => s + c.amount, 0);
    return totalInterestPaid / monthlyInterest;
  }

  isDueSoon(loan: InterestScheme): boolean {
    if (!loan.startDate) return false;
    const nextDue = this.getNextInterestDate(loan);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nextDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 10;
  }

  getCurrentBalance(loan: InterestScheme): number {
    const settled = (loan.settlements || []).reduce((sum, s) => sum + s.amount, 0);
    return Math.max(0, loan.amount - settled);
  }

  getMonthlyInterest(loan: InterestScheme): number {
    return this.getCurrentBalance(loan) * (loan.interestRate / 100);
  }

  getPendingInterestForLoan(loan: InterestScheme): number {
    if (!loan.startDate) return 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const accrued = this.getAccruedInterestThroughDate(loan, today);
    const paidInterest = (loan.interestCollections || []).reduce((s, c) => s + c.amount, 0);
    return Math.max(0, accrued - paidInterest);
  }

  get totalPendingInterest() {
    return this.interests.reduce((sum, loan) => sum + this.getPendingInterestForLoan(loan), 0);
  }

  getNextInterestDate(loan: InterestScheme): Date {
    if (!loan.startDate) return new Date(2100, 0, 1); // Far future if no date
    const start = new Date(loan.startDate);
    const day = start.getDate();
    const now = new Date();

    // Attempt to set current month with start day
    let next = new Date(now.getFullYear(), now.getMonth(), day);

    // If that date has already passed in the current month, the "upcoming" one is next month
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  getLastInterestDate(loan: InterestScheme): string | null {
    if (!loan.interestCollections || loan.interestCollections.length === 0) return null;
    const sorted = [...loan.interestCollections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].date;
  }

  getLoanCompletionDate(loan: InterestScheme): string | null {
    if (!loan.settlements || loan.settlements.length === 0) return null;
    const sorted = [...loan.settlements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].date;
  }

  getFilteredLoans(): InterestScheme[] {
    const filtered = this.interests.filter(loan => {
      // Basic status match
      let matchesStatus = this.loanStatusFilter === 'All' || loan.status === this.loanStatusFilter || (!loan.status && this.loanStatusFilter === 'Active');

      if (this.loanStatusFilter === 'Active' && matchesStatus) {
        // Keep all active loans visible; they will be sorted by upcoming due date below.
      }

      const search = this.loanSearchQuery.toLowerCase().trim();
      const matchesSearch = !search ||
        loan.name.toLowerCase().includes(search) ||
        (loan.borrowerName && loan.borrowerName.toLowerCase().includes(search)) ||
        (loan.borrowerPhone && loan.borrowerPhone.includes(search));
      return matchesStatus && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const dateA = this.getNextInterestDate(a);
      const dateB = this.getNextInterestDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }


  get visibleMobileTabs() {
    if (this.isSuperAdmin) {
      return ['overview'];
    }
    const all = ['overview', 'interest', 'bills', 'rentals'];
    return all.filter(t => {
      if (t === 'overview') return true;
      if (t === 'interest') return this.showInterestTab;
      if (t === 'bills') return this.showBillsTab;
      if (t === 'rentals') return this.showRentalsTab;
      return false;
    });
  }

  getIndicatorLeft(): number {
    const tabs = this.visibleMobileTabs;
    const idx = tabs.indexOf(this.activeMobileMenu as any);
    if (idx === -1) return 0;
    const count = tabs.length;
    return (idx * (100 / count)) + (100 / (count * 2));
  }

  async toggleLoanStatus(loan: InterestScheme) {
    if (!loan.id) return;
    const newStatus = loan.status === 'Inactive' ? 'Active' : 'Inactive';
    try {
      await this.interestService.updateInterest(loan.id, { status: newStatus });
      this.toast.success(`Loan marked as ${newStatus}`);
    } catch (e) {
      this.toast.error('Failed to update loan status');
    }
  }

  public overviewChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
    },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 10 },
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
  public overviewChartType: ChartType = 'line';
  public overviewChartData: ChartData<'line'> = { labels: [], datasets: [] };

  public rentalOverviewChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
    },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } }
    }
  };
  public rentalOverviewChartType: ChartType = 'bar';
  public rentalOverviewChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  rentalStats = {
    totalHouses: 0,
    occupiedHouses: 0,
    occupancyRate: 0,
    totalCollectedRent: 0,
    totalPendingRent: 0,
    recentPayments: [] as { houseName: string, renterName: string, amount: number, date: string }[]
  };

  onOverviewYearChange(year: number) {
    this.selectedOverviewYear = year;
    this.generateOverviewChart(year);
    this.generateRentalOverviewChart();
  }

  getHouseRentalData(house: RentalHouse) {
    const year = this.selectedOverviewYear;
    let paidRent = 0;
    let pendingRent = 0;

    // Current active bills
    (house.bills || []).forEach(bill => {
      const billDateStr = bill.paidDate || bill.billDate;
      const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
      if (year === -1 || billYear === year) {
        if (bill.status === 'Paid') {
          paidRent += (bill.rentAmount || 0);
        } else {
          pendingRent += (bill.rentAmount || 0);
        }
      }
    });

    // Past tenancies bills
    (house.pastTenancies || []).forEach(tenancy => {
      (tenancy.bills || []).forEach(bill => {
        const billDateStr = bill.paidDate || bill.billDate;
        const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
        if (year === -1 || billYear === year) {
          if (bill.status === 'Paid') {
            paidRent += (bill.rentAmount || 0);
          } else {
            pendingRent += (bill.rentAmount || 0);
          }
        }
      });
    });

    return { paidRent, pendingRent };
  }

  availableOverviewYears: number[] = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  selectedOverviewYear: number = new Date().getFullYear();

  generateOverviewChart(year: number = this.selectedOverviewYear) {
    this.selectedOverviewYear = year;
    let labels: string[];
    let givenLoans: number[];
    let settlements: number[];
    let interestCollected: number[];

    if (year === -1) {
      // Aggregate by Year
      const yearMap: { [y: number]: { given: number, settled: number, interest: number } } = {};
      const yearsSet = new Set<number>();

      this.interests.forEach(loan => {
        if (loan.startDate) {
          const y = new Date(loan.startDate).getFullYear();
          yearsSet.add(y);
          if (!yearMap[y]) yearMap[y] = { given: 0, settled: 0, interest: 0 };
          yearMap[y].given += loan.amount;
        }
        (loan.settlements || []).forEach(s => {
          const y = new Date(s.date).getFullYear();
          yearsSet.add(y);
          if (!yearMap[y]) yearMap[y] = { given: 0, settled: 0, interest: 0 };
          yearMap[y].settled += s.amount;
        });
        (loan.interestCollections || []).forEach(c => {
          const y = new Date(c.date).getFullYear();
          yearsSet.add(y);
          if (!yearMap[y]) yearMap[y] = { given: 0, settled: 0, interest: 0 };
          yearMap[y].interest += c.amount;
        });
      });

      labels = Array.from(yearsSet).sort((a, b) => a - b).map(y => y.toString());
      if (labels.length === 0) labels = [new Date().getFullYear().toString()];

      givenLoans = labels.map(y => yearMap[Number(y)]?.given || 0);
      settlements = labels.map(y => yearMap[Number(y)]?.settled || 0);
      interestCollected = labels.map(y => yearMap[Number(y)]?.interest || 0);
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      givenLoans = new Array(12).fill(0);
      settlements = new Array(12).fill(0);
      interestCollected = new Array(12).fill(0);

      this.interests.forEach(loan => {
        if (loan.startDate) {
          const sd = new Date(loan.startDate);
          if (sd.getFullYear() === year) givenLoans[sd.getMonth()] += loan.amount;
        }
        (loan.settlements || []).forEach(s => {
          const sd = new Date(s.date);
          if (sd.getFullYear() === year) settlements[sd.getMonth()] += s.amount;
        });
        (loan.interestCollections || []).forEach(c => {
          const cd = new Date(c.date);
          if (cd.getFullYear() === year) interestCollected[cd.getMonth()] += c.amount;
        });
      });
    }

    this.overviewChartData = {
      labels,
      datasets: [
        { data: givenLoans, label: 'Given Loans', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
        { data: settlements, label: 'Settlements', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
        { data: interestCollected, label: 'Interest Collected', borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4 }
      ]
    };
  }

  generateRentalOverviewChart() {
    let totalHouses = this.houses.length;
    let occupiedHouses = this.houses.filter(h => h.status === 'Occupied').length;
    let occupancyRate = totalHouses > 0 ? Math.round((occupiedHouses / totalHouses) * 1000) / 10 : 0;

    let totalCollectedRent = 0;
    let totalPendingRent = 0;
    const allRentPayments: { houseName: string, renterName: string, amount: number, date: string }[] = [];
    const year = this.selectedOverviewYear;

    this.houses.forEach(house => {
      (house.bills || []).forEach(bill => {
        const billDateStr = bill.paidDate || bill.billDate;
        const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
        if (year === -1 || billYear === year) {
          if (bill.status === 'Paid') {
            totalCollectedRent += (bill.rentAmount || 0);
            allRentPayments.push({
              houseName: house.houseName,
              renterName: house.renterName,
              amount: bill.rentAmount,
              date: bill.paidDate || bill.billDate
            });
          } else {
            totalPendingRent += (bill.rentAmount || 0);
          }
        }
      });

      (house.pastTenancies || []).forEach(tenancy => {
        (tenancy.bills || []).forEach(bill => {
          const billDateStr = bill.paidDate || bill.billDate;
          const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
          if (year === -1 || billYear === year) {
            if (bill.status === 'Paid') {
              totalCollectedRent += (bill.rentAmount || 0);
              allRentPayments.push({
                houseName: house.houseName,
                renterName: tenancy.renterName,
                amount: bill.rentAmount,
                date: bill.paidDate || bill.billDate
              });
            } else {
              totalPendingRent += (bill.rentAmount || 0);
            }
          }
        });
      });
    });

    // Sort recent payments by date descending
    allRentPayments.sort((a, b) => b.date.localeCompare(a.date));
    const recentPayments = allRentPayments.slice(0, 5);

    this.rentalStats = {
      totalHouses,
      occupiedHouses,
      occupancyRate,
      totalCollectedRent,
      totalPendingRent,
      recentPayments
    };

    const labels: string[] = [];
    const collectedData: number[] = [];
    const pendingData: number[] = [];

    this.houses.forEach(house => {
      let paidRent = 0;
      let pendingRent = 0;

      // Current active bills
      (house.bills || []).forEach(bill => {
        const billDateStr = bill.paidDate || bill.billDate;
        const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
        if (year === -1 || billYear === year) {
          if (bill.status === 'Paid') {
            paidRent += (bill.rentAmount || 0);
          } else {
            pendingRent += (bill.rentAmount || 0);
          }
        }
      });

      // Past tenancies bills
      (house.pastTenancies || []).forEach(tenancy => {
        (tenancy.bills || []).forEach(bill => {
          const billDateStr = bill.paidDate || bill.billDate;
          const billYear = billDateStr ? new Date(billDateStr).getFullYear() : null;
          if (year === -1 || billYear === year) {
            if (bill.status === 'Paid') {
              paidRent += (bill.rentAmount || 0);
            } else {
              pendingRent += (bill.rentAmount || 0);
            }
          }
        });
      });

      labels.push(house.houseName);
      collectedData.push(paidRent);
      pendingData.push(pendingRent);
    });

    this.rentalOverviewChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Collected Rent',
          data: collectedData,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 8
        },
        {
          label: 'Pending Rent',
          data: pendingData,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    };
    this.rentalOverviewChart?.update();
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  ngOnInit() {
    this.isBiometricEnabled = this.biometricService.isBiometricEnabled();
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.authService.isSuperAdmin().then(val => {
      this.isSuperAdmin = val;
      if (this.isSuperAdmin) {
        this.loadAdmins();
      }
    });
    this.loadData();
  }

  async loadAdmins() {

    const adminQuery = query(collection(this.firestore, 'users'), where('role', '==', 'admin'));
    collectionData(adminQuery).subscribe(data => {
      this.admins = data as UserProfile[];
    });
  }

  getFilteredAdmins(): UserProfile[] {
    if (!this.adminSearchQuery.trim()) return this.admins;
    const q = this.adminSearchQuery.toLowerCase();
    return this.admins.filter(a =>
      (a.displayName?.toLowerCase().includes(q)) ||
      (a.username?.toLowerCase().includes(q)) ||
      (a.phone?.includes(q))
    );
  }

  getAdminCustomerCount(uid: string): number {
    return this.allCustomers.filter(c => c.createdBy === uid).length;
  }

  isAdminEditMode = false;
  editingAdminUid: string | null = null;
  revealedPasswords: { [username: string]: string } = {};
  showAdminPassword = false;

  async togglePasswordReveal(username: string) {
    if (this.revealedPasswords[username]) {
      delete this.revealedPasswords[username];
    } else {
      const pwd = await this.authService.getAdminPassword(username);
      this.revealedPasswords[username] = pwd || '---';
    }
  }

  async createAdminMember() {
    if (this.adminForm.valid) {
      this.isSaving = true;
      try {
        const { username, name, phone, password, address, idType, idValue, tab_interest, tab_chitti, tab_customers, tab_bills, tab_rentals } = this.adminForm.getRawValue();
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
        const tabConfig = { interest: tab_interest, chitti: tab_chitti, customers: tab_customers, bills: tab_bills, rentals: tab_rentals };

        if (this.isAdminEditMode && this.editingAdminUid) {
          // Update basic info + address/ID + tabConfig
          await this.authService.updateAdminInfo(this.editingAdminUid, cleanUsername, name, phone, address, idType, idValue, tabConfig);

          // If password field is filled, update it
          if (password && password.trim()) {
            await this.authService.changePassword(cleanUsername, password, 'admin');
          }

          this.toast.success('Admin account updated correctly!');
          this.cancelAdminEdit();
        } else {
          const exists = await this.authService.checkUserExists(cleanUsername);
          if (exists) {
            this.toast.error('Username or Identity already exists.');
            return;
          }

          // Use provided password or fallback to admin123
          const finalPassword = (password && password.trim()) ? password : 'admin123';
          await this.authService.provisionUser('admin', cleanUsername, name, phone, finalPassword, address, idType, idValue, tabConfig);
          this.toast.success('New Admin established!');
          this.adminForm.reset();
        }
      } catch (e: any) {
        this.toast.error(e.message || 'Failed to process admin account.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  editAdminMember(admin: any) {
    this.isAdminEditMode = true;
    this.editingAdminUid = admin.uid;
    this.adminForm.patchValue({
      name: admin.displayName,
      username: admin.username,
      phone: admin.phone,
      address: admin.address || '',
      idType: admin.idType || '',
      idValue: admin.idValue || '',
      tab_interest: admin.tabConfig?.interest !== false,
      tab_chitti: admin.tabConfig?.chitti !== false,
      tab_customers: admin.tabConfig?.customers !== false,
      tab_bills: admin.tabConfig?.bills !== false,
      tab_rentals: admin.tabConfig?.rentals === true
    });
    this.adminForm.get('username')?.disable();
    this.scrollToTop();
  }

  expandedAdminDetails: { [uid: string]: boolean } = {};
  toggleAdminDetails(uid: string) {
    this.expandedAdminDetails[uid] = !this.expandedAdminDetails[uid];
  }

  cancelAdminEdit() {
    this.isAdminEditMode = false;
    this.showAdminForm = false;
    this.editingAdminUid = null;
    this.adminForm.reset();
    this.adminForm.get('username')?.enable();
  }

  async removeAdminMember(admin: UserProfile) {
    if (confirm(`Revoke all admin privileges for @${admin.username}?`)) {
      try {
        await deleteDoc(doc(this.firestore, `users/${admin.uid}`));
        await deleteDoc(doc(this.firestore, `admin_credentials/${admin.username}`));
        this.toast.success('Admin privileges revoked.');
      } catch (e) {
        this.toast.error('Failed to revoke privileges.');
      }
    }
  }

  async loadData() {
    this.authService.userProfile$.subscribe(profile => {
      if (!profile) return;
      this.currentUserProfile = profile;

      const filterUid = profile.role === 'super-admin' ? undefined : profile.uid;

      if (!this.activeTab && profile.role !== 'super-admin') {
        this.activeTab = 'overview';
        this.activeMobileMenu = 'overview';
      } else if (!this.activeTab) {
        this.activeTab = 'overview';
        this.activeMobileMenu = 'overview';
      }

      this.chittiService.getChittis(filterUid).subscribe(data => this.chittis = data);
      this.interestService.getInterests(filterUid).subscribe(data => {
        this.interests = data;
        this.generateOverviewChart();
        this.updateLoanAnalytics();
      });
      this.customerService.getAllCustomers(filterUid).subscribe(data => {
        this.allCustomers = data;
        this.updateChittiAnalytics();
      });
      if (filterUid) {
        this.billService.getBills(filterUid).subscribe(data => {
          this.bills = data;
          this.calculateBillStats();
        });
        this.billService.getTrackedServices(filterUid).subscribe(data => {
          this.trackedServices = data;
          this.calculateBillStats();
        });
      }
      this.rentalService.getHouses(filterUid).subscribe(data => {
        this.houses = data;
        this.updateRentalAnalytics();
        this.generateRentalOverviewChart();
      });
      this.rentalService.rentalUtilityBills.subscribe(bills => {
        this.rentalUtilityBills = bills;
      });

      this.loadStoredRecords();
    });
  }

  calculateBillStats() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    this.billStats = {
      pendingAmount: 0,
      dueTodayCount: 0,
      paidThisMonthAmount: 0,
      electricityTotal: 0,
      waterTotal: 0
    };

    // Use Tracked Services for Pending and Due Today as requested
    this.trackedServices.forEach(service => {
      const amount = Number(service.lastAmount) || 0;
      const isPaid = this.isTrackedServicePaid(service);

      if (amount && isPaid) {
        this.billStats.paidThisMonthAmount += amount;
      }

      if (amount && !isPaid) {
        this.billStats.pendingAmount += amount;

        if (service.serviceType === 'electricity') {
          this.billStats.electricityTotal += amount;
        } else if (service.serviceType === 'water') {
          this.billStats.waterTotal += amount;
        }
      }

      // Check if due today
      if (!isPaid && service.lastDueDate) {
        // Try to parse DD-MMM-YY or match string
        if (service.lastDueDate === todayStr || this.isToday(service.lastDueDate)) {
          this.billStats.dueTodayCount++;
        }
      }
    });
  }

  private isToday(dateStr: string): boolean {
    const now = new Date();
    const today = now.getDate();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear().toString().slice(-2);

    // Check for DD-MMM-YY format
    const expected = `${today.toString().padStart(2, '0')}-${month}-${year}`;
    return dateStr.toUpperCase() === expected;
  }

  openServiceDetails(service: TrackedService) {
    this.selectedTrackedService = service;
    this.selectedServiceHistory = [];
    this.selectedStoredHistory = [];
    this.activeDetailsTab = 'current';
    this.showServiceDetailsModal = true;
    document.body.classList.add('modal-open');

    // Fetch History
    this.billService.getServiceBillHistory(service.serviceNumber).subscribe(history => {
      // Deduplicate history items by month and year to prevent duplicate rendering
      const uniqueHistory = new Map<string, Bill>();
      history.forEach(bill => {
        const key = `${bill.month}-${bill.year}`;
        if (!uniqueHistory.has(key)) {
          uniqueHistory.set(key, bill);
        }
      });
      this.selectedServiceHistory = Array.from(uniqueHistory.values());
    });

    // Fetch Stored Records History
    this.billService.getStoredRecordsByService(service.serviceNumber).subscribe(recs => {
      this.selectedStoredHistory = recs;
    });
  }

  openBillForm(bill?: Bill) {
    this.editingBill = bill;
    this.showBillForm = true;
    document.body.classList.add('modal-open');
  }

  openPaymentModal(bill: Bill) {
    this.payingBill = bill;
    this.showPaymentModal = true;
    document.body.classList.add('modal-open');
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.payingBill = undefined;
    document.body.classList.remove('modal-open');
  }

  onBillPaid() {
    this.closePaymentModal();
    this.toast.success('Payment recorded successfully! ✓');
  }

  closeBillForm() {
    this.showBillForm = false;
    this.editingBill = undefined;
    document.body.classList.remove('modal-open');
  }

  async handleSaveBill(billData: Partial<Bill>) {
    const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
    if (!profile?.uid) return;

    try {
      if (this.editingBill?.id) {
        await this.billService.updateBill(this.editingBill.id, billData);
        this.toast.success('Bill updated successfully!');
      } else {
        await this.billService.addBill({ ...billData, adminUid: profile.uid });
        this.toast.success('Bill created successfully!');
      }
      this.closeBillForm();
    } catch (e) {
      this.toast.error('Failed to save bill.');
    }
  }

  async handleDeleteBill(bill: Bill) {
    try {
      await this.billService.deleteBill(bill.id!);
      this.toast.success('Bill moved to trash.');
    } catch (e) {
      this.toast.error('Failed to delete bill.');
    }
  }

  async handleUpdateBillStatus(event: { bill: Bill, status: string }) {
    try {
      await this.billService.updateBill(event.bill.id!, { status: event.status as any });
      this.toast.success(`Bill marked as ${event.status}`);
    } catch (e) {
      this.toast.error('Failed to update status.');
    }
  }

  handleSyncBills() {
    if (this.trackedServices.length === 0) {
      this.toast.error('No services registered for auto-sync.');
      return;
    }

    this.isSyncing = true;
    this.toast.info('Starting deep sync with service providers...');

    // 1. Existing background sync for completed bills
    this.authService.userProfile$.subscribe(profile => {
      if (!profile?.uid) return;
      this.billService.syncBillsFromServers(profile.uid).subscribe({
        next: (async (resPromise) => {
          await resPromise;
        })
      });
    });

    // 2. Fetch LIVE details for all thumbnails asynchronously
    const allServices = this.filteredTrackedServices;
    if (allServices.length === 0) {
      this.isSyncing = false;
      return;
    }

    allServices.forEach(service => {
      this.handleFetchLiveBill(service);
    });

    // Global loader stops when all triggered (individual loaders continue on cards)
    setTimeout(() => this.isSyncing = false, 1000);
  }

  loadStoredRecords() {
    this.authService.userProfile$.subscribe(profile => {
      if (!profile?.uid) return;
      this.billService.getStoredRecords(profile.uid, this.selectedStoredYear).subscribe(recs => {
        this.storedRecords = recs;

        // Populate archiveAvailableYears
        this.billService.getStoredRecords(profile.uid).subscribe(allRecs => {
          const years = new Set<number>();
          years.add(new Date().getFullYear());
          allRecs.forEach(r => {
            if (r.year) years.add(r.year);
          });
          this.archiveAvailableYears = Array.from(years).sort((a, b) => b - a);
        });
      });
    });
  }

  async storeBillAsRecord(service: TrackedService) {
    if (!service.lastAmount) {
      this.toast.error('No bill amount found to store.');
      return;
    }

    const profile = await firstValueFrom(this.authService.userProfile$);
    if (!profile?.uid) return;

    try {
      await this.billService.autoStoreBillRecord({
        consumerName: service.consumerName || service.title || 'Unnamed',
        serviceNumber: service.serviceNumber,
        amount: service.lastAmount,
        date: new Date().toISOString().split('T')[0],
        adminUid: profile.uid
      });
      this.toast.success('Bill details stored successfully!');
    } catch (e) {
      this.toast.error('Failed to store record.');
    }
  }

  async handleDeleteStoredRecord(id: string) {
    if (!confirm('Are you sure you want to permanently delete this record?')) return;
    try {
      await this.billService.deleteStoredRecord(id);
      this.toast.success('Record deleted.');
    } catch (e) {
      this.toast.error('Failed to delete record.');
    }
  }

  openServiceForm(service?: TrackedService) {
    this.editingTrackedService = service;
    if (service) {
      this.trackedServiceForm.patchValue(service);
    } else {
      this.trackedServiceForm.reset({ serviceType: 'electricity' });
    }

    // Safety delay to ensure layout state is ready
    setTimeout(() => {
      this.showServiceModal = true;
      document.body.classList.add('modal-open');
    }, 50);
  }

  closeServiceModal() {
    this.showServiceModal = false;
    this.editingTrackedService = undefined;
    this.trackedServiceForm.reset({ serviceType: 'electricity' });
    document.body.classList.remove('modal-open');
  }

  async handleRegisterService() {
    if (this.trackedServiceForm.invalid) return;
    this.isSaving = true;

    const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
    if (!profile?.uid) return;

    try {
      const data = { ...this.trackedServiceForm.value };
      if (!data.provider) data.provider = data.title; // Default provider to title if empty

      if (this.editingTrackedService?.id) {
        await this.billService.updateTrackedService(this.editingTrackedService.id, data);
        this.toast.success('Service updated successfully!');
      } else {
        await this.billService.registerService({ ...data, adminUid: profile.uid });
        this.toast.success('Service number linked successfully!');
      }
      this.closeServiceModal();
    } catch (e) {
      this.toast.error('Operation failed.');
    } finally {
      this.isSaving = false;
    }
  }

  async handleAddToTracker() {
    if (!this.selectedLiveBill) return;

    const profile = await firstValueFrom(this.authService.userProfile$);
    if (!profile?.uid) return;

    try {
      const now = new Date();
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

      // Parse the date if it's in DD-MMM-YY format
      let isoDueDate = now.toISOString().split('T')[0];
      if (this.selectedLiveBill.dueDate && this.selectedLiveBill.dueDate !== '--') {
        const parts = this.selectedLiveBill.dueDate.split('-');
        if (parts.length === 3) {
          const day = parts[0];
          const monthIndex = monthNames.indexOf(parts[1].toUpperCase());
          const year = "20" + parts[2];
          if (monthIndex !== -1) {
            isoDueDate = new Date(Number(year), monthIndex, Number(day)).toISOString().split('T')[0];
          }
        }
      }

      const liveUtilityAmount = this.getLiveUtilityAmount(this.selectedLiveBill);

      // 1. Create a bill record
      const billData: any = {
        serviceType: 'electricity',
        provider: this.selectedLiveBill.consumerName,
        serviceNumber: this.selectedLiveBill.uniqueServiceNumber,
        amount: liveUtilityAmount,
        dueDate: isoDueDate,
        status: this.selectedLiveBill.isPaid ? 'completed' : 'pending',
        paidDate: this.selectedLiveBill.isPaid ? this.parsePortalDate(this.selectedLiveBill.paidDate) || new Date().toISOString().split('T')[0] : undefined,
        paidAmount: this.selectedLiveBill.isPaid ? liveUtilityAmount : undefined,
        totalPaid: this.selectedLiveBill.isPaid ? liveUtilityAmount : undefined,
        month: monthNames[now.getMonth()],
        year: now.getFullYear(),
        adminUid: profile.uid,
        notes: `Synced from TGSPDCL portal (Arrears: ${this.selectedLiveBill.arrearsAmount}, Current: ${this.selectedLiveBill.currentMonthAmount})`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.billService.addBill(billData);

      // 2. Update the Tracked Service card with latest info
      const service = this.trackedServices.find(s => s.serviceNumber === this.selectedLiveBill.uniqueServiceNumber);
      if (service?.id) {
        await this.billService.updateTrackedService(service.id, {
          lastAmount: liveUtilityAmount,
          lastAmountLabel: this.selectedLiveBill.amountLabel || 'Payable Amount',
          lastDueDate: this.selectedLiveBill.dueDate,
          lastPaidDate: this.isLiveBillPaid(this.selectedLiveBill) ? this.getLiveBillDisplayDate(this.selectedLiveBill) : '',
          lastBillStatus: this.isLiveBillPaid(this.selectedLiveBill) ? 'paid' : 'pending',
          consumerName: this.selectedLiveBill.consumerName
        });
      }

      this.toast.success('Bill added to tracker and stats updated!');
      this.showLiveBillModal = false;
    } catch (e) {
      this.toast.error('Failed to add bill to tracker.');
      console.error(e);
    }
  }

  async handleRemoveService(id: string) {
    if (confirm('Stop tracking this service number?')) {
      try {
        await this.billService.removeTrackedService(id);
        this.toast.success('Service tracking removed.');
      } catch (e) {
        this.toast.error('Failed to remove service.');
      }
    }
  }

  updateLoanAnalytics() {
    const monthlyData = Array(12).fill(0);
    const yearsSet = new Set<number>([new Date().getFullYear()]);
    let total = 0;

    const sYear = Number(this.selectedYear);
    const sMonth = Number(this.selectedMonth);

    this.interests.forEach(interest => {
      (interest.interestCollections || []).forEach(c => {
        const cDate = new Date(c.date);
        if (isNaN(cDate.getTime())) return;

        const year = cDate.getFullYear();
        const month = cDate.getMonth();
        yearsSet.add(year);

        if (year === sYear) {
          monthlyData[month] += c.amount;
        }

        // Apply filters for total KPI
        if (year === sYear && (sMonth === -1 || month === sMonth)) {
          total += c.amount;
        }
      });
    });

    this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Explicitly update chart data to trigger change detection
    this.barChartData = {
      ...this.barChartData,
      datasets: [{
        ...this.barChartData.datasets[0],
        data: monthlyData
      }]
    };

    this.filteredTotalInterest = total;
    this.loanChart?.update();
  }

  updateChittiAnalytics() {
    const monthlyData = Array(12).fill(0);
    const yearsSet = new Set<number>([new Date().getFullYear()]);
    let total = 0;

    const sYear = Number(this.chittiSelectedYear);
    const sMonth = Number(this.chittiSelectedMonth);

    this.allCustomers.forEach(cust => {
      if (cust.schemeType === 'chitti') {
        (cust.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (isNaN(pDate.getTime())) return;

          const year = pDate.getFullYear();
          const month = pDate.getMonth();
          yearsSet.add(year);

          if (year === sYear) {
            monthlyData[month] += p.amount;
          }

          if (year === sYear && (sMonth === -1 || month === sMonth)) {
            total += p.amount;
          }
        });
      }
    });

    this.chittiAvailableYears = Array.from(yearsSet).sort((a, b) => b - a);

    this.chittiBarChartData = {
      ...this.chittiBarChartData,
      datasets: [{
        ...this.chittiBarChartData.datasets[0],
        data: monthlyData
      }]
    };

    this.filteredTotalChitti = total;
    this.chittiChart?.update();
  }

  updateRentalAnalytics() {
    const monthlyData = Array(12).fill(0);
    const yearsSet = new Set<number>([new Date().getFullYear()]);
    let total = 0;

    const sYear = Number(this.rentalSelectedYear);

    this.houses.forEach(house => {
      (house.bills || []).forEach(bill => {
        if (!(bill.rentAmount > 0)) return;

        const bDate = new Date(bill.billDate);
        if (isNaN(bDate.getTime())) return;

        const year = bDate.getFullYear();
        const month = bDate.getMonth();
        yearsSet.add(year);

        if (year === sYear) {
          monthlyData[month] += (bill.rentAmount || 0);
          total += (bill.rentAmount || 0);
        }
      });
    });

    this.rentalAvailableYears = Array.from(yearsSet).sort((a, b) => b - a);
    this.filteredTotalRent = total;

    this.rentalBarChartData = {
      ...this.rentalBarChartData,
      datasets: [{
        ...this.rentalBarChartData.datasets[0],
        data: monthlyData
      }]
    };
    this.rentalChart?.update();
  }

  get currentMonthName(): string {
    return new Date().toLocaleString('default', { month: 'long' });
  }

  get totalCollectedThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activeSchemeIds = new Set(this.chittis.map(c => c.id!));
    let total = 0;
    this.allCustomers
      .filter(cust => activeSchemeIds.has(cust.schemeId) && cust.schemeType === 'chitti')
      .forEach(cust => {
        (cust.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
            total += p.amount;
          }
        });
      });
    return total;
  }

  get totalPendingThisMonth(): number {
    return this.chittis.reduce((acc, chit) => acc + this.getChittiStats(chit.id!).pending, 0);
  }

  get totalInterestCollectedThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let total = 0;
    this.interests.forEach(interest => {
      (interest.interestCollections || []).forEach(c => {
        const cDate = new Date(c.date);
        if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear) {
          total += c.amount;
        }
      });
    });
    return total;
  }

  getChittiStats(schemeId: string): { collected: number, pending: number } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let collected = 0;
    let pending = 0;

    const scheme = this.chittis.find(s => s.id === schemeId);
    if (!scheme) return { collected: 0, pending: 0 };

    const customers = this.allCustomers.filter(c => c.schemeId === schemeId && c.schemeType === 'chitti');
    customers.forEach(cust => {
      (cust.payments || []).forEach(p => {
        const pDate = new Date(p.date);
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) collected += p.amount;
      });
      if (cust.joinedDate) {
        const joined = new Date(cust.joinedDate);
        let monthsCount = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1;
        const totalExpected = Math.min(monthsCount, scheme.tenure) * scheme.monthlyAmount;
        const totalPaid = (cust.payments || []).reduce((sum, p) => sum + p.amount, 0);
        pending += Math.max(0, totalExpected - totalPaid);
      }
    });
    return { collected, pending };
  }

  getCustomerCount(schemeId: string, type: 'chitti' | 'interest'): number {
    return this.allCustomers.filter(c => c.schemeId === schemeId && c.schemeType === type).length;
  }

  getInterestBalance(interest: InterestScheme): number {
    const settled = (interest.settlements || []).reduce((sum, s) => sum + s.amount, 0);
    return Math.max(0, interest.amount - settled);
  }

  getFilteredCustomers(): Customer[] {
    return this.allCustomers.filter(c => {
      // 1. Module filter
      if (this.customerModuleFilter && this.customerModuleFilter !== 'all') {
        const type = c.schemeType || 'interest';
        if (type.toLowerCase() !== this.customerModuleFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Search query filter
      if (this.customerSearchQuery && this.customerSearchQuery.trim()) {
        const q = this.customerSearchQuery.toLowerCase().trim();
        return (c.name?.toLowerCase().includes(q)) ||
          (c.phone?.includes(q)) ||
          (c.username?.toLowerCase().includes(q));
      }

      return true;
    });
  }

  viewCustomerAccounts(cust: Customer) {
    if (!cust.phone) {
      this.toast.error('Customer has no registered phone number.');
      return;
    }
    const accounts: any[] = [];

    // Gather Chittis
    const chittiEnrolments = this.allCustomers.filter(c => c.phone === cust.phone && c.schemeType === 'chitti');
    chittiEnrolments.forEach(c => {
      const scheme = this.chittis.find(s => s.id === c.schemeId);
      if (scheme) {
        accounts.push({
          type: 'chitti',
          id: scheme.id,
          name: scheme.name,
          amount: scheme.totalValue,
          info: `Chit - ${scheme.tenure} Months`
        });
      }
    });

    // Gather Interest Loans
    const loans = this.interests.filter(i => i.borrowerPhone === cust.phone);
    loans.forEach(loan => {
      accounts.push({
        type: 'interest',
        id: loan.id,
        name: loan.name,
        amount: loan.amount,
        info: `Loan - ${loan.interestRate}% Interest p.m.`
      });
    });

    // Gather Rentals
    const tenantHouses = this.houses.filter(h => h.renterPhone === cust.phone);
    tenantHouses.forEach(house => {
      accounts.push({
        type: 'rent',
        id: house.id!,
        name: house.houseName,
        amount: house.monthlyRent,
        info: `Rent - ₹${house.monthlyRent}/mo`
      });
    });

    if (accounts.length === 0) {
      this.toast.error('No active loan, chitti, or rental accounts found for this customer.');
    } else if (accounts.length === 1) {
      // Direct navigation
      if (accounts[0].type === 'chitti') this.viewChitDetails(accounts[0].id);
      else if (accounts[0].type === 'interest') this.viewInterestDetails(accounts[0].id);
      else {
        this.activeTab = 'rentals';
        this.activeHouseId = accounts[0].id;
        this.scrollToTop();
      }
    } else {
      // Multiple - show modal
      this.customerAccountsList = accounts;
      this.selectedCustomerForAccounts = cust;
      this.showAccountsModal = true;
      document.body.classList.add('modal-open');
    }
  }

  handleAccountSelection(acc: any) {
    if (acc.type === 'chitti') this.viewChitDetails(acc.id);
    else if (acc.type === 'interest') this.viewInterestDetails(acc.id);
    else {
      this.activeTab = 'rentals';
      this.activeHouseId = acc.id;
      this.scrollToTop();
    }
  }

  // --- Customer Operations ---
  openAddCustomerModal() {
    this.isEditModal = false;
    this.editingCustomer = null;
    this.existingMode = false;
    this.pickerSearch = '';
    this.usernameStatus = 'none';
    this.isCheckingUsername = false;
    this.customerForm.reset({
      schemeType: 'chitti',
      schemeId: '',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    this.showCustomerModal = true;
    document.body.classList.add('modal-open');
  }

  openEditCustomer(cust: Customer) {
    this.isEditModal = true;
    this.editingCustomer = cust;
    this.existingMode = false;
    this.customerForm.patchValue({
      name: cust.name || '',
      phone: cust.phone || '',
      username: cust.username || '',
      email: cust.email || '',
      schemeType: cust.schemeType || 'chitti',
      schemeId: cust.schemeId || '',
      joinedDate: cust.joinedDate || new Date().toISOString().split('T')[0],
      status: cust.status || 'Active'
    });
    this.showCustomerModal = true;
    document.body.classList.add('modal-open');
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.editingCustomer = null;
    this.isSaving = false;
    this.usernameStatus = 'none';
    this.isCheckingUsername = false;
    this.existingMode = false;
    document.body.classList.remove('modal-open');
  }

  closeAdminForm() {
    this.showAdminForm = false;
    this.isAdminEditMode = false;
    this.adminForm.reset();
    document.body.classList.remove('modal-open');
  }

  closeServiceDetailsModal() {
    this.showServiceDetailsModal = false;
    this.selectedTrackedService = null;
    this.selectedServiceHistory = [];
    document.body.classList.remove('modal-open');
  }

  get filteredPickerCustomers() {
    if (!this.allCustomers) return [];
    const q = this.pickerSearch.toLowerCase();
    return this.allCustomers.filter(c =>
      (c.name?.toLowerCase().includes(q)) ||
      (c.phone?.includes(q))
    );
  }

  selectFromPicker(cust: Customer) {
    this.existingMode = false;
    this.customerForm.patchValue({
      name: cust.name || '',
      phone: cust.phone || '',
      username: cust.username || '',
      email: cust.email || ''
    });
  }

  // ─── Renter Customer Picker for Property Form ──────────────────────────
  get filteredRenterCustomers() {
    if (!this.allCustomers) return [];
    const q = (this.renterSearchQuery || '').toLowerCase().trim();
    if (!q) return this.allCustomers.slice(0, 20); // show first 20 when no query
    return this.allCustomers.filter(c =>
      (c.name?.toLowerCase().includes(q)) ||
      (c.phone?.includes(q))
    ).slice(0, 20);
  }

  selectRenterFromCustomer(cust: Customer) {
    this.renterSelectedFromList = true;
    this.showRenterDropdown = false;
    this.renterSearchQuery = cust.name || '';
    this.rentalHouseForm.patchValue({
      renterName: cust.name || '',
      renterPhone: cust.phone || '',
      renterAadhar: (cust as any).aadhar || ''
    });
  }

  onRenterSearchChange(value: string) {
    this.renterSearchQuery = value;
    this.renterSelectedFromList = false;
    this.showRenterDropdown = true;
    this.rentalHouseForm.patchValue({ renterName: value, renterPhone: '', renterAadhar: '' });
  }

  onRenterSearchBlur() {
    // Delay to allow click on dropdown items to register
    setTimeout(() => { this.showRenterDropdown = false; }, 200);
  }

  async saveCustomer() {
    if (this.customerForm.valid) {
      this.isSaving = true;
      try {
        const val = this.customerForm.value;
        const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));

        if (this.isEditModal && this.editingCustomer?.id) {
          await this.customerService.updateCustomer(this.editingCustomer.id, val);

          // Optionally update provision if username changed, but basic info is enough for now
          if (val.username) {
            await this.authService.provisionCustomer(val.username, val.name, val.phone);
          }
          this.toast.success('Customer updated!');
        } else {
          try {
            // 1. Provision Login
            const alreadyExists = await this.authService.checkUserExists(val.username);
            if (!alreadyExists) {
              await this.authService.provisionCustomer(val.username, val.name, val.phone);
            }

            // 2. Save Customer profile
            const newCustomer = { ...val, createdBy: profile?.uid };
            await this.customerService.addCustomer(newCustomer);
            this.toast.success('Customer created & login provisioned!');
          } catch (e: any) {
            console.error('Registration failed', e);
            this.toast.error(e.message || 'Could not provision login account. Username might be taken.');
            return;
          }
        }
        this.closeCustomerModal();
        this.loadData();
      } catch (e) {
        this.toast.error('Operation failed.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteCustomer(id: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await this.customerService.deleteCustomer(id);
        this.toast.success('Customer deleted.');
        this.loadData();
      } catch (e) {
        this.toast.error('Delete failed.');
      }
    }
  }

  // Navigation methods
  goToCreateChit() { this.router.navigate(['/admin/create-chit']); }
  editChit(id: string) { this.router.navigate(['/admin/edit-chit', id]); }
  viewChitDetails(id: string) { this.router.navigate(['/admin/chit', id]); }
  async deleteChit(id: string) {
    if (confirm('Delete this Chitti?')) {
      await this.chittiService.deleteChitti(id);
      this.toast.success('Deleted.');
    }
  }

  goToCreateInterest() { this.router.navigate(['/admin/create-interest']); }
  editInterest(id: string) { this.router.navigate(['/admin/edit-interest', id]); }
  viewInterestDetails(id: string) { this.router.navigate(['/admin/interest', id]); }
  async deleteInterest(id: string) {
    if (confirm('Delete this Loan?')) {
      await this.interestService.deleteInterest(id);
      this.toast.success('Deleted.');
    }
  }

  async toggleBiometric(event: any) {
    const enabled = event.target.checked;
    if (enabled) {
      // Prompt for identity to verify before enabling
      const success = await this.biometricService.verifyIdentity();
      if (success) {
        this.isBiometricEnabled = true;
        this.biometricService.setBiometricEnabled(true);
        this.toast.success('Fingerprint login enabled. It will be active from your next login.');
      } else {
        event.target.checked = false;
        this.isBiometricEnabled = false;
        this.toast.error('Identity verification failed.');
      }
    } else {
      this.isBiometricEnabled = false;
      await this.biometricService.clearCredentials();
      this.toast.success('Fingerprint login disabled.');
    }
  }

  getTotalLoanInterest(loan: InterestScheme): number {
    return (loan.interestCollections || []).reduce((sum, c) => sum + c.amount, 0);
  }

  getTotalChittiPaid(schemeId: string): number {
    return this.allCustomers
      .filter(c => c.schemeId === schemeId && c.schemeType === 'chitti')
      .reduce((sum, cust) => {
        const paid = (cust.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paid;
      }, 0);
  }

  logout() { this.router.navigate(['/login']); }
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark');
  }
  getMonthsPassed(startDateStr: string): number {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months + 1); // +1 because first month starts immediately
  }

  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // --- Super Admin & Security ---
  goToManageAdmins() {
    this.router.navigate(['/admin/manage-admins']);
  }


  migrationUsername: string = '';

  async backfillOwnership() {
    const target = this.migrationUsername.trim();
    const promptMsg = target
      ? `This will assign all current unowned data to the user "@${target}". Proceed?`
      : 'This will assign all current unowned data to YOUR account. Proceed?';

    if (!confirm(promptMsg)) return;

    this.isSaving = true;
    try {
      let targetUid: string | null = null;

      if (target) {
        targetUid = await this.authService.getUidByUsername(target);
        if (!targetUid) {
          this.toast.error(`User "@${target}" not found.`);
          return;
        }
      } else {
        const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
        targetUid = profile?.uid;
      }

      if (!targetUid) {
        this.toast.error('Could not determine target account.');
        return;
      }

      const adminUid = targetUid;

      // Update Customers
      for (const cust of this.allCustomers) {
        if (!cust.createdBy) {
          await this.customerService.updateCustomer(cust.id!, { createdBy: adminUid });
        }
      }

      // Update Chittis
      for (const chit of this.chittis) {
        if (!chit.createdBy) {
          await this.chittiService.updateChitti(chit.id!, { createdBy: adminUid });
        }
      }

      // Update Interests
      for (const interest of this.interests) {
        if (!interest.createdBy) {
          await this.interestService.updateInterest(interest.id!, { createdBy: adminUid });
        }
      }

      this.toast.success('Ownership migration completed successfully!');
      this.migrationUsername = '';
      this.loadData();
    } catch (e) {
      this.toast.error('Migration failed.');
    } finally {
      this.isSaving = false;
    }
  }

  async updatePassword() {
    if (this.passwordForm.valid) {
      this.isSaving = true;
      try {
        const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
        if (profile?.username) {
          await this.authService.changePassword(profile.username, this.passwordForm.value.newPassword, 'admin');
          this.toast.success('Admin password updated successfully!');
          this.passwordForm.reset();
          this.activeTab = 'chitti';
          this.activeMobileMenu = 'chitti';
        }
      } catch (e) {
        this.toast.error('Failed to update password.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  // Rental Methods
  openRentalHouseForm(house?: RentalHouse) {
    // Reset renter picker state
    this.renterSearchQuery = '';
    this.showRenterDropdown = false;
    this.renterSelectedFromList = false;

    if (house) {
      this.isRentalEditMode = true;
      this.editingRentalId = house.id || null;
      this.renterSearchQuery = house.renterName || '';
      this.renterSelectedFromList = !!(house.renterName); // treat existing as selected
      this.rentalHouseForm.patchValue({
        houseName: house.houseName,
        advanceAmount: house.advanceAmount,
        advanceMonths: house.advanceMonths,
        monthlyRent: house.monthlyRent || 0,
        renterName: house.renterName,
        renterPhone: house.renterPhone,
        renterAadhar: house.renterAadhar || '',
        arrivedDate: house.arrivedDate,
        electricMeterNo: house.electricMeterNo || '',
        waterBillNo: house.waterBillNo || '',
        fullAddress: house.fullAddress || '',
        lastRentIncreaseDate: house.lastRentIncreaseDate || '',
        status: house.status
      });
    } else {
      this.isRentalEditMode = false;
      this.editingRentalId = null;
      this.rentalHouseForm.reset({
        advanceAmount: 0, advanceMonths: 0, monthlyRent: 0, status: 'Occupied',
        arrivedDate: new Date().toISOString().split('T')[0]
      });
    }
    this.showRentalHouseForm = true;
    document.body.classList.add('modal-open');
  }

  async saveRentalHouse() {
    if (this.rentalHouseForm.invalid) {
      this.rentalHouseForm.markAllAsTouched();
      this.toast.error('Please fill all required fields correctly.');
      return;
    }
    this.isSaving = true;
    try {
      const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
      const houseData = { ...this.rentalHouseForm.getRawValue(), createdBy: profile?.uid };

      if (this.isRentalEditMode && this.editingRentalId) {
        await this.rentalService.updateHouse(this.editingRentalId, houseData);
        this.toast.success('House updated successfully!');
      } else {
        await this.rentalService.addHouse({ ...houseData, bills: [] });
        this.toast.success('New house registered!');
      }
      this.showRentalHouseForm = false;
      document.body.classList.remove('modal-open');
    } catch (e) {
      this.toast.error('Failed to save house information');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteRentalHouse(id: string) {
    if (confirm('Are you sure you want to delete this house and all its billing history?')) {
      try {
        await this.rentalService.deleteHouse(id);
        this.toast.success('House deleted.');
        if (this.activeHouseId === id) this.activeHouseId = null;
      } catch (e) {
        this.toast.error('Failed to delete house.');
      }
    }
  }

  viewHouseBills(houseId: string) {
    this.activeHouseId = houseId;
    this.rentalView = 'ledger';
    this.scrollToTop();
    const house = this.getActiveHouse();
    if (house) {
      this.syncRentalUtilityBills(house);
    }
  }

  getActiveHouse(): RentalHouse | undefined {
    return this.houses.find(h => h.id === this.activeHouseId);
  }

  openMonthlyBillForm(bill?: RentalBill, index: number | null = null) {
    const house = this.getActiveHouse();
    if (!house) return;

    this.editingBillIndex = index;
    if (bill) {
      this.monthlyBillForm.patchValue({
        billDate: bill.billDate || new Date().toISOString().split('T')[0],
        rentAmount: bill.rentAmount,
        electricBill: bill.electricBill,
        waterBill: bill.waterBill,
        status: bill.status || 'Paid'
      });
    } else {
      const electricAmount = this.getHouseUtilityBill(house, 'electricity');
      const waterAmount = this.getHouseUtilityBill(house, 'water');

      this.monthlyBillForm.reset({
        billDate: new Date().toISOString().split('T')[0],
        rentAmount: house.monthlyRent || 0,
        electricBill: electricAmount,
        waterBill: waterAmount,
        status: 'Paid'
      });
      this.syncRentalUtilityBills(house, true);
    }
    this.showMonthlyBillForm = true;
    document.body.classList.add('modal-open');
  }

  private async syncRentalUtilityBills(house: RentalHouse, patchMonthlyBillForm = false) {
    if (!house.id) return;
    try {
      const nextValues = await this.rentalService.syncRentalUtilityBills(house);
      if (nextValues && patchMonthlyBillForm && this.showMonthlyBillForm && this.activeHouseId === house.id && this.editingBillIndex === null) {
        this.monthlyBillForm.patchValue({
          electricBill: nextValues.electricity ?? this.monthlyBillForm.value.electricBill ?? 0,
          waterBill: nextValues.water ?? this.monthlyBillForm.value.waterBill ?? 0
        });
      }
    } catch (e) {
      console.error('Failed to sync rental utility bills:', e);
    }
  }

  async saveMonthlyBill() {
    if (this.monthlyBillForm.valid && this.activeHouseId) {
      this.isSaving = true;
      try {
        const house = this.getActiveHouse();
        if (!house) return;

        const billRaw = this.monthlyBillForm.getRawValue();
        const date = new Date(billRaw.billDate);

        const billData: RentalBill = {
          ...billRaw,
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          total: (Number(billRaw.rentAmount) || 0) + (Number(billRaw.electricBill) || 0) + (Number(billRaw.waterBill) || 0)
        };

        let updatedBills = [...(house.bills || [])];
        if (this.editingBillIndex !== null) {
          updatedBills[this.editingBillIndex] = billData;
        } else {
          updatedBills.push(billData);
        }

        updatedBills.sort((a, b) => new Date(a.billDate).getTime() - new Date(b.billDate).getTime());

        if (this.activeHouseId) {
          await this.rentalService.updateHouse(this.activeHouseId, { bills: updatedBills });
          this.toast.success('Rent collection recorded!');
          // Trigger automated WhatsApp receipt if status is Paid
          if (billData.rentAmount > 0 && house.renterPhone) {
            this.notificationService.sendRentReceiptNotification(
              house.renterPhone,
              house.renterName,
              house.houseName,
              billData.total,
              billData.month,
              billData.year
            );
          }
        }
        this.showMonthlyBillForm = false;
        document.body.classList.remove('modal-open');
      } catch (e) {
        this.toast.error('Failed to save monthly bill');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteMonthlyBill(index: number) {
    if (confirm('Delete this monthly record?') && this.activeHouseId) {
      try {
        const house = this.getActiveHouse();
        if (!house) return;
        const updatedBills = [...(house.bills || [])];
        updatedBills.splice(index, 1);
        if (this.activeHouseId) {
          await this.rentalService.updateHouse(this.activeHouseId, { bills: updatedBills });
          this.toast.success('Record deleted.');
        }
      } catch (e) {
        this.toast.error('Delete failed.');
      }
    }
  }

  async sendRentReminder(house: RentalHouse) {
    if (!house.renterPhone) {
      this.toast.error('Renter contact details are incomplete.');
      return;
    }
    const cleanPhone = house.renterPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone}`;
    const stats = this.getHouseStats(house);

    let message = '';
    if (stats.pending > 0) {
      const now = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      message = `Hello ${house.renterName || 'Tenant'},\n\n` +
        `This is a friendly reminder for the rent & utilities payment of *${house.houseName}* for ${month} ${year}.\n\n` +
        `• Pending Amount: ₹${stats.pending.toLocaleString('en-IN')}\n\n` +
        `Please clear the dues at your earliest convenience. Thank you!`;
    }

    const whatsappUrl = `https://wa.me/${phoneWithCountry}${message ? '?text=' + encodeURIComponent(message) : ''}`;
    window.open(whatsappUrl, '_blank');
  }

  printRentReceipt(event: { house: RentalHouse, bill: RentalBill }) {
    this.selectedReceiptHouse = event.house;
    this.selectedReceiptBill = event.bill;
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
    const landlordName = this.currentUserProfile?.displayName || 'Property Owner';
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
                <div class="detail-name">${landlordName || 'Property Owner'}</div>
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

  async addHouseExpense(houseId: string, expense: Omit<RentalExpense, 'id'>) {
    const house = this.houses.find(h => h.id === houseId);
    if (!house) return;

    const id = `exp_${Date.now()}`;
    const newExpense: RentalExpense = { ...expense, id };
    const updatedExpenses = [...(house.expenses || []), newExpense];

    this.isSaving = true;
    try {
      await this.rentalService.updateHouse(houseId, { expenses: updatedExpenses });
      this.toast.success('Expense recorded successfully!');
    } catch (e) {
      this.toast.error('Failed to log expense.');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteHouseExpense(houseId: string, expenseId: string) {
    const house = this.houses.find(h => h.id === houseId);
    if (!house) return;

    if (!confirm('Are you sure you want to delete this expense record?')) return;

    const updatedExpenses = (house.expenses || []).filter(e => e.id !== expenseId);

    this.isSaving = true;
    try {
      await this.rentalService.updateHouse(houseId, { expenses: updatedExpenses });
      this.toast.success('Expense deleted.');
    } catch (e) {
      this.toast.error('Failed to delete expense.');
    } finally {
      this.isSaving = false;
    }
  }

  async vacateTenant(houseId: string, settlement: { vacatedDate: string, refundAmount: number, deductions: number, deductionReason: string }) {
    const house = this.houses.find(h => h.id === houseId);
    if (!house) return;

    if (!confirm(`Are you sure you want to vacate ${house.renterName}? This will archive this tenancy history.`)) return;

    const past: PastTenancy = {
      renterName: house.renterName,
      renterPhone: house.renterPhone,
      arrivedDate: house.arrivedDate,
      vacatedDate: settlement.vacatedDate,
      bills: house.bills || [],
      expenses: house.expenses || [],
      advanceRefunded: settlement.refundAmount,
      deductions: settlement.deductions,
      deductionReason: settlement.deductionReason
    };

    const updatedPast = [...(house.pastTenancies || []), past];

    this.isSaving = true;
    try {
      await this.rentalService.updateHouse(houseId, {
        status: 'Vacant',
        renterName: '',
        renterPhone: '',
        renterAadhar: '',
        arrivedDate: '',
        lastRentIncreaseDate: '',
        bills: [],
        expenses: [],
        pastTenancies: updatedPast
      });
      this.toast.success('Tenant vacated and record archived!');
    } catch (e) {
      this.toast.error('Failed to process vacating.');
    } finally {
      this.isSaving = false;
    }
  }

  async sendAllReminders() {
    const dueLoans = this.interests.filter(loan => this.isLoanReminderDue(loan));

    if (dueLoans.length === 0) {
      this.toast.info('No reminders due at this time.');
      return;
    }

    if (!confirm(`Are you sure you want to send automatic professional reminders to ${dueLoans.length} customers via FinServe account?`)) {
      return;
    }

    this.isSaving = true;
    let successCount = 0;

    try {
      for (const loan of dueLoans) {
        const nextDue = this.nextLoanDueDate(loan);
        const amountDue = this.getPendingInterestForLoan(loan);

        const success = await this.notificationService.sendReminder(
          loan.borrowerPhone,
          loan.borrowerName,
          loan.name,
          amountDue,
          nextDue,
          'whatsapp' // Default to WhatsApp via API
        );

        if (success) successCount++;
      }
      this.toast.success(`Processed ${successCount} reminders.`);
    } catch (error) {
      this.toast.error('One or more reminders failed to send.');
    } finally {
      this.isSaving = false;
    }
  }

  // --- WhatsApp & Reminder Logic ---
  isLoanReminderDue(loan: InterestScheme): boolean {
    if (!loan.startDate) return false;
    const nextDue = this.nextLoanDueDate(loan);
    if (!nextDue) return false;

    // Check if interest is overdue
    if (this.getPendingInterestForLoan(loan) > 0) return true;

    const today = this.getLocalToday();
    const timeDiff = nextDue.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff <= 5 && daysDiff >= 0;
  }

  nextLoanDueDate(loan: InterestScheme): Date | null {
    if (!loan.startDate) return null;
    const startDate = this.parseLocalDateForReminder(loan.startDate);
    if (!startDate) return null;

    const today = this.getLocalToday();
    let cycleIndex = 0;
    let dueDate = this.addMonthsClampedForReminder(startDate, cycleIndex);

    while (dueDate.getTime() < today.getTime()) {
      cycleIndex++;
      dueDate = this.addMonthsClampedForReminder(startDate, cycleIndex);
    }
    return dueDate;
  }

  shareLoanReminder(loan: InterestScheme) {
    const cleanPhone = loan.borrowerPhone ? loan.borrowerPhone.replace(/\D/g, '') : '';
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone}`;

    // Find all active loans for this borrower (matching phone number or name)
    const borrowerLoans = this.interests.filter(l => {
      if (l.status === 'Inactive') return false;
      const lPhone = l.borrowerPhone ? l.borrowerPhone.replace(/\D/g, '') : '';
      const phoneMatches = lPhone && cleanPhone && (lPhone === cleanPhone || `91${lPhone}` === phoneWithCountry || lPhone === phoneWithCountry);
      const nameMatches = l.borrowerName && loan.borrowerName && l.borrowerName.trim().toLowerCase() === loan.borrowerName.trim().toLowerCase();
      return phoneMatches || nameMatches;
    });

    let message = '';
    if (borrowerLoans.length <= 1) {
      const nextDue = this.nextLoanDueDate(loan);
      const amountDue = this.getPendingInterestForLoan(loan);
      const formattedAmount = amountDue.toLocaleString('en-IN');
      const formattedDate = nextDue ? nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

      message = `Hello ${loan.borrowerName},\n\n` +
        `This is an interest payment reminder from FinServe for your loan *${loan.name}*.\n\n` +
        `• Principal Amount: ₹${loan.amount.toLocaleString('en-IN')}\n` +
        `• Interest Rate: ${loan.interestRate}% p.m.\n` +
        `• *Interest Due: ₹${formattedAmount}*\n` +
        (formattedDate ? `• Due Date: ${formattedDate}\n` : '') +
        `\nPlease clear the dues at your earliest convenience to avoid penalties. Thank you!`;
    } else {
      message = `Hello ${loan.borrowerName},\n\n` +
        `This is a consolidated interest payment reminder from FinServe for your active loans:\n\n`;
      let grandTotalPending = 0;

      borrowerLoans.forEach((l, idx) => {
        const nextDue = this.nextLoanDueDate(l);
        const amountDue = this.getPendingInterestForLoan(l);
        const formattedDate = nextDue ? nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        grandTotalPending += amountDue;

        message += `*${idx + 1}. ${l.name}*\n`;
        message += `   - Principal: ₹${l.amount.toLocaleString('en-IN')}\n`;
        message += `   - Interest Rate: ${l.interestRate}% p.m.\n`;
        message += `   - Interest Due: ₹${amountDue.toLocaleString('en-IN')}\n`;
        if (formattedDate) {
          message += `   - Due Date: ${formattedDate}\n`;
        }
        message += `\n`;
      });

      message += `*Total Consolidated Amount Due: ₹${grandTotalPending.toLocaleString('en-IN')}*\n\n`;
      message += `Please clear your dues at your earliest convenience to avoid penalties. Thank you!`;
    }

    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }


  private getAccruedInterestThroughDate(loan: InterestScheme, date: Date): number {
    const startDate = this.parseLocalDateForReminder(loan.startDate);
    if (!startDate) return 0;
    let totalDue = 0;
    let cycleIndex = 1;
    while (true) {
      const cycleStart = this.addMonthsClampedForReminder(startDate, cycleIndex - 1);
      const cycleDueDate = this.addMonthsClampedForReminder(startDate, cycleIndex);
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

  private getLocalToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private parseLocalDateForReminder(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private addMonthsClampedForReminder(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }

  handleFetchLiveBill(service: TrackedService) {
    if (!service.id) return;

    if (service.serviceType !== 'electricity' && service.serviceType !== 'water') {
      this.toast.info('Live tracking not yet implemented for this service type.');
      return;
    }

    this.syncingServices[service.id] = true;
    this.isFetchingLiveBill = true;

    const fetchObs: Observable<any> = service.serviceType === 'electricity'
      ? this.tspdclService.fetchBillDetails(service.serviceNumber)
      : this.hmwssbService.fetchBillDetails(service.serviceNumber);

    fetchObs.subscribe({
      next: async (details: any) => {
        this.syncingServices[service.id!] = false;
        this.isFetchingLiveBill = false;
        if (details) {
          this.selectedLiveBill = details;
          // this.showLiveBillModal = true;
          // document.body.classList.add('modal-open');

          const updateData: any = {
            lastAmount: this.getLiveUtilityAmount(details),
            lastAmountLabel: details.amountLabel || (service.serviceType === 'water' ? 'Total Arrears' : 'Payable Amount'),
            lastDueDate: details.dueDate,
            lastPaidDate: this.isLiveBillPaid(details) ? this.getLiveBillDisplayDate(details) : '',
            lastBillStatus: this.isLiveBillPaid(details) ? 'paid' : 'pending',
            consumerName: details.consumerName,
          };

          if (service.serviceType === 'electricity') {
            updateData.altServiceNumber = details.serviceNumber;
            updateData.ero = details.ero;
            updateData.address = details.address;
            updateData.sectionName = details.sectionName;
          } else {
            updateData.address = details.address;
          }

          // Update the thumbnail data in Firestore
          await this.billService.updateTrackedService(service.id!, updateData);

          // AUTO STORE RECORD
          const profile = await firstValueFrom(this.authService.userProfile$);
          const liveUtilityAmount = this.getLiveUtilityAmount(details);
          if (profile?.uid && liveUtilityAmount > 0) {
            await this.billService.autoStoreBillRecord({
              consumerName: details.consumerName || service.title || 'Unnamed',
              serviceNumber: service.serviceNumber,
              amount: liveUtilityAmount,
              date: new Date().toISOString().split('T')[0],
              adminUid: profile.uid
            });
          }

          this.toast.success(`Live details updated and archived for ${service.provider || service.title}`);
        } else {
          this.toast.error(`Could not reach billing server for ${service.serviceNumber}`);
        }
      },
      error: () => {
        this.syncingServices[service.id!] = false;
        this.isFetchingLiveBill = false;
        this.toast.error(`Connection error for ${service.provider || service.title}`);
      }
    });
  }

  lockScroll() { document.body.style.overflow = 'hidden'; }
  unlockScroll() { document.body.style.overflow = ''; }

  private getLiveUtilityAmount(details: any): number {
    const amount = details?.isPaid && details?.paidAmount !== undefined
      ? details.paidAmount
      : details?.totalAmountPayable;

    return Number(amount) || 0;
  }

  isLiveBillPaid(details: any): boolean {
    return details?.isPaid === true || String(details?.amountLabel || '').toLowerCase().includes('paid');
  }

  isTrackedServicePaid(service: TrackedService | null | undefined): boolean {
    if (!service) return false;

    // Check global bills first
    if (service.serviceNumber) {
      const cleanServiceNo = this.normalizeServiceNumber(service.serviceNumber);
      if (cleanServiceNo) {
        const matchingBills = (this.bills || []).filter(b =>
          b.serviceNumber &&
          this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
          b.serviceType?.toLowerCase() === service.serviceType?.toLowerCase() &&
          !b.isDeleted
        );
        if (matchingBills.length > 0) {
          const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
          const latestGlobalBill = sortedBills[0];
          const statusStr = (latestGlobalBill.status || '').toLowerCase();
          if (statusStr === 'completed' || statusStr === 'paid') {
            return true;
          }
        }
      }
    }

    return service.lastBillStatus === 'paid' || String(service.lastAmountLabel || '').toLowerCase().includes('paid');
  }

  getLiveBillDisplayDate(details: any): string {
    if (!details) return '--';
    return this.isLiveBillPaid(details) ? (details.paidDate || details.dueDate || '--') : (details.dueDate || '--');
  }

  getTrackedServiceDisplayDate(service: TrackedService | null | undefined): string {
    if (!service) return '--';
    return this.isTrackedServicePaid(service) ? (service.lastPaidDate || service.lastDueDate || '--') : (service.lastDueDate || '--');
  }

  private parsePortalDate(value?: string): string | undefined {
    if (!value || value === '--' || value === 'Check Portal') return undefined;

    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
    if (!match) return undefined;

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthIndex = months.indexOf(match[2].toUpperCase());
    if (monthIndex === -1) return undefined;

    const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
    const day = Number(match[1]);
    const date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) return undefined;

    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  closeLiveBillModal() {
    this.showLiveBillModal = false;
    this.selectedLiveBill = null;
    document.body.classList.remove('modal-open');
  }

  closeRentalHouseForm() {
    this.showRentalHouseForm = false;
    this.editingRentalId = null;
    this.isRentalEditMode = false;
    this.rentalHouseForm.reset();
    document.body.classList.remove('modal-open');
  }

  closeMonthlyBillForm() {
    this.showMonthlyBillForm = false;
    this.editingBillIndex = null;
    this.monthlyBillForm.reset();
    document.body.classList.remove('modal-open');
  }

  closeAccountsModal() {
    this.showAccountsModal = false;
    document.body.classList.remove('modal-open');
  }

  handlePayNow(service: TrackedService) {
    if (service.serviceType === 'water') {
      this.openWaterBill(service.serviceNumber);
    } else if (service.serviceType === 'electricity') {
      this.openElectricityBill(service.serviceNumber);
    } else {
      this.toast.info('Direct payment redirection not available for this service type.');
    }
  }

  openElectricityBill(uscNo: string) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.billdesk.com/pgidsk/pgmerc/tsspdclpgi/TSSPDCLPGIConfirm.jsp';
    form.target = '_blank';

    const uscnoInput = document.createElement('input');
    uscnoInput.type = 'hidden';
    uscnoInput.name = 'uscno';
    uscnoInput.value = uscNo;
    form.appendChild(uscnoInput);

    const choiceInput = document.createElement('input');
    choiceInput.type = 'hidden';
    choiceInput.name = 'choice';
    choiceInput.value = 'Postpaid Service';
    form.appendChild(choiceInput);

    const preflagInput = document.createElement('input');
    preflagInput.type = 'hidden';
    preflagInput.name = 'preflag';
    preflagInput.value = 'N';
    form.appendChild(preflagInput);

    const circleInput = document.createElement('input');
    circleInput.type = 'hidden';
    circleInput.name = 'circle';
    circleInput.value = '';
    form.appendChild(circleInput);

    const eroInput = document.createElement('input');
    eroInput.type = 'hidden';
    eroInput.name = 'ero';
    eroInput.value = '';
    form.appendChild(eroInput);

    const snoInput = document.createElement('input');
    snoInput.type = 'hidden';
    snoInput.name = 'sno';
    snoInput.value = '';
    form.appendChild(snoInput);

    const emailInput = document.createElement('input');
    emailInput.type = 'hidden';
    emailInput.name = 'txtEmailID';
    emailInput.value = 'NA';
    form.appendChild(emailInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  openWaterBill(can: string) {
    // Create a hidden form to perform a POST request to BillDesk
    // This allows us to jump directly to the 2nd screen (bill details/payment options)
    const form = document.body.appendChild(document.createElement('form'));
    form.method = 'POST';
    form.action = 'https://www.billdesk.com/pgidsk/pgmerc/hmwssb/HMWSSBNPaymentoption.jsp';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'canNumber';
    input.value = can;
    form.appendChild(input);

    form.submit();
    document.body.removeChild(form);
  }

  openBillsFilterModal() {
    this.showBillsFilterModal = true;
    document.body.classList.add('modal-open');
  }

  closeBillsFilterModal() {
    this.showBillsFilterModal = false;
    document.body.classList.remove('modal-open');
  }
}




