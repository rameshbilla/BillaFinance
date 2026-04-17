import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { InterestService, InterestScheme } from '../services/interest.service';
import { CustomerService, Customer } from '../services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <style>
      @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      .card-animate { animation: fadeInUp 0.5s ease both; }
      .kpi-animate { animation: slideInRight 0.4s ease both; }
      .interest-card { animation: fadeInUp 0.5s ease both; }
      /* Hover: translate + shadow only — no competing animation */
      .scheme-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .scheme-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139,92,246,0.18), 0 8px 16px rgba(0,0,0,0.08); }
      .tab-active { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
      .dark .tab-active { background: #374151; }
    </style>

    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <!-- Top Navigation -->
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">FinServe Admin</span>
            </div>
            <div class="flex space-x-3 items-center" *ngIf="authService.userProfile$ | async as profile">
              <span class="text-gray-600 dark:text-gray-300 font-medium text-sm hidden sm:block">Welcome, {{ profile.displayName || 'Admin' }}</span>
              <button (click)="logout()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all text-sm font-bold">Log out</button>
            </div>
            <div class="flex space-x-3 items-center" *ngIf="!(authService.userProfile$ | async)">
              <span class="text-gray-600 dark:text-gray-300 font-medium text-sm hidden sm:block">Welcome, Admin</span>
              <button (click)="logout()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all text-sm font-bold">Log out</button>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Tab Switcher -->
        <div class="flex p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl w-full sm:max-w-xs mb-8 relative gap-1">
          <button (click)="activeTab = 'chitti'"
                  [class.tab-active]="activeTab === 'chitti'"
                  class="flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 text-gray-700 dark:text-gray-200"
                  [class.text-purple-700]="activeTab === 'chitti'"
                  [class.dark:text-purple-300]="activeTab === 'chitti'">
            <span class="flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Chitti
            </span>
          </button>
          <button (click)="activeTab = 'interest'"
                  [class.tab-active]="activeTab === 'interest'"
                  class="flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 text-gray-700 dark:text-gray-200"
                  [class.text-blue-700]="activeTab === 'interest'"
                  [class.dark:text-blue-300]="activeTab === 'interest'">
            <span class="flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Interest
            </span>
          </button>
        </div>

        <!-- ═══════════ CHITTI DASHBOARD ═══════════ -->
        @if (activeTab === 'chitti') {
          <div class="card-animate" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white">Chitti Management</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ chittis.length }} active schemes</p>
              </div>
              <button (click)="goToCreateChit()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Chitti
              </button>
            </div>

            <!-- Current Month KPIs -->
            <div class="grid grid-cols-2 gap-3 sm:gap-6 mb-10">
              <div class="kpi-animate bg-gradient-to-br from-green-500 to-emerald-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-green-500/20 text-white" style="animation-delay:0.1s">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-green-100">Collected <span class="hidden lg:inline">· {{ currentMonthName }}</span></span>
                  <div class="p-1.5 sm:p-2 bg-white/10 rounded-xl hidden sm:block"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                </div>
                <p class="text-lg sm:text-3xl font-black">₹{{ totalCollectedThisMonth | number:'1.0-0' }}</p>
              </div>
              <div class="kpi-animate bg-gradient-to-br from-pink-500 to-rose-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-pink-500/20 text-white" style="animation-delay:0.18s">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-pink-100">Pending <span class="hidden lg:inline">· {{ currentMonthName }}</span></span>
                  <div class="p-1.5 sm:p-2 bg-white/10 rounded-xl hidden sm:block"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                </div>
                <p class="text-lg sm:text-3xl font-black">₹{{ totalPendingThisMonth | number:'1.0-0' }}</p>
              </div>
            </div>

            <!-- Chitti Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (chit of chittis; track chit.id; let i = $index) {
                <div class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
                  <!-- Card accent bar -->
                  <div class="h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
                  <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 transition-colors truncate max-w-[160px]" (click)="viewChitDetails(chit.id!)">{{ chit.name }}</h3>
                        <p class="text-xs text-gray-400 font-medium mt-0.5">{{ chit.tenure }} month tenure</p>
                      </div>
                      <div class="flex space-x-1">
                        <button (click)="editChit(chit.id!)" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button (click)="deleteChit(chit.id!)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Stats row -->
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                        <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                        <span class="text-xs font-bold text-purple-700 dark:text-purple-300">{{ getCustomerCount(chit.id!, 'chitti') }} customers</span>
                      </div>
                      <span class="text-base font-black text-gray-900 dark:text-white">₹{{ chit.monthlyAmount | number:'1.0-0' }}<span class="text-xs font-medium text-gray-400">/mo</span></span>
                    </div>

                    <!-- Completed months badge -->
                    <div class="flex items-center gap-2 mb-4">
                      <div class="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                        <svg class="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span class="text-xs font-bold text-indigo-700 dark:text-indigo-300">{{ getCompletedMonths(chit) }}/{{ chit.tenure }} months done</span>
                      </div>
                    </div>

                    <!-- Collected / Pending -->
                    <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <div class="bg-green-50 dark:bg-green-900/10 rounded-2xl p-3">
                        <p class="text-[9px] font-black text-green-600 uppercase tracking-widest">Collected</p>
                        <p class="text-sm font-black text-green-700 dark:text-green-400 mt-0.5">₹{{ getChittiStats(chit.id!).collected | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-pink-50 dark:bg-pink-900/10 rounded-2xl p-3 text-right">
                        <p class="text-[9px] font-black text-pink-600 uppercase tracking-widest">Pending</p>
                        <p class="text-sm font-black text-pink-700 dark:text-pink-400 mt-0.5">₹{{ getChittiStats(chit.id!).pending | number:'1.0-0' }}</p>
                      </div>
                    </div>

                    <div class="pt-4 mt-2 flex justify-between items-center">
                      <button (click)="viewChitDetails(chit.id!)" class="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors flex items-center gap-1">
                        Manage Customers
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                      </button>
                      <span class="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">₹{{ chit.totalValue | number:'1.0-0' }} total</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            @if (chittis.length === 0) {
              <div class="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div class="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">No Chitti Schemes yet.</p>
                <p class="text-sm text-gray-400 mt-1">Create your first scheme to get started.</p>
              </div>
            }
          </div>

        } @else {
          <!-- ═══════════ INTEREST DASHBOARD ═══════════ -->
          <div class="card-animate" style="animation-delay:0.05s">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white">Interest Management</h2>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ interests.length }} active loan schemes</p>
              </div>
              <button (click)="goToCreateInterest()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                New Loan
              </button>
            </div>

            <!-- Interest KPI Banner -->
            <div class="grid grid-cols-2 gap-3 sm:gap-6 mb-10">
              <div class="kpi-animate bg-gradient-to-br from-blue-500 to-indigo-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white" style="animation-delay:0.1s">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-100">Interest <span class="hidden lg:inline">· {{ currentMonthName }}</span></span>
                  <div class="p-1.5 sm:p-2 bg-white/10 rounded-xl hidden sm:block"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></div>
                </div>
                <p class="text-lg sm:text-3xl font-black">₹{{ totalInterestCollectedThisMonth | number:'1.0-0' }}</p>
              </div>
              <div class="kpi-animate bg-gradient-to-br from-slate-700 to-slate-900 p-4 sm:p-6 rounded-2xl shadow-lg text-white" style="animation-delay:0.18s">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300">Active Loans</span>
                  <div class="p-1.5 sm:p-2 bg-white/10 rounded-xl hidden sm:block"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                </div>
                <p class="text-lg sm:text-3xl font-black">{{ interests.length }}</p>
              </div>
            </div>

            <!-- Interest Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (interest of interests; track interest.id; let i = $index) {
                <div class="interest-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
                  <!-- Blue accent bar -->
                  <div class="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
                  <div class="p-5">
                    <!-- Header -->
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-base font-black text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors leading-tight" (click)="viewInterestDetails(interest.id!)">
                          {{ interest.borrowerName || 'Unknown' }}
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ interest.name }}</p>
                      </div>
                      <div class="flex items-center gap-1 ml-2 shrink-0">
                        <!-- Rate badge -->
                        <span class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-full">{{ interest.interestRate }}%</span>
                        <button (click)="editInterest(interest.id!)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button (click)="deleteInterest(interest.id!)" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Start Date pill -->
                    <div class="flex items-center gap-1.5 mb-4">
                      <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span class="text-xs text-gray-400 font-medium">Started:</span>
                      <span class="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{{ interest.startDate || '—' }}</span>
                    </div>

                    <!-- 2x2 KPI grid -->
                    <div class="grid grid-cols-2 gap-2 mb-3">
                      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3">
                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Principal</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white mt-0.5">₹{{ interest.amount | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-3 text-right">
                        <p class="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Monthly Int.</p>
                        <p class="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-0.5">₹{{ getMonthlyInterest(interest) | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-3">
                        <p class="text-[9px] font-black text-orange-500 uppercase tracking-tight">Pending (Mo)</p>
                        <p class="text-xs font-black text-orange-700 dark:text-orange-400 mt-0.5">₹{{ getPendingMonth(interest) | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl p-3 text-right">
                        <p class="text-[9px] font-black text-red-500 uppercase tracking-tight">Pending (All)</p>
                        <p class="text-xs font-black text-red-700 dark:text-red-400 mt-0.5">₹{{ getOverallPending(interest) | number:'1.0-0' }}</p>
                      </div>
                    </div>

                    <!-- Balance footer -->
                    <div class="pt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50">
                      <div>
                        <p class="text-[9px] text-gray-400 uppercase tracking-widest font-black">Balance</p>
                        <p class="text-sm font-black text-red-600 dark:text-red-400">₹{{ getInterestBalance(interest) | number:'1.0-0' }}</p>
                      </div>
                      <button (click)="viewInterestDetails(interest.id!)" class="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
                        Manage →
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
            @if (interests.length === 0) {
              <div class="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400 font-medium">No Interest Schemes yet.</p>
                <p class="text-sm text-gray-400 mt-1">Create a new loan scheme to get started.</p>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);

  activeTab: 'chitti' | 'interest' = 'chitti';
  
  chittis: ChittiScheme[] = [];
  interests: InterestScheme[] = [];
  allCustomers: Customer[] = [];

  ngOnInit() {
    this.chittiService.getChittis().subscribe(data => this.chittis = data);
    this.interestService.getInterests().subscribe(data => this.interests = data);
    this.customerService.getAllCustomers().subscribe(data => this.allCustomers = data);
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

  /**
   * Returns the number of months elapsed since the earliest customer joined this scheme,
   * capped at the scheme's tenure.
   */
  getCompletedMonths(chit: ChittiScheme): number {
    const customers = this.allCustomers.filter(c => c.schemeId === chit.id && c.schemeType === 'chitti');
    if (customers.length === 0) return 0;
    // Use the earliest joined date
    const dates = customers
      .filter(c => !!c.joinedDate)
      .map(c => new Date(c.joinedDate!).getTime());
    if (dates.length === 0) return 0;
    const earliest = new Date(Math.min(...dates));
    const now = new Date();
    const months = (now.getFullYear() - earliest.getFullYear()) * 12 + (now.getMonth() - earliest.getMonth());
    return Math.min(Math.max(0, months), chit.tenure);
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
       // Collected this month
       (cust.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
             collected += p.amount;
          }
       });

       // Pending (cumulative)
       if (cust.joinedDate) {
          const joined = new Date(cust.joinedDate);
          let monthsCount = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1;
          const totalExpected = monthsCount * scheme.monthlyAmount;
          const totalPaid = (cust.payments || []).reduce((sum, p) => sum + p.amount, 0);
          pending += Math.max(0, totalExpected - totalPaid);
       }
    });

    return { collected, pending };
  }

  getCustomerCount(schemeId: string, type: 'chitti'): number {
     return this.allCustomers.filter(c => c.schemeId === schemeId && c.schemeType === type).length;
  }

  getInterestBalance(interest: InterestScheme): number {
     if (!interest.settlements) return interest.amount;
     const settled = interest.settlements.reduce((sum, s) => sum + s.amount, 0);
     return Math.max(0, interest.amount - settled);
  }

  getMonthlyInterest(interest: InterestScheme): number {
    const balance = this.getInterestBalance(interest);
    return (balance * (interest.interestRate || 0)) / 100;
  }

  getOverallPending(interest: InterestScheme): number {
    if (!interest || !interest.startDate) return 0;
    const start = new Date(interest.startDate);
    const today = new Date();
    let totalDue = 0;
    let iterDate = new Date(start);
    iterDate.setMonth(iterDate.getMonth() + 1);
    
    while (iterDate <= today) {
      const periodStart = new Date(iterDate);
      periodStart.setMonth(periodStart.getMonth() - 1);
      const settlementsBefore = (interest.settlements || [])
        .filter(s => new Date(s.date) < periodStart);
      const settledAmount = settlementsBefore.reduce((sum, s) => sum + s.amount, 0);
      const balance = Math.max(0, interest.amount - settledAmount);
      totalDue += (balance * (interest.interestRate / 100));
      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    const collectedTotal = (interest.interestCollections || []).reduce((sum, c) => sum + c.amount, 0);
    return Math.max(0, totalDue - collectedTotal);
  }

  getPendingMonth(interest: InterestScheme): number {
    const monthlyDue = this.getMonthlyInterest(interest);
    const collectedThisMonth = this.getInterestStats(interest).collectedMonth;
    return Math.max(0, monthlyDue - collectedThisMonth);
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

  getInterestStats(interest: InterestScheme): { collectedMonth: number, collectedTotal: number } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let collectedMonth = 0;
    let collectedTotal = 0;

    (interest.interestCollections || []).forEach(c => {
       const cDate = new Date(c.date);
       if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear) {
          collectedMonth += c.amount;
       }
       collectedTotal += c.amount;
    });

    return { collectedMonth, collectedTotal };
  }

  // --- Chitti Navigation & Actions ---
  goToCreateChit() {
    this.router.navigate(['/admin/create-chit']);
  }
  editChit(id: string) {
    this.router.navigate(['/admin/edit-chit', id]);
  }
  viewChitDetails(id: string) {
    this.router.navigate(['/admin/chit', id]);
  }
  async deleteChit(id: string) {
    if (confirm('Are you sure you want to permanently delete this Chitti scheme?')) {
      try {
        await this.chittiService.deleteChitti(id);
        this.toast.success('Chitti scheme deleted.');
      } catch (e) {
        this.toast.error('Failed to delete scheme.');
      }
    }
  }

  // --- Interest Navigation & Actions ---
  goToCreateInterest() {
    this.router.navigate(['/admin/create-interest']);
  }
  editInterest(id: string) {
    this.router.navigate(['/admin/edit-interest', id]);
  }
  viewInterestDetails(id: string) {
    this.router.navigate(['/admin/interest', id]);
  }
  async deleteInterest(id: string) {
    if (confirm('Are you sure you want to permanently delete this Interest scheme?')) {
      try {
        await this.interestService.deleteInterest(id);
        this.toast.success('Interest scheme deleted.');
      } catch (e) {
        this.toast.error('Failed to delete scheme.');
      }
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
