import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { InterestService } from '../services/interest.service';
import { CustomerService, Customer, CustomerPayment } from '../services/customer.service';
import { numberToWords } from '../../shared/utils/number-to-words.util';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-chit-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 pb-20 sm:pb-0 relative overflow-x-hidden">
      <nav class="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 animate-fade-down">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-20 items-center">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-purple-600 transition-all active:scale-95">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h1 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{{ scheme?.name || 'Loading...' }}</h1>
                <p class="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-1">Chitti Scheme details</p>
              </div>
            </div>
            <button (click)="openAddCustomerModal()" class="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Enrol Member
            </button>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up delay-100">
        @if (scheme) {
          <!-- Stats Summary Grid -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div class="glass-card p-6 rounded-[2.5rem] border-purple-500/10 animate-fade-up delay-100 hover:-translate-y-1 transition-all duration-300 animate-pulse-glow group">
              <div class="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p class="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 leading-none">Total Value</p>
              <p class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter kpi-number">₹{{ scheme.totalValue | number:'1.0-0' }}</p>
            </div>
            <div class="glass-card p-6 rounded-[2.5rem] border-blue-500/10 animate-fade-up delay-200 hover:-translate-y-1 transition-all duration-300 group">
              <div class="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Monthly EMI</p>
              <p class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter kpi-number">₹{{ scheme.monthlyAmount | number:'1.0-0' }}</p>
            </div>
            <div class="glass-card p-6 rounded-[2.5rem] border-pink-500/10 animate-fade-up delay-300 hover:-translate-y-1 transition-all duration-300 group">
              <div class="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500 mb-3 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <p class="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1 leading-none">Members</p>
              <p class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter kpi-number">{{ customers.length }} / {{ scheme.capacity }}</p>
            </div>
            <div class="glass-card p-6 rounded-[2.5rem] border-green-500/10 animate-fade-up delay-400 hover:-translate-y-1 transition-all duration-300 group">
              <div class="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p class="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 leading-none">Tenure</p>
              <p class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter kpi-number">{{ scheme.tenure }} Mo</p>
            </div>
          </div>

        <!-- Scheme-Specific Monthly Snapshot -->
        <div class="grid grid-cols-2 gap-3 sm:gap-6 mb-8">
           <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center animate-fade-up delay-500 hover:shadow-md transition-all group">
              <div class="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2 sm:mb-0 sm:mr-4 animate-pulse-glow-green group-hover:scale-110 transition-transform">
                 <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                 <p class="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Collected <span class="hidden md:inline">({{ currentMonthName }})</span></p>
                 <p class="text-base sm:text-xl font-black text-gray-900 dark:text-white">₹{{ schemeCollectedThisMonth | number:'1.0-0' }}</p>
              </div>
           </div>
           <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center animate-fade-up delay-600 hover:shadow-md transition-all group">
              <div class="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-2 sm:mb-0 sm:mr-4 animate-pulse-glow-pink group-hover:scale-110 transition-transform">
                 <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                 <p class="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pending <span class="hidden md:inline">({{ currentMonthName }})</span></p>
                 <p class="text-base sm:text-xl font-black text-pink-600">₹{{ schemePendingThisMonth | number:'1.0-0' }}</p>
              </div>
           </div>
        </div>

          <!-- Enrolled Customers List -->
          <div class="flex items-center gap-3 mb-6 animate-fade-up delay-700">
             <div class="h-6 w-1.5 bg-gradient-to-b from-purple-600 to-pink-500 rounded-full animate-pulse"></div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Enrolled Members</h3>
             <span class="ml-auto px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-black rounded-full animate-badge-pop">{{ filteredCustomers.length }} Active</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (cust of filteredCustomers; track cust.id; let i = $index) {
              <div class="glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden animate-fade-up"
                   [style.animation-delay]="(i * 80) + 'ms'">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-500/3 rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                
                <div class="flex justify-between items-start mb-6">
                   <div class="min-w-0">
                      <div class="flex items-center gap-2 mb-1.5">
                        <h4 class="text-xl font-black text-gray-900 dark:text-white truncate">{{ cust.name }}</h4>
                        <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[8px] font-black uppercase tracking-widest rounded-md">&#64;{{ cust.username }}</span>
                      </div>
                      <p class="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {{ cust.phone }}
                      </p>
                   </div>
                   <div class="text-right shrink-0">
                      <p class="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-none mb-1">Status</p>
                      <span class="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" 
                            [ngClass]="cust.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ cust.status }}
                      </span>
                   </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                   <div class="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p class="text-[8px] font-black text-gray-400 uppercase mb-1">Paid Status</p>
                      <p class="text-sm font-black text-green-600 tracking-tighter">₹{{ getPaidAmount(cust) | number:'1.0-0' }}</p>
                   </div>
                   <div class="bg-pink-50/50 dark:bg-pink-900/10 p-3 rounded-2xl border border-pink-100 dark:border-pink-900/20">
                      <p class="text-[8px] font-black text-pink-400 uppercase mb-1 text-right">Pending Due</p>
                      <p class="text-sm font-black text-pink-600 tracking-tighter text-right">₹{{ getPendingAmount(cust) | number:'1.0-0' }}</p>
                   </div>
                </div>

                <div class="space-y-3 mb-6 px-1">
                   <div class="flex justify-between items-end">
                      <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Progress: {{ getPaidAmount(cust)/scheme.monthlyAmount | number:'1.0-0' }}/{{ scheme.tenure }} Mo</p>
                      <p class="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-tighter">
                         {{ (getPaidAmount(cust) / (scheme.monthlyAmount * scheme.tenure)) * 100 | number:'1.0-0' }}%
                      </p>
                   </div>
                   <div class="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(124,58,237,0.3)]" 
                           [style.width.%]="(getPaidAmount(cust) / (scheme.monthlyAmount * scheme.tenure)) * 100"></div>
                   </div>
                </div>

                <div class="flex gap-3 mt-4">
                   <button (click)="openEditCustomerModal(cust)" class="flex-1 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Payments & Edit</button>
                   <button (click)="deleteCustomer(cust.id!)" class="px-4 py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              </div>
            }
          </div>
          
          <!-- Floating Action Button for Mobile -->
          <button (click)="openAddCustomerModal()" class="fixed bottom-8 right-6 sm:hidden w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce duration-[3000ms] z-[100] active:scale-90 transition-transform">
             <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>

          @if (customers.length === 0) {
            <div class="py-20 text-center animate-fade-up">
              <div class="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float shadow-lg shadow-purple-500/10">
                <svg class="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">No members enrolled</h3>
              <p class="text-gray-500 mt-2">Start adding customers to this chit scheme.</p>
              <div class="mt-6 flex justify-center">
                <button (click)="openAddCustomerModal()" class="shimmer-hover px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:-translate-y-1 transition-all active:scale-95">+ Enrol First Member</button>
              </div>
            </div>
          }
        }
      </main>

      <!-- Customer Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4">
          <div class="bg-white dark:bg-gray-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 dark:border-gray-700 mobile-animate-slide group">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ isEditModal ? 'Edit Customer' : 'Add Customer' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <!-- Mode Switcher (only for Add, not Edit) -->
            @if (!isEditModal) {
              <div class="flex border-b border-gray-100 dark:border-gray-700">
                <button type="button" (click)="existingMode = false"
                  class="flex-1 py-3 text-sm font-bold transition-all"
                  [class.text-purple-600]="!existingMode" [class.border-b-2]="!existingMode" [class.border-purple-600]="!existingMode"
                  [class.text-gray-400]="existingMode">
                  + New Customer
                </button>
                <button type="button" (click)="existingMode = true"
                  class="flex-1 py-3 text-sm font-bold transition-all"
                  [class.text-purple-600]="existingMode" [class.border-b-2]="existingMode" [class.border-purple-600]="existingMode"
                  [class.text-gray-400]="!existingMode">
                  Pick Existing
                </button>
              </div>

              <!-- Existing Customer Picker -->
              @if (existingMode) {
                <div class="p-4 space-y-3 max-h-[60vh] flex flex-col">
                  <div class="relative">
                    <input type="text" [(ngModel)]="existingSearch" [ngModelOptions]="{standalone: true}"
                      placeholder="Search name, phone or username..."
                      class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500">
                    <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <div class="overflow-y-auto flex-1 space-y-2 pr-1">
                    @for (cust of filteredExistingCustomers; track cust.phone) {
                      <button type="button" (click)="selectExistingCustomer(cust)"
                        class="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                        <div class="flex justify-between items-center">
                          <div>
                            <p class="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-700 transition-colors">{{ cust.name }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ cust.phone }}{{ cust.username ? ' · @' + cust.username : '' }}</p>
                          </div>
                          <svg class="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </button>
                    }
                    @if (filteredExistingCustomers.length === 0) {
                      <div class="py-10 text-center">
                        <p class="text-gray-400 text-sm">No matching customers found.</p>
                        <p class="text-gray-400 text-xs mt-1">All existing customers may already be enrolled.</p>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- New Customer Form (shown when not in existing-pick mode OR in edit mode) -->
            @if (isEditModal || !existingMode) {
            <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()" class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <!-- Basic Info -->
              <div class="space-y-4">
                <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Basic Information</h4>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" formControlName="name" placeholder="John Doe" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
                <div>
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (for login)</label>
                   <div class="relative">
                      <span class="absolute left-4 top-2.5 text-gray-400">&#64;</span>
                      <input type="text" formControlName="username" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-8 pr-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="johndoe">
                   </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input type="text" formControlName="phone" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" formControlName="email" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joined Date</label>
                    <input type="date" formControlName="joinedDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select formControlName="status" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Payment Section -->
              @if (isEditModal && editingCustomerId) {
                <div class="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
                  <div class="flex justify-between items-center">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Payment Records</h4>
                    <div class="text-right">
                       <p class="text-[10px] text-gray-500 uppercase">Pending Amount</p>
                       <p class="text-lg font-bold text-pink-600">₹{{ currentPendingAmount | number:'1.0-0' }}</p>
                    </div>
                  </div>

                  <!-- Mini form for adding payment -->
                  <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-3 border border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-2 gap-3">
                     <div class="space-y-1">
                        <input type="number" [(ngModel)]="newPaymentAmount" [ngModelOptions]="{standalone: true}" placeholder="Amount (₹)" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                        <p class="text-[10px] text-purple-600 dark:text-purple-400 font-medium italic">{{ amountToWords(newPaymentAmount || 0) }}</p>
                     </div>
                       <input type="date" [(ngModel)]="newPaymentDate" [ngModelOptions]="{standalone: true}" class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                    </div>
                    <button type="button" (click)="addPayment()" class="w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-lg text-xs hover:bg-purple-200 transition-colors">
                       + Add Partial/Full Payment
                    </button>
                  </div>

                  <!-- Payment List -->
                  <div class="space-y-2 max-h-40 overflow-y-auto pr-2">
                    @for (pay of sortLatest(currentCustomerPayments); track pay.id) {
                      <div class="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-50 dark:border-gray-700 rounded-lg text-xs shadow-sm">
                        <div>
                           <span class="font-bold text-gray-900 dark:text-white">₹{{ pay.amount }}</span>
                           <span class="text-gray-500 ml-2">{{ pay.date }}</span>
                        </div>
                        <button (click)="removePayment(pay.id)" type="button" class="text-red-400 hover:text-red-600">
                           <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    }
                    @if (currentCustomerPayments.length === 0) {
                      <p class="text-center text-xs text-gray-500 py-2">No payments recorded yet.</p>
                    }
                  </div>
                </div>
              }

              <!-- Manual Registration Trigger for missing accounts -->
              <div *ngIf="isEditModal" class="mt-8 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] border border-purple-100 dark:border-purple-800/30 flex justify-between items-center group">
                 <div class="flex items-center space-x-4">
                    <div class="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-purple-600 transition-transform group-hover:scale-110">
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                       <p class="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Account Security</p>
                       <p class="text-xs font-bold text-gray-700 dark:text-gray-300">Login ID: &#64;{{ customerForm.get('username')?.value }}</p>
                    </div>
                 </div>
                 <button type="button" (click)="recreateLogin()" [disabled]="isSaving"
                         class="px-4 py-2 bg-white dark:bg-gray-800 text-purple-600 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                    {{ isSaving ? 'Syncing...' : 'Provision Login' }}
                 </button>
              </div>

              <div class="pt-4 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" class="px-5 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" [disabled]="customerForm.invalid || isSaving" class="px-5 py-2 font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors text-sm">
                  {{ isSaving ? 'Saving...' : (isEditModal ? 'Save Changes' : 'Enroll Customer') }}
                </button>
              </div>
            </form>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class AdminChitDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  schemeId: string | null = null;
  scheme: ChittiScheme | null = null;
  customers: Customer[] = [];             // customers in this scheme
  allCustomers: Customer[] = [];          // ALL chitti customers (for picker)
  interestBorrowers: any[] = [];          // borrowers from interest schemes (for picker)

  showModal = false;
  isEditModal = false;
  editingCustomerId: string | null = null;
  isSaving = false;
  customerSearchQuery = '';
  statusFilter = 'all';
  existingMode = false;      // toggle inside add modal
  existingSearch = '';       // search inside existing picker

  customerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\.]+$/)]],
    phone: ['', Validators.required],
    email: [''],
    joinedDate: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  // --- Payment State for Modal ---
  currentCustomerPayments: CustomerPayment[] = [];
  newPaymentAmount: number | null = null;
  newPaymentDate: string = new Date().toISOString().split('T')[0];

  get currentPendingAmount(): number {
     const editingCust = this.customers.find(c => c.id === this.editingCustomerId);
     return editingCust ? this.getPendingAmount(editingCust) : 0;
  }

  amountToWords(amount: number): string {
    return numberToWords(amount);
  }

  get filteredCustomers(): Customer[] {
    let list = this.customers;
    
    // 1. Status Filter
    if (this.statusFilter !== 'all') {
      list = list.filter(c => c.status === this.statusFilter);
    }

    // 2. Search Query
    if (!this.customerSearchQuery) return list;
    
    const q = this.customerSearchQuery.toLowerCase();
    return list.filter(c => 
      (c.name?.toLowerCase().includes(q)) || 
      (c.phone?.toLowerCase().includes(q)) || 
      (c.username && c.username.toLowerCase().includes(q))
    );
  }

  ngOnInit() {
    this.schemeId = this.route.snapshot.paramMap.get('id');
    if (this.schemeId) {
      this.loadScheme();
      this.loadCustomers();
    }
    // Load all customers for the existing-picker
    this.customerService.getAllCustomers().subscribe(data => this.allCustomers = data);
    // Load interest borrowers for picker
    this.interestService.getInterests().subscribe(schemes => {
      this.interestBorrowers = schemes.map(s => ({
        name: s.borrowerName,
        phone: s.borrowerPhone,
        email: s.borrowerEmail || '',
        username: '' // Interest borrowers don't have default usernames, will be generated
      })).filter(b => !!b.phone);
    });
  }

  loadScheme() {
    this.chittiService.getChittiById(this.schemeId!).subscribe(data => {
      this.scheme = data;
    });
  }

  loadCustomers() {
    this.customerService.getCustomersByScheme(this.schemeId!, 'chitti').subscribe(data => {
      this.customers = data;
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  openAddCustomerModal() {
    this.isEditModal = false;
    this.editingCustomerId = null;
    this.existingMode = false;
    this.existingSearch = '';
    this.customerForm.reset({ status: 'Active' });
    this.showModal = true;
  }

  /** Combined pool of Chitti customers and Interest borrowers minus those already in this scheme. */
  get filteredExistingCustomers(): any[] {
    const enrolledPhones = new Set(this.customers.map(c => c.phone));
    
    // Combine both pools
    const chittiPool = this.allCustomers.map(c => ({
      name: c.name || 'Unknown',
      phone: c.phone || '',
      email: c.email || '',
      username: c.username || ''
    }));

    let fullPool = [...chittiPool, ...this.interestBorrowers];

    // Filter out people already in this scheme by phone
    let pool = fullPool.filter(p => !enrolledPhones.has(p.phone));

    if (this.existingSearch.trim()) {
      const q = this.existingSearch.toLowerCase();
      pool = pool.filter(p =>
        (p.name?.toLowerCase().includes(q)) ||
        (p.phone?.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q))
      );
    }

    // Deduplicate by phone
    const seen = new Set<string>();
    return pool.filter(p => {
      if (seen.has(p.phone)) return false;
      seen.add(p.phone);
      return true;
    });
  }

  /** Pre-fill the form from an existing customer record, switch to new-form mode. */
  selectExistingCustomer(cust: any) {
    this.existingMode = false;
    this.customerForm.patchValue({
      name: cust.name || '',
      username: cust.username || '',
      phone: cust.phone || '',
      email: cust.email || '',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  }

  openEditCustomerModal(customer: Customer) {
    this.isEditMode = true;
    this.isEditModal = true;
    this.editingCustomerId = customer.id!;
    this.customerForm.patchValue(customer);
    this.currentCustomerPayments = customer.payments ? [...customer.payments] : [];
    this.newPaymentAmount = null;
    this.newPaymentDate = new Date().toISOString().split('T')[0];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCustomer() {
    if (this.customerForm.valid && this.schemeId) {
      this.isSaving = true;
      const customerData: Customer = {
        ...this.customerForm.value,
        schemeId: this.schemeId,
        schemeType: 'chitti',
        payments: this.isEditModal ? this.currentCustomerPayments : []
      };

      try {
        if (this.isEditModal && this.editingCustomerId) {
          await this.customerService.updateCustomer(this.editingCustomerId, customerData);
          // Sync login profile with updated phone/name
          if (customerData.username) {
            await this.authService.provisionCustomer(customerData.username, customerData.name || 'Unknown', customerData.phone || '');
          }
          this.toast.success('Customer updated successfully!');
        } else {
          try {
            // Create customer credentials in Firestore (no Firebase Auth needed)
            const alreadyExists = await this.authService.checkUserExists(customerData.username);
            if (!alreadyExists) {
              await this.authService.provisionCustomer(customerData.username, customerData.name || 'Unknown', customerData.phone || '');
            }
            // Save customer business record
            await this.customerService.addCustomer(customerData);
            this.toast.success(`Customer created! Login: ${customerData.username} / 123456`);
          } catch (e: any) {
             console.error('Registration failed', e);
             this.toast.error(e.message || 'Could not create login account. Username might be taken.');
             return;
          }
        }
        this.closeModal();
      } catch (error) {
        console.error('Error saving customer', error);
        this.toast.error('Failed to save customer');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async recreateLogin() {
     const username = this.customerForm.get('username')?.value;
     const name = this.customerForm.get('name')?.value;
     const phone = this.customerForm.get('phone')?.value;

     if (!username || !name || !phone) {
        this.toast.error('Name, Username and Phone are required.');
        return;
     }

     this.isSaving = true;
     try {
        // Provision/update credentials using pure Firestore
        await this.authService.provisionCustomer(username, name, phone);
        this.toast.success(`Login credentials synced! You can now login with: ${username} / 123456`);
     } catch (e: any) {
        console.error(e);
        this.toast.error(e.message || 'Action failed. The account might already exist or Firebase Auth is disabled.');
     } finally {
        this.isSaving = false;
     }
  }

  get currentMonthName(): string {
    return new Date().toLocaleString('default', { month: 'long' });
  }

  get schemeCollectedThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let total = 0;
    this.customers.forEach(cust => {
       (cust.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
             total += p.amount;
          }
       });
    });
    return total;
  }

  get schemePendingThisMonth(): number {
    if (!this.scheme) return 0;
    
    let totalExpected = 0;
    const now = new Date();
    
    this.customers.forEach(cust => {
      if (cust.joinedDate) {
         const joined = new Date(cust.joinedDate);
         let months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1;
         totalExpected += months * this.scheme!.monthlyAmount;
      }
    });

    const totalPaidEver = this.customers.reduce((acc, cust) => {
       return acc + (cust.payments || []).reduce((sum, p) => sum + p.amount, 0);
    }, 0);

    return Math.max(0, totalExpected - totalPaidEver);
  }

  // --- Payment Calculations ---
  getPaidAmount(customer: Customer): number {
    return (customer.payments || []).reduce((sum, p) => sum + p.amount, 0);
  }

  getPendingAmount(customer: Customer): number {
    if (!this.scheme || !customer.joinedDate) return 0;
    
    const joined = new Date(customer.joinedDate);
    const now = new Date();
    
    // Difference in months
    let monthDiff = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
    
    // The user says: "if not reached on joined date the customer is pending to payable amount for that month"
    // Usually implies Month 1 starts on joined date. So if joined Jan 15, Feb 14 is the end of Month 1.
    // If today is Feb 10, total months = 2.
    const totalExpectedMonths = monthDiff + 1;
    const totalPayable = totalExpectedMonths * this.scheme.monthlyAmount;
    const paid = this.getPaidAmount(customer);
    
    return Math.max(0, totalPayable - paid);
  }

  addPayment() {
    if (this.newPaymentAmount && this.newPaymentAmount > 0 && this.editingCustomerId) {
      const newPayment: CustomerPayment = {
        id: Date.now().toString(),
        amount: this.newPaymentAmount,
        date: this.newPaymentDate
      };
      
      this.currentCustomerPayments = [newPayment, ...this.currentCustomerPayments];
      this.newPaymentAmount = null;
      this.newPaymentDate = new Date().toISOString().split('T')[0];
    }
  }

  removePayment(id: string) {
    this.currentCustomerPayments = this.currentCustomerPayments.filter(p => p.id !== id);
  }

  async deleteCustomer(id: string) {
    if (confirm('Are you sure you want to remove this customer?')) {
      try {
        await this.customerService.deleteCustomer(id);
        this.toast.success('Customer removed.');
      } catch (error) {
        console.error('Error deleting customer', error);
        this.toast.error('Failed to remove customer.');
        }
     }
  }

  sortLatest(arr: any[] | undefined) {
    if (!arr) return [];
    return [...arr].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  isEditMode: boolean = false;
}
