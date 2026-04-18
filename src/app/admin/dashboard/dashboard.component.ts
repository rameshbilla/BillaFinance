import { Component, inject, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
          <button *ngIf="!isSuperAdmin" (click)="activeTab = 'chitti'; activeMobileMenu = 'chitti'"
                  [class.tab-active]="activeTab === 'chitti'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            CHITTI
          </button>
          <button *ngIf="!isSuperAdmin" (click)="activeTab = 'interest'; activeMobileMenu = 'interest'"
                  [class.tab-active]="activeTab === 'interest'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            LOANS
          </button>
          <button *ngIf="!isSuperAdmin" (click)="activeTab = 'customers'; activeMobileMenu = 'customers'"
                  [class.tab-active]="activeTab === 'customers'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            CUSTOMERS
          </button>
          <button (click)="activeTab = 'security'; activeMobileMenu = 'security'"
                  [class.tab-active]="activeTab === 'security'"
                  class="flex-1 py-2 px-4 text-xs font-black rounded-xl transition-all duration-500 text-gray-500 dark:text-gray-400 z-10">
            SECURITY
          </button>
        </div>

        <!-- ═══════════ SUPER ADMIN VIEW ═══════════ -->
        @if (isSuperAdmin && activeTab !== 'security') {
           <div class="space-y-10 card-animate">
              <!-- Admin Creation Form -->
              <section class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8">
                 <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Register Admin Member</h2>
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
                             class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-black">
                       </div>
                       <div>
                          <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                          <input type="tel" formControlName="phone" placeholder="10 Digit Number"
                             class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                       </div>
                       <div>
                          <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Default Password</label>
                          <input type="text" readonly value="admin123"
                             class="w-full px-5 py-4 rounded-2xl bg-gray-100/50 dark:bg-gray-800/30 border-none text-gray-400 font-mono text-xs cursor-not-allowed">
                       </div>
                    </div>
                    <div class="flex justify-end pt-4">
                       <button type="submit" [disabled]="adminForm.invalid || isSaving"
                          class="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
                          {{ isSaving ? 'Establishing Account...' : 'Finalize Admin Access' }}
                       </button>
                    </div>
                 </form>
              </section>

              <!-- Admin Members List -->
              <section class="space-y-4">
                 <h3 class="text-xl font-bold text-gray-900 dark:text-white px-2">Active Administrative Staff</h3>
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (admin of admins$ | async; track admin.uid) {
                       <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
                          <div>
                             <p class="font-black text-gray-900 dark:text-white leading-tight">{{ admin.displayName }}</p>
                             <p class="text-xs text-indigo-500 font-bold mt-1 tracking-wider">&#64;{{ admin.username }}</p>
                             <p class="text-[9px] text-gray-400 mt-3 font-bold uppercase tracking-widest">{{ admin.phone }}</p>
                          </div>
                          <button (click)="removeAdminMember(admin)" class="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                             <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
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

        <!-- ═══════════ CHITTI DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'chitti') {
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

            <!-- Chitti KPI Banner -->
            <div class="grid grid-cols-2 gap-3 mb-8">
              <div class="kpi-animate bg-gradient-to-br from-green-500 to-emerald-600 p-3 sm:p-4 rounded-xl shadow-lg shadow-green-500/20 text-white" style="animation-delay:0.1s">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-bold uppercase tracking-widest text-green-100">Collected <span class="hidden lg:inline">· {{ currentMonthName }}</span></span>
                </div>
                <p class="text-lg sm:text-2xl font-black">₹{{ totalCollectedThisMonth | number:'1.0-0' }}</p>
              </div>
              <div class="kpi-animate bg-gradient-to-br from-pink-500 to-rose-600 p-3 sm:p-4 rounded-xl shadow-lg shadow-pink-500/20 text-white" style="animation-delay:0.18s">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-bold uppercase tracking-widest text-pink-100">Pending <span class="hidden lg:inline">· {{ currentMonthName }}</span></span>
                </div>
                <p class="text-lg sm:text-2xl font-black">₹{{ totalPendingThisMonth | number:'1.0-0' }}</p>
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
                    <div class="grid grid-cols-2 gap-3 mb-4">
                      <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ chit.monthlyAmount | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl text-right">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Members</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white">{{ getCustomerCount(chit.id!, 'chitti') }}</p>
                      </div>
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

        <!-- ═══════════ INTEREST DASHBOARD (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'interest') {
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

            <!-- Interest KPI Banner -->
            <div class="grid grid-cols-2 gap-3 mb-8">
              <div class="kpi-animate bg-gradient-to-br from-blue-500 to-indigo-600 p-3 sm:p-4 rounded-xl shadow-lg shadow-blue-500/20 text-white" style="animation-delay:0.1s">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-bold uppercase tracking-widest text-blue-100">Interest Collected</span>
                </div>
                <p class="text-lg sm:text-2xl font-black">₹{{ totalInterestCollectedThisMonth | number:'1.0-0' }}</p>
              </div>
              <div class="kpi-animate bg-gradient-to-br from-slate-700 to-slate-900 p-3 sm:p-4 rounded-xl shadow-lg text-white" style="animation-delay:0.18s">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-bold uppercase tracking-widest text-slate-300">Active Loans</span>
                </div>
                <p class="text-lg sm:text-2xl font-black">{{ interests.length }}</p>
              </div>
            </div>

            <!-- Interest Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              @for (interest of interests; track interest.id; let i = $index) {
                <div class="interest-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                     [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
                  <div class="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
                  <div class="p-5">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-base font-black text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 transition-colors leading-tight" (click)="viewInterestDetails(interest.id!)">
                          {{ interest.borrowerName || 'Unknown' }}
                        </h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ interest.name }}</p>
                      </div>
                      <div class="flex items-center gap-1 ml-2 shrink-0 text-xs font-black px-2 py-0.5 bg-indigo-100 rounded-full text-indigo-600">{{ interest.interestRate }}%</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3">
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Principal</p>
                        <p class="text-sm font-black text-gray-900 dark:text-white mt-0.5">₹{{ interest.amount | number:'1.0-0' }}</p>
                      </div>
                      <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl p-3 text-right">
                        <p class="text-[9px] font-bold text-red-500 uppercase tracking-widest">Balance</p>
                        <p class="text-sm font-black text-red-600 dark:text-red-400 mt-0.5">₹{{ getInterestBalance(interest) | number:'1.0-0' }}</p>
                      </div>
                    </div>
                    <div class="pt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50">
                      <button (click)="viewInterestDetails(interest.id!)" class="px-6 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-md transition-all">Manage Account</button>
                      <div class="flex space-x-1">
                         <button (click)="editInterest(interest.id!)" class="p-1.5 text-gray-400 hover:text-blue-600 transition-all">
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                         </button>
                         <button (click)="deleteInterest(interest.id!)" class="p-1.5 text-gray-400 hover:text-red-600 transition-all">
                            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ═══════════ CUSTOMERS DIRECTORY (Admin Only) ═══════════ -->
        @if (!isSuperAdmin && activeTab === 'customers') {
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
                  <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
                     <div class="absolute top-4 right-4 flex items-center gap-1 transition-all">
                        <button (click)="openEditCustomer(cust)" class="p-2 text-gray-400 hover:text-purple-600 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 transition-colors" title="Edit">
                           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="deleteCustomer(cust.id!)" class="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 transition-colors" title="Delete">
                           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                     <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-lg shadow-inner">
                           {{ cust.name?.charAt(0) || '?' }}
                        </div>
                        <div class="min-w-0">
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
                           <button (click)="cust.schemeType === 'chitti' ? viewChitDetails(cust.schemeId) : viewInterestDetails(cust.schemeId)" class="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Account →</button>
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
                       <input type="password" formControlName="newPassword" placeholder="Minimum 6 characters"
                          class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                    </div>
                    <div>
                       <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
                       <input type="password" formControlName="confirmPassword" placeholder="Repeat new password"
                          class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                    </div>
                    <button type="submit" [disabled]="passwordForm.invalid || isSaving"
                       class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
                       {{ isSaving ? 'Updating...' : 'Change Password' }}
                    </button>
                 </form>
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
                       [style.left]="activeMobileMenu === 'chitti' ? '16.66%' : activeMobileMenu === 'interest' ? '50%' : '83.33%'"
                       style="transform: translateX(-50%)">
                  </div>
               </div>
            </div>

            <!-- Chitties -->
            <div (click)="scrollToTop(); activeMobileMenu = 'chitti'; activeTab = 'chitti'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'chitti' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
            </div>

            <!-- Interest (Loans) -->
            <div (click)="scrollToTop(); activeMobileMenu = 'interest'; activeTab = 'interest'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'interest' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
               </svg>
            </div>

            <!-- Customers -->
            <div (click)="scrollToTop(); activeMobileMenu = 'customers'; activeTab = 'customers'" 
                 class="nav-item-box">
               <svg class="w-7 h-7 nav-icon" [class]="activeMobileMenu === 'customers' ? 'icon-active' : 'icon-inactive'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
               </svg>
            </div>

         </div>
      </div>

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
                          <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Username (for login)</label>
                          <div class="relative">
                             <span class="absolute left-4 top-3.5 text-gray-400 font-bold">&#64;</span>
                             <input type="text" formControlName="username" placeholder="johndoe"
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
  private toast = inject(ToastService);

  activeTab: 'chitti' | 'interest' | 'customers' | 'security' = 'chitti';
  isDarkMode = false;
  activeMobileMenu: 'chitti' | 'interest' | 'customers' | 'security' = 'chitti';

  chittis: ChittiScheme[] = [];
  interests: InterestScheme[] = [];
  allCustomers: Customer[] = [];
  customerSearchQuery: string = '';

  editingCustomer: Customer | null = null;
  customerForm: FormGroup;
  isSaving = false;

  showCustomerModal = false;
  isEditModal = false;
  existingMode = false;
  pickerSearch = '';
  isSuperAdmin = false;
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
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  ngOnInit() {
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

  async createAdminMember() {
    if (this.adminForm.valid) {
      this.isSaving = true;
      try {
        const { username, name, phone } = this.adminForm.value;
        const exists = await this.authService.checkUserExists(username);
        if (exists) {
          this.toast.error('Username or Identity already exists.');
          return;
        }

        await this.authService.provisionUser('admin', username, name, phone, 'admin123');
        this.toast.success(`Admin @${username} provisioned successfully!`);
        this.adminForm.reset();
      } catch (e: any) {
        this.toast.error(e.message || 'Failed to provision admin.');
      } finally {
        this.isSaving = false;
      }
    }
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

  loadData() {
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

  // --- Customer Operations ---
  openAddCustomerModal() {
    this.isEditModal = false;
    this.editingCustomer = null;
    this.existingMode = false;
    this.pickerSearch = '';
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
        if (this.isEditModal && this.editingCustomer?.id) {
           await this.customerService.updateCustomer(this.editingCustomer.id, val);
           this.toast.success('Customer updated!');
        } else {
           await this.customerService.addCustomer(val);
           this.toast.success('Customer created!');
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
