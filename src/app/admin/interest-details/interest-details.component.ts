import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterestService, InterestScheme, Settlement, InterestCollection } from '../services/interest.service';
import { ToastService } from '../../shared/toast.service';
import { NotificationService } from '../services/notification.service';
import { WhatsAppService } from '../services/whatsapp.service';

import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-admin-interest-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CountUpDirective],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
      <style>
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .history-step { position: relative; padding-left: 3.5rem; }
        .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
        .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
      </style>

      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-3 animate-fade-down">
        <div class="flex items-center space-x-4">
          <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none uppercase tracking-tighter">{{ scheme?.name }}</h1>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up delay-100">
        @if (scheme) {
          <div class="bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-800 rounded-[2.5rem] shadow-2xl p-6 sm:p-10 mb-8 text-white relative overflow-hidden transition-all group animate-fade-up">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700"></div>
            <div class="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] animate-float-slow"></div>
            <!-- Extra floating orb -->
            <div class="absolute top-4 right-4 w-6 h-6 bg-white/10 rounded-full animate-ping" style="animation-duration:4s"></div>
            
            <div class="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <p class="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em]">Loan Scheme</p>
                  <span class="px-2 py-0.5 bg-white/10 rounded-md text-[8px] font-black border border-white/10 uppercase">{{ scheme.status || 'Active' }}</span>
                  @if (isReminderDue) {
                    <span class="px-2 py-0.5 bg-orange-500 rounded-md text-[8px] font-black border border-orange-400 uppercase animate-pulse">Reminder Due</span>
                  }
                </div>
                <h2 class="text-3xl sm:text-4xl font-black leading-none tracking-tighter mb-4">{{ scheme.borrowerName }}</h2>
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <p class="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      {{ scheme.borrowerPhone }}
                    </p>
                    <div class="flex items-center gap-2">
                      <button (click)="shareReminder()" class="w-8 h-8 bg-[#25D366] hover:bg-[#1ebe59] rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-green-500/30" title="WhatsApp Reminder">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p class="px-4 py-2 bg-yellow-400/20 rounded-2xl backdrop-blur-md border border-yellow-400/30 text-xs font-black text-yellow-200 uppercase tracking-widest">
                    {{ scheme.interestRate }}% ROI
                  </p>
                </div>
              </div>
              
              <div class="w-full sm:w-auto flex flex-row sm:flex-col items-center sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-none border-white/10">
                <div class="flex-1 sm:text-right">
                   <p class="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1 opacity-70">Total Principal</p>
                   <p class="text-2xl sm:text-3xl font-black tracking-tighter" [appCountUp]="scheme.amount" prefix="₹"></p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex p-1.5 bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl mb-8 w-full sm:w-fit gap-1 overflow-x-auto no-scrollbar whitespace-nowrap animate-fade-up delay-200">
            <button
              (click)="activeHistoryTab = 'overview'"
              [class.bg-white]="activeHistoryTab === 'overview'"
              [class.dark:bg-gray-700]="activeHistoryTab === 'overview'"
              [class.shadow-md]="activeHistoryTab === 'overview'"
              [class.text-blue-600]="activeHistoryTab === 'overview'"
              [class.text-gray-500]="activeHistoryTab !== 'overview'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
              Overview
            </button>
            <button
              (click)="activeHistoryTab = 'interest'"
              [class.bg-white]="activeHistoryTab === 'interest'"
              [class.dark:bg-gray-700]="activeHistoryTab === 'interest'"
              [class.shadow-md]="activeHistoryTab === 'interest'"
              [class.text-blue-600]="activeHistoryTab === 'interest'"
              [class.text-gray-500]="activeHistoryTab !== 'interest'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
              Interest
            </button>
            <button
              (click)="activeHistoryTab = 'settlements'"
              [class.bg-white]="activeHistoryTab === 'settlements'"
              [class.dark:bg-gray-700]="activeHistoryTab === 'settlements'"
              [class.shadow-md]="activeHistoryTab === 'settlements'"
              [class.text-blue-600]="activeHistoryTab === 'settlements'"
              [class.text-gray-500]="activeHistoryTab !== 'settlements'"
              class="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
              Settlements
            </button>
          </div>

          <div class="space-y-8">
            @if (activeHistoryTab === 'overview') {
              <div class="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="glass-card p-5 sm:p-7 rounded-[2rem] animate-fade-up delay-100 hover:-translate-y-1 transition-all duration-300">
                  <p class="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Principal Amount</p>
                  <p class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter kpi-number" [appCountUp]="scheme.amount" prefix="&#8377;"></p>
                </div>

                <div class="glass-card p-5 sm:p-7 rounded-[2rem] text-right animate-fade-up delay-200 hover:-translate-y-1 transition-all duration-300">
                  <p class="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Installment Start</p>
                  <p class="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 tracking-tighter">{{ scheme.startDate || '--' }}</p>
                </div>

                <div class="glass-card p-5 sm:p-7 rounded-[2rem] border-green-500/20 animate-fade-up delay-300 hover:-translate-y-1 transition-all duration-300 animate-pulse-glow-green">
                  <p class="text-[8px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Paid Principal</p>
                  <p class="text-xl sm:text-2xl font-black text-green-700 dark:text-green-300 tracking-tighter kpi-number" [appCountUp]="totalSettled" prefix="&#8377;"></p>
                </div>

                <div class="glass-card p-5 sm:p-7 rounded-[2rem] border-red-500/20 text-right animate-fade-up delay-400 hover:-translate-y-1 transition-all duration-300">
                  <p class="text-[8px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Balance Due</p>
                  <p class="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400 tracking-tighter kpi-number" [appCountUp]="currentBalance" prefix="&#8377;"></p>
                </div>

                <div class="col-span-2 glass-card p-6 sm:p-8 rounded-[2rem] border-indigo-500/20">
                  <div class="flex items-end justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total Interest Collected</p>
                      <p class="text-2xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300 leading-none tracking-tighter" [appCountUp]="totalInterestCollected" prefix="&#8377;"></p>
                    </div>
                    <p class="text-[10px] font-bold text-indigo-400 text-right uppercase tracking-[0.1em]">Recorded across<br>all collections</p>
                  </div>
                </div>

                @if (scheme.status !== 'Inactive' && totalPendingInterest > 0) {
                  <div class="col-span-2 bg-gradient-to-br from-orange-500 to-pink-600 p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-orange-500/20 text-white relative overflow-hidden group">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div class="relative z-10 flex items-end justify-between gap-4">
                      <div class="min-w-0">
                        <p class="text-[9px] sm:text-[10px] font-black text-orange-100 uppercase tracking-widest mb-2 opacity-80">Overall Interest Due</p>
                        <p class="text-3xl sm:text-5xl font-black leading-none tracking-tighter" [appCountUp]="totalPendingInterest" prefix="&#8377;"></p>
                      </div>
                      <p class="text-[10px] font-bold text-orange-100/80 text-right uppercase tracking-widest leading-relaxed">Calculated<br>till today</p>
                    </div>
                  </div>
                }
              </div>
            }

            @if (activeHistoryTab === 'interest') {
              <div class="animate-in fade-in slide-in-from-right-4 duration-500">
                <div class="glass-card p-6 sm:p-8 rounded-[2.5rem] shadow-xl mb-12 animate-in zoom-in-95 duration-500">
                  <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Collect Interest</h3>
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Interest payment record</p>
                    </div>
                  </div>
                  <form [formGroup]="collectionForm" (ngSubmit)="onCollectionSubmit()" class="space-y-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 px-1 block">Collection Amount</label>
                        <div class="relative">
                          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">₹</span>
                          <input type="number" formControlName="amount" class="w-full pl-8 pr-4 py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-indigo-700 dark:text-indigo-300" placeholder="0">
                        </div>
                        <p class="text-[9px] font-black text-indigo-400 mt-1.5 px-1 uppercase tracking-widest">Expected: <span [appCountUp]="pendingInterest" prefix="₹"></span></p>
                      </div>
                      <div>
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 block">Collection Date</label>
                        <input type="date" formControlName="date" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-gray-700 dark:text-gray-300">
                      </div>
                    </div>
                    <button type="submit" [disabled]="collectionForm.invalid" class="shimmer-hover w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all disabled:opacity-50">
                      Confirm Collection
                    </button>
                  </form>
                </div>

                <div class="space-y-8 relative">
                  <h4 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Interest History</h4>
                  @for (collection of sortLatest(scheme.interestCollections || []); track collection.id || $index; let i = $index) {
                    <div class="history-step group animate-stepper" [style.animation-delay]="(i * 100) + 'ms'">
                      @if (i < (scheme.interestCollections || []).length - 1) {
                        <div class="stepper-line bg-green-500/30 transition-colors"></div>
                      }

                      <div class="stepper-dot w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 z-10">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>

                      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-green-200">
                        <div class="flex justify-between items-center gap-4">
                          <div class="min-w-0">
                            <p class="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1 leading-none">Interest Step {{ (scheme.interestCollections || []).length - i }}</p>
                            <p class="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">{{ collection.date | date:'longDate' }}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manual Collection</p>
                          </div>
                          <div class="text-right shrink-0">
                            <p class="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="collection.amount" prefix="&#8377;"></p>
                            <button (click)="deleteCollection(collection.id!)" class="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mt-1.5 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (activeHistoryTab === 'settlements') {
              <div class="space-y-8 relative animate-in fade-in slide-in-from-right-4 duration-500">
                @if (currentBalance > 0) {
                  <div class="glass-card p-6 sm:p-10 rounded-[2.5rem] shadow-xl border-blue-500/20 relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div class="relative z-10">
                      <div class="flex items-center gap-4 mb-8">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                           <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Make a Settlement</h3>
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Principal amount release</p>
                        </div>
                      </div>
                      
                      <form [formGroup]="settlementForm" (ngSubmit)="onSettlementSubmit()" class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label class="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 px-1">Amount (Principal)</label>
                            <div class="relative">
                               <span class="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">₹</span>
                               <input type="number" formControlName="amount" class="w-full pl-8 pr-4 py-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black text-blue-700 dark:text-blue-300" placeholder="Enter amount">
                            </div>
                          </div>
                          <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Payment Date</label>
                            <input type="date" formControlName="date" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-600 transition-all font-black text-gray-700 dark:text-gray-300">
                          </div>
                        </div>
                        <button type="submit" [disabled]="settlementForm.invalid" class="shimmer-hover w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all disabled:opacity-50">
                          Release Principal
                        </button>
                      </form>
                    </div>
                  </div>
                }

                <h4 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Principal Release History</h4>
                @for (settlement of sortLatest(scheme.settlements || []); track settlement.id || $index; let i = $index) {
                  <div class="history-step group animate-stepper" [style.animation-delay]="(i * 100) + 'ms'">
                    @if (i < (scheme.settlements.length || 0) - 1) {
                      <div class="stepper-line bg-blue-500/30 transition-colors"></div>
                    }

                    <div class="stepper-dot w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 z-10 transition-transform group-hover:scale-110">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>

                    <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                      <div class="flex justify-between items-center gap-4">
                        <div class="min-w-0">
                          <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Settlement Step {{ (scheme.settlements.length || 0) - i }}</p>
                          <p class="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">{{ settlement.date | date:'longDate' }}</p>
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Principal Recorded</p>
                        </div>
                        <div class="text-right shrink-0">
                          <p class="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tighter" [appCountUp]="settlement.amount" prefix="&#8377;"></p>
                           <button (click)="deleteSettlement(settlement.id!)" class="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mt-1.5 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center py-20 opacity-30">
            <svg class="w-20 h-20 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xl font-black">Connecting to database...</p>
          </div>
        }
      </main>
    </div>
  `
})
export class AdminInterestDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interestService = inject(InterestService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private notificationService = inject(NotificationService);
  private whatsappService = inject(WhatsAppService);

  scheme: InterestScheme | null = null;
  activeHistoryTab: 'overview' | 'interest' | 'settlements' = 'overview';

  settlementForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(100)]],
    date: [new Date().toISOString().split('T')[0], Validators.required]
  });

  collectionForm: FormGroup = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().split('T')[0], Validators.required]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.interestService.getInterestById(id).subscribe(data => {
        this.scheme = data;
        if (this.scheme) {
          this.collectionForm.patchValue({ amount: this.pendingInterest });
        }
      });
    }
  }

  get totalSettled(): number {
    return (this.scheme?.settlements || []).reduce((sum, settlement) => sum + settlement.amount, 0);
  }

  get totalInterestCollected(): number {
    return (this.scheme?.interestCollections || []).reduce((sum, collection) => sum + collection.amount, 0);
  }

  get currentBalance(): number {
    if (!this.scheme) return 0;
    return Math.max(0, this.scheme.amount - this.totalSettled);
  }

  get pendingInterest(): number {
    if (!this.scheme) return 0;
    return this.currentBalance * (this.scheme.interestRate / 100);
  }

  get totalPendingInterest(): number {
    if (!this.scheme) return 0;
    const accrued = this.getAccruedInterestThrough(this.getLocalToday());
    return Math.max(0, accrued - this.totalInterestCollected);
  }

  private getMonthsElapsed(startDateStr: string): number {
    const start = this.parseLocalDate(startDateStr);
    if (!start) return 0;
    const today = this.getLocalToday();
    let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    
    // Only count the month if today's date has reached or passed the start date's day of month
    if (today.getDate() < start.getDate()) {
      months--;
    }
    
    return Math.max(0, months);
  }

  get nextDueDate(): Date | null {
    if (!this.scheme?.startDate) return null;
    const startDate = this.parseLocalDate(this.scheme.startDate);
    if (!startDate) return null;

    const today = this.getLocalToday();
    let cycleIndex = 0;
    let dueDate = this.addMonthsClamped(startDate, cycleIndex);

    while (dueDate.getTime() < today.getTime()) {
      cycleIndex++;
      dueDate = this.addMonthsClamped(startDate, cycleIndex);
    }

    return dueDate;
  }

  get isReminderDue(): boolean {
    if (!this.nextDueDate || !this.scheme) return false;
    
    // If interest is already overdue
    if (this.totalPendingInterest > 0) return true;

    const today = this.getLocalToday();
    const timeDiff = this.nextDueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Start reminding from 5 days before
    return daysDiff <= 5 && daysDiff >= 0;
  }

  shareReminder() {
    if (!this.scheme) return;
    const amountDue = this.totalPendingInterest || this.pendingInterest;
    const formattedAmount = amountDue.toLocaleString('en-IN');
    const formattedDate = this.nextDueDate ? this.nextDueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    
    const message = `Hello ${this.scheme.borrowerName}, this is a reminder from FinServe for your interest payment regarding ${this.scheme.name}. ` +
      `Amount due: ₹${formattedAmount}. ` +
      (formattedDate ? `Due date: ${formattedDate}. ` : '') +
      `Please pay to avoid penalties. Thank you!`;

    const cleanPhone = this.scheme.borrowerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  }

  sortLatest(list: any[] | undefined) {
    if (!list) return [];
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getLocalToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private parseLocalDate(value: string | undefined | null): Date | null {
    if (!value) return null;

    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }

  private getSettledAmountThrough(date: Date): number {
    return (this.scheme?.settlements || []).reduce((sum, settlement) => {
      const settlementDate = this.parseLocalDate(settlement.date);
      if (!settlementDate || settlementDate.getTime() > date.getTime()) {
        return sum;
      }
      return sum + settlement.amount;
    }, 0);
  }

  private getCollectedInterestThrough(date: Date): number {
    return (this.scheme?.interestCollections || []).reduce((sum, collection) => {
      const collectionDate = this.parseLocalDate(collection.date);
      if (!collectionDate || collectionDate.getTime() > date.getTime()) {
        return sum;
      }
      return sum + collection.amount;
    }, 0);
  }

  private getAccruedInterestThrough(date: Date): number {
    if (!this.scheme?.startDate) return 0;

    const startDate = this.parseLocalDate(this.scheme.startDate);
    if (!startDate) return 0;

    let totalDue = 0;
    let cycleIndex = 1;

    while (true) {
      const cycleStart = this.addMonthsClamped(startDate, cycleIndex - 1);
      const cycleDueDate = this.addMonthsClamped(startDate, cycleIndex);

      if (cycleDueDate.getTime() > date.getTime()) {
        break;
      }

      const balanceAtCycleStart = Math.max(0, this.scheme.amount - this.getSettledAmountThrough(cycleStart));
      totalDue += balanceAtCycleStart * (this.scheme.interestRate / 100);
      cycleIndex += 1;
    }

    return totalDue;
  }

  async onSettlementSubmit() {
    if (this.settlementForm.valid && this.scheme?.id) {
      const value = this.settlementForm.value;
      if (value.amount > this.currentBalance) {
        this.toast.warning('Amount exceeds balance.');
        return;
      }

      const newSettlement: Settlement = {
        id: 'S' + Date.now(),
        ...value
      };

      const settlements = [...(this.scheme.settlements || []), newSettlement];
      await this.interestService.updateInterest(this.scheme.id, { settlements });
      this.toast.success('Settlement saved.');
      this.settlementForm.reset({ amount: null, date: new Date().toISOString().split('T')[0] });
    }
  }

  async onCollectionSubmit() {
    if (this.collectionForm.valid && this.scheme?.id) {
      const value = this.collectionForm.value;
      const newCollection: InterestCollection = {
        id: 'IC' + Date.now(),
        amount: value.amount,
        date: value.date
      };

      const interestCollections = [...(this.scheme.interestCollections || []), newCollection];
      await this.interestService.updateInterest(this.scheme.id, { interestCollections });
      this.toast.success('Interest collection saved.');

      // Try sending automatic WhatsApp receipt
      try {
        const dateObj = new Date(value.date);
        const formattedDate = isNaN(dateObj.getTime()) ? value.date : dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const receiptMsg = `Hello ${this.scheme.borrowerName}, we have successfully received your interest payment of ₹${value.amount.toLocaleString('en-IN')} on ${formattedDate} for the loan "${this.scheme.name}". Thank you!`;
        
        const res = await this.whatsappService.sendMessage(this.scheme.borrowerPhone, receiptMsg);
        if (res && res.status === 'mocked') {
          this.toast.info('WhatsApp receipt simulated (API not configured).');
        } else {
          this.toast.success('WhatsApp receipt sent automatically.');
        }
      } catch (err) {
        console.error('Failed to send WhatsApp automatically:', err);
        this.toast.warning('Interest collected successfully, but automatic WhatsApp receipt failed to send.');
      }

      this.collectionForm.reset({ amount: this.pendingInterest, date: new Date().toISOString().split('T')[0] });
    }
  }

  async deleteCollection(id: string) {
    if (confirm('Delete this collection?') && this.scheme?.id) {
      const interestCollections = (this.scheme.interestCollections || []).filter(collection => collection.id !== id);
      await this.interestService.updateInterest(this.scheme.id, { interestCollections });
      this.toast.success('Deleted.');
    }
  }

  async deleteSettlement(id: string) {
    if (confirm('Delete this settlement?') && this.scheme?.id) {
      const settlements = (this.scheme.settlements || []).filter(settlement => settlement.id !== id);
      await this.interestService.updateInterest(this.scheme.id, { settlements });
      this.toast.success('Deleted.');
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
