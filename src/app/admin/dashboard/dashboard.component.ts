import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { InterestService, InterestScheme } from '../services/interest.service';
import { CustomerService, Customer } from '../services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BiometricService } from '../../services/biometric.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { BillService, Bill, TrackedService } from '../services/bill.service';
import { BillListComponent } from '../bills/bill-list/bill-list.component';
import { BillFormComponent } from '../bills/bill-form/bill-form.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseChartDirective, BillListComponent, BillFormComponent],
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
      
      .bottom-nav-pill {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #ededed;
        height: 72px;
        width: 90%;
        max-width: 400px;
        border-radius: 9999px;
        display: flex;
        padding: 6px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        z-index: 100;
      }
      .nav-item-box {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        z-index: 2;
        cursor: pointer;
      }
      .nav-indicator {
        position: absolute;
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
        border-radius: 50%;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1;
      }
      .nav-icon {
        position: relative;
        z-index: 3;
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
        background: rgba(139, 92, 246, 0.08); /* Professional subtle purple */
        border: 1px solid rgba(139, 92, 246, 0.04);
      }
      .dark .progress-professional {
        background: rgba(255, 255, 255, 0.04); /* Deep professional dark */
        border: 1px solid rgba(255, 255, 255, 0.02);
      }
      .glass-card { background: rgb(214 214 214 / 20%); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); }
      .dark .glass-card { background: rgb(214 214 214 / 20%); border: 1px solid rgba(255,255,255,0.08); }
      .dark .progress-professional {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.03);
      }
      .dark .bottom-nav-pill {
        border: 1px solid rgba(255,255,255,0.1);
        background: #0a0a0a;
      }
    </style>

    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500 pb-32 sm:pb-0 overflow-x-hidden relative">
      <!-- Decorative Background Glows (Subtle) -->
      <div class="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

      <!-- Top Navigation -->
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">FinServe Admin</span>
            </div>
            <div class="flex space-x-2 items-center" *ngIf="authService.userProfile$ | async as profile">
              <!-- Super Admin Controls -->
              <button *ngIf="isSuperAdmin" (click)="goToManageAdmins()" class="p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all mr-1 flex items-center gap-2" title="Manage Admin Members">
                 <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                 <span class="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Manage Admins</span>
              </button>
              
              <!-- Theme Toggle -->
              <button (click)="toggleTheme()" class="p-2.5 text-gray-400 hover:text-purple-600 transition-colors mr-1">
                 <svg *ngIf="!isDarkMode" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                 <svg *ngIf="isDarkMode" class="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </button>
              <div class="flex flex-col items-end mr-2 hidden sm:flex">
                 <span class="text-gray-900 dark:text-white text-sm font-bold leading-tight">{{ profile.displayName || 'Admin' }}</span>
                 <span class="text-gray-500 text-[10px] font-medium uppercase tracking-widest">{{ profile.username }}</span>
              </div>
              <button (click)="logout()" class="p-2.5 text-red-500 hover:text-red-600 transition-all font-bold" title="Log out">
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        <!-- Tab Switcher (Only for regular admins or Super Admin Security) -->
        <div class="hidden sm:flex p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl w-full sm:max-w-md mb-8 relative gap-1 overflow-x-auto no-scrollbar whitespace-nowrap border border-gray-100 dark:border-gray-700">
          <button *ngIf="!isSuperAdmin" (click)="activeTab = 'overview'; activeMobileMenu = 'overview'"
                  [class.tab-active]="activeTab === 'overview'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            OVERVIEW
          </button>
          <button *ngIf="!isSuperAdmin && showInterestTab" (click)="activeTab = 'interest'; activeMobileMenu = 'interest'"
                  [class.tab-active]="activeTab === 'interest'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            LOANS
          </button>
          <button *ngIf="!isSuperAdmin && showChittiTab" (click)="activeTab = 'chitti'; activeMobileMenu = 'chitti'"
                  [class.tab-active]="activeTab === 'chitti'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            CHITTI
          </button>
          <button *ngIf="!isSuperAdmin && showCustomersTab" (click)="activeTab = 'customers'; activeMobileMenu = 'customers'"
                  [class.tab-active]="activeTab === 'customers'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            CUSTOMERS
          </button>
          <button *ngIf="!isSuperAdmin && showBillsTab" (click)="activeTab = 'bills'; activeMobileMenu = 'bills'"
                  [class.tab-active]="activeTab === 'bills'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            BILLS
          </button>
          <button (click)="activeTab = 'security'; activeMobileMenu = 'security'"
                  [class.tab-active]="activeTab === 'security'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            SECURITY
          </button>
        </div>

        <!-- ═══════════ ADMIN OVERVIEW VIEW ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'overview') {
           <div class="space-y-8 card-animate">
              <!-- Header -->
              <div class="flex justify-between items-center mb-6">
                 <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Business Overview</h2>
                    <p class="text-sm font-medium text-gray-500 mt-1">Aggregated statistics and metrics for your operations.</p>
                 </div>
                 <div class="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                    <select [(ngModel)]="selectedOverviewYear" (ngModelChange)="generateOverviewChart($event)"
                            class="bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-300 pr-8 cursor-pointer">
                       <option *ngFor="let y of availableOverviewYears" [ngValue]="y">{{y}}</option>
                    </select>
                 </div>
              </div>

              <!-- KPIs -->
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <div class="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                    <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Given Loans</p>
                    <p class="text-xl font-black text-blue-700 dark:text-blue-300">₹{{ totalGivenLoans | number:'1.0-0' }}</p>
                 </div>
                 <div class="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                    <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Settlements</p>
                    <p class="text-xl font-black text-emerald-700 dark:text-emerald-300">₹{{ totalSettlement | number:'1.0-0' }}</p>
                 </div>
                 <div class="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-800/50">
                    <p class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Pending Principal</p>
                    <p class="text-xl font-black text-red-700 dark:text-red-300">₹{{ totalPendingPrincipal | number:'1.0-0' }}</p>
                 </div>
                 <div class="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-3xl border border-purple-100 dark:border-purple-800/50">
                    <p class="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Interest Collected</p>
                    <p class="text-xl font-black text-purple-700 dark:text-purple-300">₹{{ totalCollectedInterest | number:'1.0-0' }}</p>
                 </div>
                 <div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-800/50">
                    <p class="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Pending Interest</p>
                    <p class="text-xl font-black text-orange-700 dark:text-orange-300">₹{{ totalPendingInterest | number:'1.0-0' }}</p>
                 </div>
              </div>

              <!-- Line Chart -->
              <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                 <h3 class="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Financial Trends ({{ selectedOverviewYear }})</h3>
                 <div class="w-full h-[300px]">
                    <canvas baseChart [data]="overviewChartData" [options]="overviewChartOptions" [type]="overviewChartType"></canvas>
                 </div>
              </div>
           </div>
        }

        <!-- ═══════════ SUPER ADMIN VIEW ═══════════ -->
        @if (isSuperAdmin && activeTab !== 'security') {
           <div class="space-y-10 card-animate">
              <!-- Admin Creation Form -->
              <section class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8">
                 <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">{{ isAdminEditMode ? 'Update' : 'Register' }} Admin Member</h2>
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
                                [placeholder]="isAdminEditMode ? 'Leave blank to keep current' : 'Enter password (Default: admin123)'"
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold pr-14">
                             <button type="button" (click)="showAdminPassword = !showAdminPassword" 
                                class="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                [title]="showAdminPassword ? 'Hide Password' : 'Show Password'">
                                <svg *ngIf="!showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                <svg *ngIf="showAdminPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.253 0 2.426.287 3.477.799m-1.763 3.064a3 3 0 11-4.243 4.243m4.242-4.242L9.88 9.88m-2.012-2.012L2.031 2.031" /></svg>
                             </button>
                          </div>
                       </div>
                        <div class="md:col-span-2">
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Residential Address</label>
                           <textarea formControlName="address" rows="3" placeholder="Enter complete address"
                              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold resize-none"></textarea>
                        </div>
                        <div>
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">ID Proof Type</label>
                           <select formControlName="idType"
                              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold appearance-none">
                              <option value="">Select ID Type</option>
                              <option value="Aadhar">Aadhar Card</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="PAN">PAN Card</option>
                              <option value="Driving License">Driving License</option>
                           </select>
                        </div>
                        <div>
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">ID Document Number</label>
                           <input type="text" formControlName="idValue" placeholder="e.g. 1234 5678 9012"
                              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                        </div>
                        <div class="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Module Access (Show/Hide Tabs)</label>
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
                    <div class="flex justify-end pt-4">
                       <button type="submit" [disabled]="adminForm.invalid || isSaving"
                          class="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
                          {{ isSaving ? (isAdminEditMode ? 'Updating...' : 'Establishing...') : (isAdminEditMode ? 'Update Admin Account' : 'Finalize Admin Access') }}
                       </button>
                    </div>
                 </form>
              </section>

              <!-- Admin Members List -->
              <section class="space-y-4">
                 <h3 class="text-xl font-bold text-gray-900 dark:text-white px-2">Active Administrative Staff</h3>
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (admin of admins$ | async; track admin.uid) {
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
                             <div>
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Resident Address</p>
                                <p class="text-xs text-gray-600 dark:text-gray-300 font-bold leading-relaxed">{{ admin.address || 'No address provided' }}</p>
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
                    @if ((admins$ | async)?.length === 0) {
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
          <div class="card-animate" style="animation-delay:0.05s">
            
            <!-- Tracked Services Summary -->
            <div class="mb-12">
               <div class="flex justify-between items-center mb-6">
                  <div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Registered Services</h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Automated tracking for these numbers</p>
                  </div>
                  <button (click)="showServiceModal = true" class="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">
                    Register Service
                  </button>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  @for (service of trackedServices; track service.id) {
                    <div class="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/30 group relative">
                       <button (click)="handleRemoveService(service.id!)" class="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                       <p class="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{{ service.serviceType }}</p>
                       <h4 class="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{{ service.provider }}</h4>
                       <p class="text-[11px] font-bold text-gray-400 mt-0.5">#{{ service.serviceNumber }}</p>
                    </div>
                  }
                  @if (trackedServices.length === 0) {
                    <div class="col-span-full py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] opacity-40">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">No services registered for auto-sync</p>
                    </div>
                  }
               </div>
            </div>

            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bill Tracker</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ bills.length }} recorded bills</p>
              </div>
              <div class="flex gap-3 w-full sm:w-auto">
                <button (click)="handleSyncBills()" [disabled]="isSyncing" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl hover:bg-indigo-100 transition-all text-sm">
                  <svg class="h-4 w-4" [class.animate-spin]="isSyncing" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  {{ isSyncing ? 'Syncing...' : 'Sync Servers' }}
                </button>
                <button (click)="openBillForm()" class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-purple-600 rounded-2xl hover:shadow-lg transition-all text-sm">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  New Bill
                </button>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
               <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pending</p>
                  <p class="text-2xl font-black text-amber-500">₹{{ billStats.pendingAmount | number:'1.0-0' }}</p>
               </div>
               <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due in 7 Days</p>
                  <p class="text-2xl font-black text-purple-600">₹{{ billStats.upcomingAmount | number:'1.0-0' }}</p>
               </div>
               <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Today</p>
                  <p class="text-2xl font-black text-rose-500">{{ billStats.dueTodayCount }} Bills</p>
               </div>
               <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paid this Month</p>
                  <p class="text-2xl font-black text-green-500">₹{{ billStats.paidThisMonthAmount | number:'1.0-0' }}</p>
               </div>
            </div>

            @if (showBillForm) {
              <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-8 overflow-y-auto">
                <div class="w-full max-w-2xl animate-in zoom-in-95 duration-300">
                  <app-bill-form [bill]="editingBill" (save)="handleSaveBill($event)" (cancel)="closeBillForm()"></app-bill-form>
                </div>
              </div>
            }

            <!-- Register Service Modal -->
            @if (showServiceModal) {
              <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <div class="p-8">
                     <div class="flex justify-between items-center mb-8">
                        <div>
                           <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Register Service</h3>
                           <p class="text-sm text-gray-500 font-medium">Link a service number for auto-billing</p>
                        </div>
                        <button (click)="showServiceModal = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all text-gray-500">
                           <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>

                     <form [formGroup]="trackedServiceForm" (ngSubmit)="handleRegisterService()" class="space-y-4">
                        <div>
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Type</label>
                           <select formControlName="serviceType" class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold appearance-none">
                              <option value="electricity">Electricity</option>
                              <option value="mobile">Mobile</option>
                              <option value="water">Water</option>
                              <option value="internet">Internet</option>
                              <option value="other">Other</option>
                           </select>
                        </div>
                        <div>
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Provider Name</label>
                           <input type="text" formControlName="provider" placeholder="e.g. TSSPDCL, Airtel"
                              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold">
                        </div>
                        <div>
                           <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Service Number (Unique ID)</label>
                           <input type="text" formControlName="serviceNumber" placeholder="USCNO / Consumer ID"
                              class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white font-bold">
                        </div>
                        <div class="pt-4 flex gap-3">
                           <button type="button" (click)="showServiceModal = false" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl">Cancel</button>
                           <button type="submit" [disabled]="trackedServiceForm.invalid || isSaving" 
                              class="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                              {{ isSaving ? 'Registering...' : 'Link Service' }}
                           </button>
                        </div>
                     </form>
                  </div>
                </div>
              </div>
            }

            <app-bill-list 
              [bills]="bills" 
              (filterChanged)="handleBillFilters($event)"
              (editBill)="openBillForm($event)"
              (deleteBill)="handleDeleteBill($event)"
              (updateStatus)="handleUpdateBillStatus($event)">
            </app-bill-list>
          </div>
        }

        <!-- ═══════════ INTEREST DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'interest' && showInterestTab) {
          <div class="card-animate" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Interest Management</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ interests.length }} active loan schemes</p>
              </div>
              <button (click)="goToCreateInterest()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Loan
              </button>
            </div>

            <!-- Loan Filters & Search -->
            <div class="flex flex-col md:flex-row gap-4 mb-8">
               <div class="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 flex items-center">
                  <div class="pl-4 pr-2 text-gray-400">
                     <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input type="text" [(ngModel)]="loanSearchQuery" placeholder="Search loans by name or borrower..."
                         class="w-full py-3 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white font-medium">
               </div>
               
               <div class="p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl flex gap-1 border border-gray-100 dark:border-gray-700">
                  <button (click)="loanStatusFilter = 'Active'"
                          [class.tab-active]="loanStatusFilter === 'Active'"
                          class="px-5 py-2 text-[10px] font-black rounded-xl transition-all duration-300 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                     ACTIVE
                  </button>
                  <button (click)="loanStatusFilter = 'Inactive'"
                          [class.tab-active]="loanStatusFilter === 'Inactive'"
                          class="px-5 py-2 text-[10px] font-black rounded-xl transition-all duration-300 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                     INACTIVE
                  </button>
                  <button (click)="loanStatusFilter = 'All'"
                          [class.tab-active]="loanStatusFilter === 'All'"
                          class="px-5 py-2 text-[10px] font-black rounded-xl transition-all duration-300 text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                     ALL
                  </button>
               </div>
            </div>

            <!-- Analytics & Insights -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <!-- Bar Chart Card -->
              <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 h-[280px] sm:h-[320px] relative overflow-hidden card-animate">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Collections · {{ selectedYear }}</h3>
                  <div class="flex gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
                <div class="h-[180px] sm:h-[220px] w-full">
                  <canvas #loanChart="base-chart" baseChart
                    [data]="barChartData"
                    [options]="barChartOptions"
                    [type]="barChartType">
                  </canvas>
                </div>
              </div>

              <!-- Filter & Summary Card -->
              <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-[280px] sm:h-[320px] kpi-animate">
                <div>
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Analytics Filter</h3>
                  
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-1">
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

                <div class="pt-4 border-t border-gray-50 dark:border-gray-700/50">
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Filtered Interest</p>
                  <p class="text-3xl font-black text-indigo-600">₹{{ filteredTotalInterest | number:'1.0-0' }}</p>
                </div>
              </div>
            </div>

            <!-- Interest Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (loan of getFilteredLoans(); track loan.id; let i = $index) {
                <div class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
                  <div class="h-1.5" [ngClass]="loan.status === 'Inactive' ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'"></div>
                  <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                       <span class="text-xs font-bold text-blue-600 dark:text-blue-400 capitalize">{{ loan.interestRate }}% Interest p.m.</span>
                       <span class="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter" [ngClass]="loan.status === 'Inactive' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'">{{ loan.status || 'Active' }}</span>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors truncate mb-1" (click)="viewInterestDetails(loan.id!)">{{ loan.name }}</h3>
                    <p class="text-xs text-gray-500 font-bold mb-4">{{ loan.borrowerName }}</p>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Principal</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ loan.amount | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl text-right border border-gray-100/50 dark:border-gray-700/50">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Int.</p>
                        <p class="text-sm font-black text-indigo-600">₹{{ (loan.amount * loan.interestRate / 100) | number:'1.0-0' }}</p>
                      </div>
                    </div>
                    <div class="mb-4 bg-indigo-50/30 dark:bg-indigo-900/10 p-3 rounded-2xl flex justify-between items-center border border-indigo-100/30 dark:border-indigo-900/20">
                       <p class="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic opacity-70">Overall Interest</p>
                       <p class="text-sm font-black text-indigo-600 dark:text-indigo-400">₹{{ getTotalLoanInterest(loan) | number:'1.0-0' }}</p>
                    </div>
                    <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                       <button (click)="viewInterestDetails(loan.id!)" class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Loan Statement</button>
                       <div class="flex space-x-1">
                          <button (click)="toggleLoanStatus(loan)" class="p-2 text-gray-400 hover:text-orange-500 transition-all" [title]="loan.status === 'Inactive' ? 'Mark Active' : 'Mark Inactive'"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></button>
                          <button (click)="editInterest(loan.id!)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                          <button (click)="deleteInterest(loan.id!)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
        }

        <!-- ═══════════ CHITTI DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'chitti' && showChittiTab) {
          <div class="card-animate" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chitti Management</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ chittis.length }} active schemes</p>
              </div>
              <button (click)="goToCreateChit()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Scheme
              </button>
            </div>

            <!-- Analytics & Insights -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <!-- Bar Chart Card -->
              <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 h-[280px] sm:h-[320px] relative overflow-hidden card-animate">
                <div class="flex justify-between items-center mb-6">
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Collections · {{ chittiSelectedYear }}</h3>
                  <div class="flex gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style="animation-delay: 0.2s"></div>
                  </div>
                </div>
                <div class="h-[180px] sm:h-[220px] w-full">
                  <canvas #chittiChart="base-chart" baseChart
                    [data]="chittiBarChartData"
                    [options]="barChartOptions"
                    [type]="barChartType">
                  </canvas>
                </div>
              </div>

              <!-- Filter & Summary Card -->
              <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-[280px] sm:h-[320px] kpi-animate">
                <div>
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Analytics Filter</h3>
                  
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-1">
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

                <div class="pt-4 border-t border-gray-50 dark:border-gray-700/50">
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Filtered Collection</p>
                  <p class="text-3xl font-black text-pink-600">₹{{ filteredTotalChitti | number:'1.0-0' }}</p>
                </div>
              </div>
            </div>

            <!-- Chitti Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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
                        <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ chit.monthlyAmount | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl text-right border border-gray-100/50 dark:border-gray-700/50">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Members</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white">{{ getCustomerCount(chit.id!, 'chitti') }}</p>
                      </div>
                    </div>
                    <div class="mb-4 bg-purple-50/30 dark:bg-purple-900/10 p-3 rounded-2xl flex justify-between items-center border border-purple-100/30 dark:border-purple-900/20">
                       <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest italic opacity-70">Total Collection</p>
                       <p class="text-sm font-black text-purple-600 dark:text-purple-400">₹{{ getTotalChittiPaid(chit.id!) | number:'1.0-0' }}</p>
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
               <button (click)="openAddCustomerModal()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-purple-600 rounded-2xl hover:bg-purple-700 transition-all text-sm uppercase tracking-wide shadow-md hover:shadow-lg">
                 <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                 New Customer
               </button>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-8">
               <div class="relative">
                  <input type="text" [(ngModel)]="customerSearchQuery" placeholder="Search by name, phone or username..."
                         class="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm text-gray-900 dark:text-white">
                  <svg class="absolute left-4 top-4 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               @for (cust of getFilteredCustomers(); track cust.id; let i = $index) {
                  <div (click)="openEditCustomer(cust)" class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group cursor-pointer">
                     <div class="absolute top-4 right-4 flex items-center gap-1 transition-all">
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
                        <div class="min-w-0 pr-16">
                           <h4 class="font-black text-gray-900 dark:text-white truncate">{{ cust.name }}</h4>
                           <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ cust.username ? '@' + cust.username : 'Temporary' }}</p>
                        </div>
                     </div>
                     <div class="space-y-3">
                        <div class="flex items-center gap-2 text-xs">
                           <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                           <span class="text-gray-600 dark:text-gray-300 font-medium">{{ cust.phone }}</span>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700/50">
                           <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Type: <span class="text-purple-600">{{ cust.schemeType || 'Interest' }}</span></p>
                           <button (click)="viewCustomerAccounts(cust); $event.stopPropagation()" class="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline z-10 cursor-pointer relative">View Accounts →</button>
                        </div>
                     </div>
                  </div>
               }
            </div>
            
            @if (getFilteredCustomers().length === 0) {
               <div class="py-20 text-center opacity-60 italic text-gray-500 dark:text-gray-400">No customers matching your search.</div>
            }
          </div>
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
                                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3c1.268 0 2.39.234 3.41.659m-4.74 12.57c-1.285-.378-2.56-1.1-3.33-2.14m7.41 1.53A9.914 9.914 0 0021 12c0-5.523-4.477-10-10-10a10.003 10.003 0 00-6.73 2.6c1.176.4 2.223 1.096 3.033 1.983m0 0l2.224 2.224"/></svg>
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

                    <button (click)="backfillOwnership()" [disabled]="isSaving"
                       class="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
                       {{ isSaving ? 'Processing Migration...' : 'Migrate Unowned Data' }}
                    </button>
                 </div>
              </div>
           </div>
        }
      </main>

      <!-- Mobile Bottom Navigation -->
      <div class="fixed bottom-6 left-0 right-0 z-[100] sm:hidden flex justify-center pointer-events-none">
         <div class="bottom-nav-pill pointer-events-auto relative">
            
            <!-- Sliding Indicator Layer -->
            <div class="absolute inset-0 px-2.5 flex items-center pointer-events-none">
               <div class="relative w-full h-full flex items-center">
                  <div class="nav-indicator" 
                       [style.left]="activeMobileMenu === 'overview' ? '10%' : activeMobileMenu === 'interest' ? '30%' : activeMobileMenu === 'chitti' ? '50%' : activeMobileMenu === 'customers' ? '70%' : '90%'"
                       style="transform: translateX(-50%); width: 44px; height: 44px;">
                  </div>
               </div>
            </div>

            <!-- Overview -->
            <div (click)="scrollToTop(); activeMobileMenu = 'overview'; activeTab = 'overview'" 
                 class="nav-item-box">
               <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'overview' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
               </svg>
            </div>

            <!-- Interest (Loans) -->
            @if (showInterestTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'interest'; activeTab = 'interest'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'interest' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
               </div>
            }

            <!-- Chitties -->
            @if (showChittiTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'chitti'; activeTab = 'chitti'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'chitti' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
               </div>
            }

            <!-- Customers -->
            @if (showCustomersTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'customers'; activeTab = 'customers'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'customers' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
               </div>
            }

            <!-- Bills -->
            @if (showBillsTab) {
               <div (click)="scrollToTop(); activeMobileMenu = 'bills'; activeTab = 'bills'" 
                    class="nav-item-box">
                  <svg class="w-6 h-6 nav-icon" [class]="activeMobileMenu === 'bills' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
            }

         </div>
      </div>

      <!-- Multiple Accounts Modal -->
      @if (showAccountsModal) {
          <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
             <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div class="p-8">
                   <div class="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div>
                         <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Select Account</h3>
                         <p class="text-sm text-gray-500 font-medium">@if (selectedCustomerForAccounts?.name) { {{ selectedCustomerForAccounts!.name }} } @else { Customer }</p>
                      </div>
                      <button (click)="showAccountsModal = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all text-gray-500 hover:text-red-500">
                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                   </div>
                   
                   <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      @for (acc of customerAccountsList; track acc.id) {
                         <div (click)="acc.type === 'chitti' ? viewChitDetails(acc.id) : viewInterestDetails(acc.id); showAccountsModal = false;"
                              class="p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all group flex justify-between items-center">
                            <div>
                               <p class="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">{{ acc.info }}</p>
                               <h4 class="text-base font-black text-gray-900 dark:text-white mt-1">{{ acc.name }}</h4>
                            </div>
                            <div class="text-right">
                               <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ acc.amount | number:'1.0-0' }}</p>
                               <div class="mt-1 flex justify-end">
                                  <span class="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 group-hover:text-purple-600 dark:group-hover:text-purple-400 rounded-full transition-colors uppercase">View &rarr;</span>
                               </div>
                            </div>
                         </div>
                      }
                   </div>
                </div>
             </div>
          </div>
      }

      <!-- Add/Edit Customer Modal -->
      @if (showCustomerModal) {
         <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
               <div class="p-8">
                  <div class="flex justify-between items-center mb-8">
                     <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ isEditModal ? 'Update Customer' : 'Add Customer' }}</h3>
                        <p class="text-sm text-gray-500">{{ isEditModal ? 'Edit personal information' : 'Create a new customer profile' }}</p>
                     </div>
                     <button (click)="closeCustomerModal()" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:rotate-90 transition-all">
                        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <!-- Tab Switcher (Only in Add mode) -->
                  @if (!isEditModal) {
                    <div class="flex border-b border-gray-100 dark:border-gray-800 mb-6">
                      <button (click)="existingMode = false" class="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all" [class.text-purple-600]="!existingMode" [class.border-b-2]="!existingMode" [class.border-purple-600]="!existingMode" [class.text-gray-400]="existingMode">
                        + New Customer
                      </button>
                      <button (click)="existingMode = true" class="flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all" [class.text-purple-600]="existingMode" [class.border-b-2]="existingMode" [class.border-purple-600]="existingMode" [class.text-gray-400]="!existingMode">
                        Pick Existing
                      </button>
                    </div>
                  }

                  @if (existingMode && !isEditModal) {
                    <!-- Existing Customer Picker -->
                    <div class="space-y-4 max-h-[50vh] flex flex-col">
                       <input type="text" [(ngModel)]="pickerSearch" placeholder="Search by name or phone..." class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                       <div class="overflow-y-auto flex-1 space-y-2 custom-scrollbar pr-1">
                          @for (p of filteredPickerCustomers; track p.phone) {
                             <div (click)="selectFromPicker(p)" class="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-all">
                                <p class="font-bold text-gray-900 dark:text-white">{{ p.name }}</p>
                                <p class="text-xs text-gray-400">{{ p.phone }} {{ p.username ? '· @' + p.username : '' }}</p>
                             </div>
                          }
                       </div>
                    </div>
                  } @else {
                    <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                       <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Basic Information</p>
                       
                       <div>
                          <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                          <input type="text" formControlName="name" placeholder="John Doe"
                             class="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white">
                       </div>

                       <div>
                          <div class="flex items-center justify-between mb-2 px-1">
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest">Username (for login)</label>
                             @if (isCheckingUsername) {
                                <div class="flex items-center text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                                   <svg class="animate-spin h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                   Checking...
                                </div>
                             } @else if (usernameStatus === 'available') {
                                <div class="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded uppercase flex items-center">
                                   <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                   Available
                                </div>
                             } @else if (usernameStatus === 'taken') {
                                <div class="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase flex items-center">
                                   <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   Exists (Will Link)
                                </div>
                             }
                          </div>
                          <div class="relative">
                             <span class="absolute left-4 top-3.5 text-gray-400 font-bold">&#64;</span>
                             <input type="text" formControlName="username" (input)="onUsernameInput()" placeholder="johndoe"
                                class="w-full pl-8 pr-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white">
                          </div>
                       </div>


                       <div class="grid grid-cols-2 gap-4">
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Phone</label>
                             <input type="text" formControlName="phone"
                                class="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white">
                          </div>
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Email</label>
                             <input type="email" formControlName="email"
                                class="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white">
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-4">
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Scheme Type</label>
                             <select formControlName="schemeType" class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm appearance-none">
                                <option value="chitti">Chitti</option>
                                <option value="interest">Interest (Loan)</option>
                             </select>
                          </div>
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Target Scheme</label>
                             <select formControlName="schemeId" class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm appearance-none">
                                <option value="" disabled>Select Scheme</option>
                                @if (customerForm.get('schemeType')?.value === 'chitti') {
                                   @for (s of chittis; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                                } @else {
                                   @for (s of interests; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                                }
                             </select>
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-4">
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Joined Date</label>
                             <input type="date" formControlName="joinedDate"
                                class="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white text-sm">
                          </div>
                          <div>
                             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Status</label>
                             <select formControlName="status" class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white text-sm">
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                             </select>
                          </div>
                       </div>

                       <div class="flex gap-4 pt-6">
                          <button type="button" (click)="closeCustomerModal()" class="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-bold transition-all">Cancel</button>
                          <button type="submit" [disabled]="customerForm.invalid || isSaving" class="flex-2 py-4 bg-purple-600 text-white rounded-2xl font-black px-8 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all">
                             {{ isSaving ? 'Saving...' : (isEditModal ? 'Save Changes' : 'Create Profile') }}
                          </button>
                       </div>
                    </form>
                  }
               </div>
            </div>
         </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private billService = inject(BillService);
  private toast = inject(ToastService);
  public biometricService = inject(BiometricService);

  activeTab: 'chitti' | 'interest' | 'customers' | 'security' | 'bills' | 'overview' | '' = '';
  isDarkMode = false;
  activeMobileMenu: 'chitti' | 'interest' | 'customers' | 'security' | 'bills' | 'overview' | '' = '';
  currentUserProfile: UserProfile | null = null;

  get showInterestTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.interest !== false; }
  get showChittiTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.chitti !== false; }
  get showCustomersTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.customers !== false; }
  get showBillsTab() { return this.isSuperAdmin || this.currentUserProfile?.tabConfig?.bills !== false; }

  chittis: ChittiScheme[] = [];
  interests: InterestScheme[] = [];
  allCustomers: Customer[] = [];
  bills: Bill[] = [];
  billStats = {
    pendingAmount: 0,
    upcomingAmount: 0,
    dueTodayCount: 0,
    paidThisMonthAmount: 0
  };
  isSyncing = false;
  showBillForm = false;
  editingBill?: Bill;
  trackedServices: TrackedService[] = [];
  showServiceModal = false;
  trackedServiceForm: FormGroup;
  customerSearchQuery: string = '';
  loanSearchQuery: string = '';
  loanStatusFilter: 'Active' | 'Inactive' | 'All' = 'Active';
  isBiometricEnabled = false;

  @ViewChild('loanChart') loanChart?: BaseChartDirective;
  @ViewChild('chittiChart') chittiChart?: BaseChartDirective;

  // Analytics State
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = -1; // -1 for All
  availableYears: number[] = [new Date().getFullYear()];
  filteredTotalInterest: number = 0;

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
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(99, 102, 241, 0.8)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#a855f7');
          return gradient;
        },
        hoverBackgroundColor: '#4f46e5',
        borderRadius: 6,
        barThickness: 12
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
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(236, 72, 153, 0.8)';
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, '#ec4899');
          gradient.addColorStop(1, '#8b5cf6');
          return gradient;
        },
        hoverBackgroundColor: '#db2777',
        borderRadius: 6,
        barThickness: 12
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
  admins$: Observable<UserProfile[]> | null = null;
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
      tab_bills: [true]
    });
    this.trackedServiceForm = this.fb.group({
      serviceType: ['electricity', Validators.required],
      provider: ['', Validators.required],
      serviceNumber: ['', Validators.required]
    });
  }

  get totalGivenLoans() {
    return this.interests.reduce((sum, loan) => sum + loan.amount, 0);
  }
  get totalSettlement() {
    return this.interests.reduce((sum, loan) => {
      const settled = (loan.settlements || []).reduce((s, st) => s + st.amount, 0);
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
  get totalPendingInterest() {
    return this.interests.reduce((sum, loan) => {
       if (!loan.startDate) return sum;
       const start = new Date(loan.startDate);
       const now = new Date();
       if (isNaN(start.getTime())) return sum;
       
       const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
       const cappedMonths = Math.max(0, months);
       
       const principalPaid = (loan.settlements || []).reduce((s, st) => s + st.amount, 0);
       const balance = Math.max(0, loan.amount - principalPaid);
       const expectedInterest = balance * (loan.interestRate / 100) * cappedMonths;
       const paidInterest = (loan.interestCollections || []).reduce((s, c) => s + c.amount, 0);
       
       return sum + Math.max(0, expectedInterest - paidInterest);
    }, 0);
  }
  
  getFilteredLoans(): InterestScheme[] {
    return this.interests.filter(loan => {
      const matchesStatus = this.loanStatusFilter === 'All' || loan.status === this.loanStatusFilter || (!loan.status && this.loanStatusFilter === 'Active');
      const search = this.loanSearchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
                           loan.name.toLowerCase().includes(search) || 
                           (loan.borrowerName && loan.borrowerName.toLowerCase().includes(search)) ||
                           (loan.borrowerPhone && loan.borrowerPhone.includes(search));
      return matchesStatus && matchesSearch;
    });
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
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } } }
  };
  public overviewChartType: ChartType = 'line';
  public overviewChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  availableOverviewYears: number[] = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
  selectedOverviewYear: number = new Date().getFullYear();

  generateOverviewChart(year: number = this.selectedOverviewYear) {
    this.selectedOverviewYear = year;
    const labels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const givenLoans: number[] = new Array(12).fill(0);
    const settlements: number[] = new Array(12).fill(0);
    const interestCollected: number[] = new Array(12).fill(0);

    this.interests.forEach(loan => {
      // Given loans
      if (loan.startDate) {
         const sd = new Date(loan.startDate);
         if (sd.getFullYear() === year) givenLoans[sd.getMonth()] += loan.amount;
      }
      
      // Settlements
      (loan.settlements || []).forEach(s => {
         const sd = new Date(s.date);
         if (sd.getFullYear() === year) settlements[sd.getMonth()] += s.amount;
      });

      // Interest Collected
      (loan.interestCollections || []).forEach(c => {
         const cd = new Date(c.date);
         if (cd.getFullYear() === year) interestCollected[cd.getMonth()] += c.amount;
      });
    });

    this.overviewChartData = {
      labels,
      datasets: [
        { data: givenLoans, label: 'Given Loans', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
        { data: settlements, label: 'Settlements', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
        { data: interestCollected, label: 'Interest Collected', borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4 }
      ]
    };
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

  loadAdmins() {
    const adminQuery = query(collection(this.firestore, 'users'), where('role', '==', 'admin'));
    this.admins$ = collectionData(adminQuery) as Observable<UserProfile[]>;
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
        const { username, name, phone, password, address, idType, idValue, tab_interest, tab_chitti, tab_customers, tab_bills } = this.adminForm.getRawValue();
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
        const tabConfig = { interest: tab_interest, chitti: tab_chitti, customers: tab_customers, bills: tab_bills };
        
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
      tab_bills: admin.tabConfig?.bills !== false
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
        });
      }
    });
  }

  calculateBillStats() {
    const now = new Date();
    // Reset hours to compare dates correctly
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    this.billStats = {
      pendingAmount: 0,
      upcomingAmount: 0,
      dueTodayCount: 0,
      paidThisMonthAmount: 0
    };

    this.bills.forEach(bill => {
      const bDate = new Date(bill.dueDate);
      const dueDate = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());
      
      if (bill.status === 'pending') {
        this.billStats.pendingAmount += bill.amount;
        if (bill.dueDate === todayStr) {
          this.billStats.dueTodayCount++;
        }
        if (dueDate >= today && dueDate <= sevenDaysLater) {
          this.billStats.upcomingAmount += bill.amount;
        }
      } else if (bill.status === 'completed') {
        if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
          this.billStats.paidThisMonthAmount += bill.amount;
        }
      }
    });
  }

  handleBillFilters(filters: any) {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    if (!profile.uid) return;
    
    this.billService.getBillsByFilters(profile.uid, filters).subscribe(data => {
      this.bills = data;
      // Do not recalculate stats on filter, keep them based on total data? 
      // Usually dashboard stats are overall, but list is filtered.
    });
  }

  openBillForm(bill?: Bill) {
    this.editingBill = bill;
    this.showBillForm = true;
  }

  closeBillForm() {
    this.showBillForm = false;
    this.editingBill = undefined;
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

  async handleUpdateBillStatus(event: {bill: Bill, status: string}) {
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
    this.authService.userProfile$.subscribe(profile => {
      if (!profile?.uid) return;
      this.billService.syncBillsFromServers(profile.uid).subscribe({
        next: (async (resPromise) => {
          const res = await resPromise;
          if (res.count > 0) {
            this.toast.success(`Synced ${res.count} new bills from providers.`);
          } else {
            this.toast.info('All bills are already up to date.');
          }
          this.isSyncing = false;
        }),
        error: () => {
          this.toast.error('Sync failed.');
          this.isSyncing = false;
        }
      });
    });
  }

  async handleRegisterService() {
     if (this.trackedServiceForm.invalid) return;
     this.isSaving = true;
     
     const profile = await new Promise<any>(res => this.authService.userProfile$.subscribe(res));
     if (!profile?.uid) return;

     try {
        const data = this.trackedServiceForm.value;
        await this.billService.registerService({ ...data, adminUid: profile.uid });
        this.toast.success('Service number linked successfully!');
        this.showServiceModal = false;
        this.trackedServiceForm.reset({ serviceType: 'electricity' });
     } catch (e) {
        this.toast.error('Failed to link service.');
     } finally {
        this.isSaving = false;
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
    if (!this.customerSearchQuery || !this.customerSearchQuery.trim()) return this.allCustomers;
    const q = this.customerSearchQuery.toLowerCase();
    return this.allCustomers.filter(c =>
      (c.name?.toLowerCase().includes(q)) ||
      (c.phone?.includes(q)) ||
      (c.username?.toLowerCase().includes(q))
    );
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

    if (accounts.length === 0) {
       this.toast.error('No active loan or chitti accounts found for this customer.');
    } else if (accounts.length === 1) {
       // Direct navigation
       if (accounts[0].type === 'chitti') this.viewChitDetails(accounts[0].id);
       else this.viewInterestDetails(accounts[0].id);
    } else {
       // Multiple - show modal
       this.customerAccountsList = accounts;
       this.selectedCustomerForAccounts = cust;
       this.showAccountsModal = true;
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
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.editingCustomer = null;
    this.isSaving = false;
    this.usernameStatus = 'none';
    this.isCheckingUsername = false;
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
      const success = await this.biometricService.getCredentials();
      if (success) {
        this.isBiometricEnabled = true;
        this.biometricService.setBiometricEnabled(true);
        // Important: We need a password to save for future biometric logins.
        // If they just enabled it, we should ask them to log in again or at least notify them.
        // For now, we'll wait for the next manual login to save credentials via AuthService.
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
          }
       } catch (e) {
          this.toast.error('Failed to update password.');
       } finally {
          this.isSaving = false;
       }
    }
  }
}
