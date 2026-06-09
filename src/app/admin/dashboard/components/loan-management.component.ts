import { Component, inject, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { InterestScheme } from '../../services/interest.service';

@Component({
  selector: 'app-loan-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="card-animate flex flex-col" style="animation-delay:0.05s">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div class="flex-1">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Loan Management</h2>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ filteredLoans.length }} active loan accounts</p>
        </div>
        <button (click)="onCreateLoan.emit()" class="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95 transition-all whitespace-nowrap">
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
                <button (click)="panChart(100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Move Left">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button (click)="zoomChart(1.1)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Zoom In">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
                <button (click)="resetChartZoom()" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Reset Zoom">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button (click)="zoomChart(0.9)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Zoom Out">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                <button (click)="panChart(-100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-600 transition-all" title="Move Right">
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
               (touchstart)="onLockScroll.emit()" (touchend)="onUnlockScroll.emit()" (touchcancel)="onUnlockScroll.emit()">
            <canvas #loanChart="base-chart" baseChart
              [data]="chartData"
              [options]="chartOptions"
              [type]="chartType">
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
                <select [ngModel]="selectedYear" (ngModelChange)="onYearChange($event)"
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                  <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
                </select>
              </div>

              <div>
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Month</label>
                <select [ngModel]="selectedMonth" (ngModelChange)="onMonthChange($event)"
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                  <option [value]="-1">All Months</option>
                  <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
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
        <div class="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1 flex items-center">
          <div class="relative w-full">
            <input type="text" [(ngModel)]="loanSearchQuery" (ngModelChange)="onSearchChange($event)" placeholder="Search loans..."
                   class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs text-gray-900 dark:text-white font-black placeholder:text-gray-400">
            <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        <div class="p-1 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-xl flex gap-1 border border-gray-200 dark:border-gray-700/50 shadow-inner w-fit">
          <button *ngFor="let status of ['Active', 'Inactive', 'All']"
                  (click)="onStatusFilterChange(status)"
                  [class.tab-active]="loanStatusFilter === status"
                  class="px-5 py-2 text-[9px] font-black rounded-lg transition-all duration-300 text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">
            {{ status }}
          </button>
        </div>
      </div>

      <!-- Interest Cards -->
      <div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          <div *ngFor="let loan of filteredLoans; trackBy: trackByLoanId; let i = index" 
               class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
               [style.animation-delay]="(i * 0.07 + 0.2) + 's'"
               (click)="onToggleExpansion.emit(loan.id!)">
            
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
                <p class="text-[8px] font-black text-gray-400 ml-3.5 mt-0.5 uppercase tracking-tighter">Started: {{ loan.startDate | date:'dd MMM yyyy' }}</p>
              </div>
              <div class="text-right ml-4">
                <p class="text-xs font-black text-gray-900 dark:text-white" [appCountUp]="loan.amount" prefix="₹"></p>
                <p class="text-[9px] font-black text-indigo-500">{{ loan.interestRate }}% Int.</p>
              </div>
              <svg class="w-4 h-4 text-gray-300 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
            </div>

            <!-- Full Card View -->
            <div [class.hidden]="!expandedLoans[loan.id!] && isMobile" class="sm:block transition-all duration-300">
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
                   <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors truncate flex-1" (click)="$event.stopPropagation(); onViewDetails.emit(loan.id!)">{{ loan.name }}</h3>
                   <div class="flex flex-col items-end">
                     <div class="flex items-center gap-2">
                       <span *ngIf="isLoanReminderDue(loan)" class="text-[8px] font-black px-2 py-0.5 bg-orange-500 text-white rounded-md uppercase animate-pulse">Reminder Due</span>
                        <div class="flex items-center gap-2">
                           <a [href]="'tel:' + loan.borrowerPhone" (click)="$event.stopPropagation()" class="w-7 h-7 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-indigo-500/30" title="Call Borrower">
                              <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                           </a>
                           <button (click)="$event.stopPropagation(); onShareReminder.emit(loan)" class="w-7 h-7 bg-[#25D366] hover:bg-[#1ebe59] rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-green-500/30" title="WhatsApp Reminder">
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
                <div *ngIf="loan.status !== 'Inactive' && getPendingInterestForLoan(loan) > 0" class="mb-4 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-2xl flex justify-between items-center border border-rose-100/30 dark:border-rose-900/20">
                   <p class="text-[9px] font-black text-rose-500 uppercase tracking-widest italic opacity-70">Overall Interest Due</p>
                   <p class="text-sm font-black text-rose-600 dark:text-rose-400" [appCountUp]="getPendingInterestForLoan(loan)" prefix="₹"></p>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                   <button (click)="$event.stopPropagation(); onViewDetails.emit(loan.id!)" class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Loan Statement</button>
                   <div class="flex space-x-1">
                      <button (click)="$event.stopPropagation(); onToggleStatus.emit(loan)" class="p-2 text-gray-400 hover:text-orange-500 transition-all" [title]="loan.status === 'Inactive' ? 'Mark Active' : 'Mark Inactive'"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></button>
                      <button (click)="$event.stopPropagation(); onEditLoan.emit(loan.id!)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                      <button (click)="$event.stopPropagation(); onDeleteLoan.emit(loan.id!)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="filteredLoans.length === 0" class="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-50">
          <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No loans found matching your criteria</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-animate { animation: fadeInUp 0.5s ease both; }
    .kpi-animate { animation: slideInRight 0.4s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    
    @media (max-width: 639px) {
      .chart-touch-wrapper { touch-action: none; }
    }
    .tab-active { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.08); color: #7c3aed !important; }
    .dark .tab-active { background: #374151; color: #a78bfa !important; }
    .scheme-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .scheme-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139,92,246,0.18), 0 8px 16px rgba(0,0,0,0.08); }
  `]
})
export class LoanManagementComponent implements OnInit {
  @Input() filteredLoans: InterestScheme[] = [];
  @Input() loanSearchQuery: string = '';
  @Input() loanStatusFilter: string = 'Active';
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() availableYears: number[] = [];
  @Input() selectedMonth: number = -1;
  @Input() filteredTotalInterest: number = 0;
  @Input() isSaving: boolean = false;
  @Input() expandedLoans: { [id: string]: boolean } = {};
  @Input() chartData: ChartData<'bar'> = { labels: [], datasets: [] };

  @Output() onCreateLoan = new EventEmitter<void>();
  @Output() onSendReminders = new EventEmitter<void>();
  @Output() onSearchChange = new EventEmitter<string>();
  @Output() onStatusFilterChange = new EventEmitter<string>();
  @Output() onYearChange = new EventEmitter<number>();
  @Output() onMonthChange = new EventEmitter<number>();
  @Output() onToggleExpansion = new EventEmitter<string>();
  @Output() onViewDetails = new EventEmitter<string>();
  @Output() onEditLoan = new EventEmitter<string>();
  @Output() onDeleteLoan = new EventEmitter<string>();
  @Output() onToggleStatus = new EventEmitter<InterestScheme>();
  @Output() onShareReminder = new EventEmitter<InterestScheme>();
  @Output() onLockScroll = new EventEmitter<void>();
  @Output() onUnlockScroll = new EventEmitter<void>();

  @ViewChild('loanChart') loanChart?: BaseChartDirective;

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  isMobile = window.innerWidth < 640;

  chartType: ChartType = 'bar';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, maxRotation: 45, minRotation: 0, autoSkip: true } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 9 }, callback: (v) => '₹' + Number(v).toLocaleString() } }
    },
    plugins: {
      legend: { display: false },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 10 },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x', drag: { enabled: true, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.4)', borderWidth: 1 } }
      },
      tooltip: {
        backgroundColor: '#1f2937', titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 14, weight: 'bold' },
        padding: 12, cornerRadius: 12, displayColors: false, callbacks: { label: (c) => ' ₹' + (c.parsed.y || 0).toLocaleString() }
      }
    }
  };

  ngOnInit() {
    window.addEventListener('resize', () => this.isMobile = window.innerWidth < 640);
  }

  ngOnChanges() {
    this.loanChart?.update();
  }

  trackByLoanId(index: number, loan: InterestScheme) {
    return loan.id;
  }

  getLastInterestDate(loan: InterestScheme): string | null {
    if (!loan.interestCollections || loan.interestCollections.length === 0) return null;
    const sorted = [...loan.interestCollections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].date;
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

  private parseLocalDateForReminder(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

  getMonthsElapsed(startDate: string): number {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    if (isNaN(start.getTime())) return 0;
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months--;
    return Math.max(0, months);
  }

  isLoanReminderDue(loan: InterestScheme): boolean {
    if (!loan.startDate) return false;
    const nextDue = this.nextLoanDueDate(loan);
    if (!nextDue) return false;
    if (this.getPendingInterestForLoan(loan) > 0) return true;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeDiff = nextDue.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 5 && daysDiff >= 0;
  }

  nextLoanDueDate(loan: InterestScheme): Date | null {
    if (!loan.startDate) return null;
    const start = new Date(loan.startDate);
    const today = new Date();
    const currentToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let cycleIndex = 0;
    let dueDate = this.addMonthsClamped(start, cycleIndex);
    while (dueDate.getTime() < currentToday.getTime()) {
      cycleIndex++;
      dueDate = this.addMonthsClamped(start, cycleIndex);
    }
    return dueDate;
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(date.getDate(), lastDay));
  }

  resetChartZoom() {
    if (this.loanChart?.chart) (this.loanChart.chart as any).resetZoom();
  }
  zoomChart(amount: number) {
    if (this.loanChart?.chart) (this.loanChart.chart as any).zoom(amount);
  }
  panChart(amount: number) {
    if (this.loanChart?.chart) (this.loanChart.chart as any).pan({ x: amount });
  }
}
