import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterestService, InterestScheme, Settlement, InterestCollection } from '../services/interest.service';
import { numberToWords } from '../../shared/utils/number-to-words.util';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-admin-interest-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Loan Details: {{ scheme?.name }} ({{ scheme?.interestRate }}%)</h1>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        @if (scheme) {
          <!-- Action Banner -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white flex flex-col md:flex-row justify-between md:items-center space-y-6 md:space-y-0">
            <div>
              <p class="text-blue-100 text-sm font-medium mb-1">Borrower</p>
              <h2 class="text-2xl sm:text-3xl font-extrabold">{{ scheme.borrowerName }}</h2>
              <p class="text-indigo-200 mt-1 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                {{ scheme.borrowerPhone }}
              </p>
            </div>
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
               <button (click)="printStatement()" class="px-6 py-3 bg-indigo-500/20 text-white border border-indigo-400/30 rounded-xl font-medium hover:bg-indigo-500/30 transition-all text-sm">
                 <svg class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                 Print Statement
               </button>
               <button (click)="openSettlementModal()" class="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all shadow-md text-sm">
                 + Make Settlement
               </button>
               <button (click)="openInterestModal()" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all shadow-md text-sm">
                 + Collect Interest
               </button>
            </div>
          </div>

          <!-- Borrower Identity Info -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8" *ngIf="scheme.borrowerIdType">
             <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                   <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 3"></path></svg>
                   </div>
                   <div>
                      <p class="text-xs text-gray-500 font-medium">Identity Verification ({{ scheme.borrowerIdType }})</p>
                      <p class="text-lg font-bold text-gray-900 dark:text-white">{{ scheme.borrowerIdValue || 'No ID Number Provided' }}</p>
                   </div>
                </div>
                <div *ngIf="scheme.borrowerIdDoc">
                   <a [href]="scheme.borrowerIdDoc" target="_blank" class="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">
                      <span>View Uploaded Document</span>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                   </a>
                </div>
             </div>
          </div>

          <!-- Two Column Chassis -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <!-- Left Column: KPI Sidebar -->
             <div class="lg:col-span-4 space-y-6">
                <!-- Snapshots stacked vertically -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                   <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Original Principal</p>
                   <p class="text-2xl font-black text-gray-900 dark:text-white mt-2">₹{{ scheme.amount | number:'1.0-0' }}</p>
                   <div class="mt-2 h-1 w-12 bg-blue-500 rounded-full"></div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm transition-all hover:shadow-md">
                   <p class="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest">Total Settled</p>
                   <p class="text-2xl font-black text-green-700 dark:text-green-300 mt-2">₹{{ totalSettled | number:'1.0-0' }}</p>
                   <div class="mt-2 h-1 w-12 bg-green-500 rounded-full"></div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm transition-all hover:shadow-md">
                   <p class="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest">Current Balance</p>
                   <p class="text-2xl font-black text-red-700 dark:text-red-400 mt-2">₹{{ currentBalance | number:'1.0-0' }}</p>
                   <div class="mt-2 h-1 w-12 bg-red-500 rounded-full"></div>
                </div>

                <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                   <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
                   <p class="text-[10px] text-indigo-100 font-bold uppercase tracking-widest relative z-10">Monthly Interest</p>
                   <p class="text-3xl font-black text-white mt-1 relative z-10">₹{{ currentMonthlyInterest | number:'1.0-0' }}</p>
                   <p class="text-[10px] text-indigo-200 mt-1 font-medium italic relative z-10">Based on {{ currentBalance | number:'1.0-0' }} balance</p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all hover:shadow-md">
                   <p class="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">Total Interest Collected</p>
                   <p class="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">₹{{ totalInterestCollected | number:'1.0-0' }}</p>
                   <div class="mt-2 h-1 w-12 bg-indigo-500 rounded-full"></div>
                </div>

                <div class="bg-orange-600 p-6 rounded-2xl shadow-xl relative overflow-hidden ring-4 ring-orange-500/20">
                   <div class="absolute -left-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
                   <p class="text-[10px] text-orange-100 font-bold uppercase tracking-widest relative z-10">Pending Interest (Overall)</p>
                   <p class="text-2xl font-black text-white mt-1 relative z-10">₹{{ totalPendingInterest | number:'1.0-0' }}</p>
                   <p class="text-[10px] text-orange-200 mt-1 font-medium relative z-10 italic">As of today, {{ todayDate | date:'mediumDate' }}</p>
                </div>
             </div>

             <!-- Right Column: History Tabs -->
             <div class="lg:col-span-8">
                <!-- History Tab Navigation -->
                <div class="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit border border-gray-200 dark:border-gray-700">
                   <button 
                      (click)="activeHistoryTab = 'interest'"
                      [class.bg-white]="activeHistoryTab === 'interest'"
                      [class.dark:bg-gray-700]="activeHistoryTab === 'interest'"
                      [class.shadow-sm]="activeHistoryTab === 'interest'"
                      [class.text-indigo-600]="activeHistoryTab === 'interest'"
                      class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Interest History
                   </button>
                   <button 
                      (click)="activeHistoryTab = 'settlements'"
                      [class.bg-white]="activeHistoryTab === 'settlements'"
                      [class.dark:bg-gray-700]="activeHistoryTab === 'settlements'"
                      [class.shadow-sm]="activeHistoryTab === 'settlements'"
                      [class.text-blue-600]="activeHistoryTab === 'settlements'"
                      class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Settlement History
                   </button>
                </div>

                @if (activeHistoryTab === 'settlements') {
                  <!-- Settlement History -->
                  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                      <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Principal Settlements</h3>
                      <button (click)="openSettlementModal()" class="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">+ New Settlement</button>
                    </div>

                    <div class="hidden md:block overflow-x-auto">
                      <table class="w-full text-left border-collapse">
                        <thead>
                          <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">
                            <th class="px-6 py-4 font-black">Date</th>
                            <th class="px-6 py-4 font-black">Amount</th>
                            <th class="px-6 py-4 font-black text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                          @for (settlement of scheme.settlements; track settlement.id || $index) {
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ settlement.date }}</td>
                              <td class="px-6 py-4 text-green-600 dark:text-green-400 font-bold">₹{{ settlement.amount | number:'1.0-0' }}</td>
                              <td class="px-6 py-4 text-right space-x-3 text-sm font-medium">
                                <button (click)="openSettlementModal(settlement)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold uppercase text-[10px] tracking-widest">Edit</button>
                                <button (click)="deleteSettlement(settlement.id!)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-bold uppercase text-[10px] tracking-widest">Delete</button>
                              </td>
                            </tr>
                          }
                          @if (!scheme.settlements || scheme.settlements.length === 0) {
                            <tr>
                              <td colspan="3" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No settlements made yet.</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <!-- Mobile Card View -->
                    <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                       @for (settlement of scheme.settlements; track settlement.id || $index) {
                          <div class="px-6 py-5 flex justify-between items-center text-sm">
                             <div>
                                <p class="text-[10px] text-gray-500 mb-1 font-black">{{ settlement.date }}</p>
                                <p class="font-black text-green-600 dark:text-green-400">₹{{ settlement.amount | number:'1.0-0' }}</p>
                             </div>
                             <div class="flex space-x-4">
                                <button (click)="openSettlementModal(settlement)" class="text-indigo-600 font-black uppercase tracking-wider text-[10px]">Edit</button>
                                <button (click)="deleteSettlement(settlement.id!)" class="text-red-600 font-black uppercase tracking-wider text-[10px]">Delete</button>
                             </div>
                          </div>
                       }
                    </div>
                  </div>
                } @else {
                  <!-- Interest History -->
                  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                      <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Interest Collection History</h3>
                      <button (click)="openInterestModal()" class="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">+ Collect Interest</button>
                    </div>

                    <div class="hidden md:block overflow-x-auto">
                      <table class="w-full text-left border-collapse">
                        <thead>
                          <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200 dark:border-gray-700">
                            <th class="px-6 py-4 font-black">Date</th>
                            <th class="px-6 py-4 font-black">Collected</th>
                            <th class="px-6 py-4 font-black text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                          @for (collection of scheme.interestCollections; track collection.id || $index) {
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                              <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ collection.date }}</td>
                              <td class="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">₹{{ collection.amount | number:'1.0-0' }}</td>
                              <td class="px-6 py-4 text-right space-x-3 text-sm font-medium">
                                <button (click)="openInterestModal(collection)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold uppercase text-[10px] tracking-widest">Edit</button>
                                <button (click)="deleteInterestCollection(collection.id!)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-bold uppercase text-[10px] tracking-widest">Delete</button>
                              </td>
                            </tr>
                          }
                          @if (!scheme.interestCollections || scheme.interestCollections.length === 0) {
                            <tr>
                              <td colspan="3" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No collections made yet.</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <!-- Mobile -->
                    <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                       @for (collection of scheme.interestCollections; track collection.id || $index) {
                          <div class="px-6 py-5 flex justify-between items-center text-sm">
                             <div>
                                <p class="text-[10px] text-gray-500 mb-1 font-black">{{ collection.date }}</p>
                                <p class="font-black text-indigo-600 dark:text-indigo-400">₹{{ collection.amount | number:'1.0-0' }}</p>
                             </div>
                             <div class="flex space-x-4">
                                <button (click)="openInterestModal(collection)" class="text-indigo-600 font-black uppercase tracking-wider text-[10px]">Edit</button>
                                <button (click)="deleteInterestCollection(collection.id!)" class="text-red-600 font-black uppercase tracking-wider text-[10px]">Delete</button>
                             </div>
                          </div>
                       }
                    </div>
                  </div>
                }
             </div>
          </div>
        }
      </main>

      <!-- Settlement Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ isEditModal ? 'Edit Settlement' : 'Make Partial Settlement' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form [formGroup]="settlementForm" (ngSubmit)="saveSettlement()" class="p-6 space-y-4">
              <div>
                 <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-900/50">
                    Current Balance: <strong class="font-bold">₹{{ currentBalance | number:'1.0-0' }}</strong>
                 </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Settlement Date</label>
                <input type="date" formControlName="date" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount to Settle (₹)</label>
                <input type="number" formControlName="amount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 5000">
                 <p class="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium italic">{{ amountToWords(settlementForm.get('amount')?.value) }}</p>
                @if (settlementForm.get('amount')?.hasError('max')) {
                   <p class="text-red-500 text-xs mt-1">Cannot settle more than current balance!</p>
                }
              </div>

              <div class="pt-4 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" class="px-5 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" [disabled]="settlementForm.invalid || isSaving" class="px-5 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors text-sm">
                  {{ isSaving ? 'Processing...' : 'Settle Amount' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Interest Collection Modal -->
      @if (showInterestModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ isEditInterestModal ? 'Edit Interest Collection' : 'Collect Monthly Interest' }}</h3>
              <button (click)="closeInterestModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form [formGroup]="interestForm" (ngSubmit)="saveInterestCollection()" class="p-6 space-y-4">
              <div>
                 <div class="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm border border-indigo-100 dark:border-indigo-900/50">
                    Expected Monthly Interest: <strong class="font-bold">₹{{ currentMonthlyInterest | number:'1.0-0' }}</strong>
                 </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Collection Date</label>
                <input type="date" formControlName="date" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Amount (₹)</label>
                <input type="number" formControlName="amount" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 2000">
                <p class="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium italic">{{ amountToWords(interestForm.get('amount')?.value) }}</p>
              </div>

              <div class="pt-4 flex justify-end space-x-3">
                <button type="button" (click)="closeInterestModal()" class="px-5 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" [disabled]="interestForm.invalid || isSaving" class="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors text-sm">
                  {{ isSaving ? 'Processing...' : 'Collect Interest' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminInterestDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interestService = inject(InterestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  schemeId: string | null = null;
  scheme: InterestScheme | null = null;

  showModal = false;
  isSaving = false;
  isEditModal = false;
  editingSettlementId: string | null = null;
  activeHistoryTab: 'settlements' | 'interest' = 'interest';
  todayDate = new Date();

  settlementForm: FormGroup = this.fb.group({
    date: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]]
  });

  showInterestModal = false;
  isEditInterestModal = false;
  editingInterestId: string | null = null;
  interestForm: FormGroup = this.fb.group({
    date: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]]
  });

  get totalPendingInterest(): number {
    if (!this.scheme || !this.scheme.startDate) return 0;
    
    // Accumulate monthly interest from startDate to today
    const start = new Date(this.scheme.startDate);
    const today = new Date();
    let totalDue = 0;
    
    // Move month by month
    // We start from the end of the first month
    let iterDate = new Date(start);
    iterDate.setMonth(iterDate.getMonth() + 1);
    
    while (iterDate <= today) {
      // Find the balance at the START of this monthly cycle
      const periodStart = new Date(iterDate);
      periodStart.setMonth(periodStart.getMonth() - 1);
      
      const settlementsBefore = (this.scheme.settlements || [])
        .filter(s => new Date(s.date) < periodStart);
      const settledAmount = settlementsBefore.reduce((sum, s) => sum + s.amount, 0);
      const balance = Math.max(0, this.scheme.amount - settledAmount);
      
      totalDue += (balance * (this.scheme.interestRate / 100));
      
      // Advance to the next month anniversary
      iterDate.setMonth(iterDate.getMonth() + 1);
    }
    
    return Math.max(0, totalDue - this.totalInterestCollected);
  }

  get totalSettled(): number {
     if (!this.scheme?.settlements) return 0;
     return this.scheme.settlements.reduce((sum, s) => sum + s.amount, 0);
  }

  get currentBalance(): number {
     if (!this.scheme) return 0;
     return Math.max(0, this.scheme.amount - this.totalSettled);
  }

  get currentMonthlyInterest(): number {
     if (!this.scheme) return 0;
     return this.currentBalance * (this.scheme.interestRate / 100);
  }

  get totalInterestCollected(): number {
     if (!this.scheme?.interestCollections) return 0;
     return this.scheme.interestCollections.reduce((sum, c) => sum + c.amount, 0);
  }

  amountToWords(amount: number): string {
    return numberToWords(amount);
  }

  ngOnInit() {
    this.schemeId = this.route.snapshot.paramMap.get('id');
    if (this.schemeId) {
      this.loadScheme();
    }
  }

  loadScheme() {
    this.interestService.getInterestById(this.schemeId!).subscribe(data => {
      this.scheme = data;
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  printStatement() {
    window.print();
  }

  openSettlementModal(settlement?: Settlement) {
    if (settlement) {
      this.isEditModal = true;
      this.editingSettlementId = settlement.id || null;
      this.settlementForm.reset({
        date: settlement.date,
        amount: settlement.amount
      });
      // The max validation for an edit should include its own amount to the current balance
      const maxAllowed = this.currentBalance + settlement.amount;
      this.settlementForm.get('amount')?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(maxAllowed)
      ]);
    } else {
      this.isEditModal = false;
      this.editingSettlementId = null;
      this.settlementForm.reset({ 
        date: new Date().toISOString().split('T')[0], 
        amount: '' 
      });
      // Set dynamic max validation based on strictly current remaining balance
      this.settlementForm.get('amount')?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.currentBalance)
      ]);
    }
    
    this.settlementForm.get('amount')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveSettlement() {
    if (this.settlementForm.valid && this.schemeId && this.scheme) {
      this.isSaving = true;
      
      const currentSettlements = this.scheme.settlements || [];
      let updatedSettlements: Settlement[];

      if (this.isEditModal && this.editingSettlementId) {
         updatedSettlements = currentSettlements.map(s => {
            if (s.id === this.editingSettlementId) {
               return { ...s, date: this.settlementForm.value.date, amount: this.settlementForm.value.amount };
            }
            return s;
         });
      } else {
         const newSettlement: Settlement = {
           date: this.settlementForm.value.date,
           amount: this.settlementForm.value.amount,
           id: Date.now().toString()
         };
         updatedSettlements = [...currentSettlements, newSettlement];
      }

      const updatedScheme: Partial<InterestScheme> = {
        settlements: updatedSettlements
      };

      try {
        await this.interestService.updateInterest(this.schemeId, updatedScheme);
        this.toast.success(this.isEditModal ? 'Settlement updated successfully!' : 'Settlement processed successfully!');
        this.closeModal();
      } catch (error) {
        console.error('Error saving settlement', error);
        this.toast.error('Failed to process settlement.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteSettlement(id: string) {
    if (confirm('Are you sure you want to delete this settlement record? Your balance will increase.')) {
       if (this.schemeId && this.scheme && this.scheme.settlements) {
          const updatedSettlements = this.scheme.settlements.filter(s => s.id !== id);
          
          try {
             await this.interestService.updateInterest(this.schemeId, {
                settlements: updatedSettlements
             });
             this.toast.success('Settlement record deleted.');
          } catch (error) {
             console.error('Error deleting settlement', error);
             this.toast.error('Failed to delete settlement.');
          }
       }
    }
  }

  openInterestModal(collection?: InterestCollection) {
    if (collection) {
      this.isEditInterestModal = true;
      this.editingInterestId = collection.id || null;
      this.interestForm.reset({
        date: collection.date,
        amount: collection.amount
      });
    } else {
      this.isEditInterestModal = false;
      this.editingInterestId = null;
      this.interestForm.reset({ 
        date: new Date().toISOString().split('T')[0], 
        amount: Math.round(this.currentMonthlyInterest)
      });
    }
    this.showInterestModal = true;
  }

  closeInterestModal() {
    this.showInterestModal = false;
  }

  async saveInterestCollection() {
    if (this.interestForm.valid && this.schemeId && this.scheme) {
      this.isSaving = true;
      
      const currentCollections = this.scheme.interestCollections || [];
      let updatedCollections: InterestCollection[];

      if (this.isEditInterestModal && this.editingInterestId) {
         updatedCollections = currentCollections.map(c => {
            if (c.id === this.editingInterestId) {
               return { ...c, date: this.interestForm.value.date, amount: this.interestForm.value.amount };
            }
            return c;
         });
      } else {
         const newCollection: InterestCollection = {
           date: this.interestForm.value.date,
           amount: this.interestForm.value.amount,
           id: Date.now().toString()
         };
         updatedCollections = [...currentCollections, newCollection];
      }

      try {
        await this.interestService.updateInterest(this.schemeId, {
          interestCollections: updatedCollections
        });
        this.toast.success(this.isEditInterestModal ? 'Interest record updated!' : 'Interest collected successfully!');
        this.closeInterestModal();
      } catch (error) {
        console.error('Error saving interest', error);
        this.toast.error('Failed to save interest collection.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteInterestCollection(id: string) {
    if (confirm('Are you sure you want to delete this interest collection record?')) {
       if (this.schemeId && this.scheme && this.scheme.interestCollections) {
          const updatedCollections = this.scheme.interestCollections.filter(c => c.id !== id);
          
          try {
             await this.interestService.updateInterest(this.schemeId, {
                interestCollections: updatedCollections
             });
             this.toast.success('Interest record deleted.');
          } catch (error) {
             console.error('Error deleting interest', error);
             this.toast.error('Failed to delete interest record.');
          }
       }
    }
  }
}
