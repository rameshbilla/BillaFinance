import { Component, inject, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { ChittiScheme } from '../../services/chitti.service';

@Component({
  selector: 'app-chitti-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="card-animate flex flex-col" style="animation-delay:0.05s">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 order-1">
        <div>
          <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chitti Management</h2>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ chittis.length }} active schemes</p>
        </div>
      </div>

      <!-- Action Row -->
      <div class="mb-8 order-4">
        <button (click)="onCreateChit.emit()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          New Scheme
        </button>
      </div>

      <!-- Analytics & Insights -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 order-2 lg:order-3">
        <!-- Bar Chart Card -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 h-[220px] sm:h-[320px] relative overflow-hidden card-animate">
          <div class="flex justify-between items-center mb-4 sm:mb-6">
             <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Collections · {{ selectedYear }}</h3>
             <div class="flex items-center gap-3">
                <div class="flex items-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 shadow-sm">
                   <button (click)="panChart(100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Move Left">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                   </button>
                   <button (click)="zoomChart(1.1)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Zoom In">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                   </button>
                   <button (click)="resetChartZoom()" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Reset Zoom">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </button>
                   <button (click)="zoomChart(0.9)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Zoom Out">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                   </button>
                   <button (click)="panChart(-100)" class="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-pink-600 transition-all" title="Move Right">
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
               (touchstart)="onLockScroll.emit()" (touchend)="onUnlockScroll.emit()" (touchcancel)="onUnlockScroll.emit()">
            <canvas #chittiChart="base-chart" baseChart
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
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                  <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
                </select>
              </div>

              <div>
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 block">Select Month</label>
                <select [ngModel]="selectedMonth" (ngModelChange)="onMonthChange($event)"
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 text-sm font-black text-gray-700 dark:text-gray-300 appearance-none cursor-pointer">
                  <option [value]="-1">All Months</option>
                  <option *ngFor="let m of months; let i = index" [value]="i">{{ m }}</option>
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
        <div *ngFor="let chit of chittis; trackBy: trackByChitId; let i = index" 
             class="scheme-card bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden card-animate"
             [style.animation-delay]="(i * 0.07 + 0.2) + 's'">
          <div class="h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
          <div class="p-6">
            <div class="flex justify-between items-start mb-4 text-xs font-bold text-gray-400 capitalize">{{ chit.tenure }} Months Tenure</div>
            <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 transition-colors truncate mb-1" (click)="onViewDetails.emit(chit.id!)">{{ chit.name }}</h3>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly</p>
                <p class="text-sm font-black text-gray-900 dark:text-white" [appCountUp]="chit.monthlyAmount" prefix="₹"></p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl text-right border border-gray-100/50 dark:border-gray-700/50">
                <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Members</p>
                <p class="text-sm font-black text-gray-900 dark:text-white">{{ getCustomerCount(chit.id!) }}</p>
              </div>
            </div>
            <div class="mb-4 bg-purple-50/30 dark:bg-purple-900/10 p-3 rounded-2xl flex justify-between items-center border border-purple-100/30 dark:border-purple-900/20">
               <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest italic opacity-70">Total Collection</p>
               <p class="text-sm font-black text-purple-600 dark:text-purple-400" [appCountUp]="getTotalChittiPaid(chit.id!)" prefix="₹"></p>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 mb-4">
              <div class="flex justify-between items-center mb-2">
                 <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Timeline</p>
                 <p class="text-[10px] font-black text-purple-600 dark:text-purple-400">
                    {{ getMonthsPassed(chit.startDate) }} / {{ chit.tenure }} Mons
                 </p>
              </div>
              <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                 <div class="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                      [style.width.%]="(getMonthsPassed(chit.startDate) / chit.tenure) * 100"></div>
              </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
               <button (click)="onViewDetails.emit(chit.id!)" class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">View Details</button>
               <div class="flex space-x-1">
                  <button (click)="onEditChit.emit(chit.id!)" class="p-2 text-gray-400 hover:text-indigo-600 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                  <button (click)="onDeleteChit.emit(chit.id!)" class="p-2 text-gray-400 hover:text-red-500 transition-all"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
               </div>
            </div>
          </div>
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
    .scheme-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .scheme-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(139,92,246,0.18), 0 8px 16px rgba(0,0,0,0.08); }
  `]
})
export class ChittiManagementComponent implements OnInit {
  @Input() chittis: ChittiScheme[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() availableYears: number[] = [];
  @Input() selectedMonth: number = -1;
  @Input() filteredTotalChitti: number = 0;
  @Input() chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  @Input() customerCounts: { [schemeId: string]: number } = {};
  @Input() totalPaidMap: { [schemeId: string]: number } = {};

  @Output() onCreateChit = new EventEmitter<void>();
  @Output() onYearChange = new EventEmitter<number>();
  @Output() onMonthChange = new EventEmitter<number>();
  @Output() onViewDetails = new EventEmitter<string>();
  @Output() onEditChit = new EventEmitter<string>();
  @Output() onDeleteChit = new EventEmitter<string>();
  @Output() onLockScroll = new EventEmitter<void>();
  @Output() onUnlockScroll = new EventEmitter<void>();

  @ViewChild('chittiChart') chittiChart?: BaseChartDirective;

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

  ngOnInit() {}

  ngOnChanges() {
    this.chittiChart?.update();
  }

  trackByChitId(index: number, chit: ChittiScheme) {
    return chit.id;
  }

  getCustomerCount(schemeId: string): number {
    return this.customerCounts[schemeId] || 0;
  }

  getTotalChittiPaid(schemeId: string): number {
    return this.totalPaidMap[schemeId] || 0;
  }

  getMonthsPassed(startDateStr: string): number {
    if (!startDateStr) return 0;
    const start = new Date(startDateStr);
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months + 1);
  }

  resetChartZoom() {
    if (this.chittiChart?.chart) (this.chittiChart.chart as any).resetZoom();
  }
  zoomChart(amount: number) {
    if (this.chittiChart?.chart) (this.chittiChart.chart as any).zoom(amount);
  }
  panChart(amount: number) {
    if (this.chittiChart?.chart) (this.chittiChart.chart as any).pan({ x: amount });
  }
}
