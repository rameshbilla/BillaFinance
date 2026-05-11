import { Component, inject, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { InterestScheme } from '../../services/interest.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="space-y-8 card-animate">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Business Overview</h2>
          <p class="text-sm font-medium text-gray-500 mt-1">Aggregated statistics and metrics for your operations.</p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <div class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-2 hidden sm:inline">DATA</span>
            <label class="relative inline-flex items-center cursor-pointer scale-75 sm:scale-90">
              <input type="checkbox" [(ngModel)]="showOverviewData" (ngModelChange)="showOverviewDataChange.emit($event)" class="sr-only peer">
              <div style="border-radius: 10px;" class="w-10 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
            <select [ngModel]="selectedOverviewYear" (ngModelChange)="onYearChange($event)"
                    class="bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-300 pr-8 cursor-pointer">
              <option [ngValue]="-1">All Years</option>
              <option *ngFor="let y of availableOverviewYears" [ngValue]="y">{{y}}</option>
            </select>
          </div>
        </div>
      </div>

      @if (!showOverviewData) {
        <!-- Line Chart -->
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] p-2 sm:p-2 shadow-sm border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-500">
          <div class="flex justify-between items-center mb-6 px-4 pt-4">
            <h3 class="text-sm font-black text-gray-500 uppercase tracking-widest">Financial Trends ({{ selectedOverviewYear === -1 ? 'All Years' : selectedOverviewYear }})</h3>
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                <button (click)="panChart(100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Move Left">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button (click)="zoomChart(1.1)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Zoom In">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
                <button (click)="resetChartZoom()" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Reset Zoom">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button (click)="zoomChart(0.9)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Zoom Out">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                </button>
                <button (click)="panChart(-100)" class="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Move Right">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="h-[300px] w-full chart-touch-wrapper relative px-2">
            <canvas baseChart #overviewChart="base-chart"
                    [data]="chartData"
                    [options]="chartOptions"
                    [type]="chartType">
            </canvas>
          </div>
        </div>
      }

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 kpi-animate" style="animation-delay: 0.1s">
          <div class="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Active Principal</p>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white" [appCountUp]="totalActivePrincipal" prefix="₹"></h3>
          <p class="text-[9px] font-bold text-blue-500 mt-2 uppercase tracking-tighter">Out of ₹{{ totalGivenLoans | number }} Given</p>
        </div>

        <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 kpi-animate" style="animation-delay: 0.2s">
          <div class="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Interest Earned</p>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white" [appCountUp]="totalCollectedInterest" prefix="₹"></h3>
          <p class="text-[9px] font-bold text-purple-500 mt-2 uppercase tracking-tighter">Through All Collections</p>
        </div>

        <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 kpi-animate" style="animation-delay: 0.3s">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Settled Principal</p>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white" [appCountUp]="totalSettlement" prefix="₹"></h3>
          <p class="text-[9px] font-bold text-emerald-500 mt-2 uppercase tracking-tighter">Loans Fully Closed</p>
        </div>

        <div class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 kpi-animate" style="animation-delay: 0.4s">
          <div class="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Interest Overdue</p>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white" [appCountUp]="totalPendingInterest" prefix="₹"></h3>
          <p class="text-[9px] font-bold text-rose-500 mt-2 uppercase tracking-tighter">Requires Attention</p>
        </div>
      </div>

      <!-- Transaction Feed -->
      <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden card-animate" style="animation-delay: 0.5s">
        <div class="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
          <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction History · {{ selectedOverviewYear === -1 ? 'All Time' : selectedOverviewYear }}</h3>
          <div class="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
            <button *ngFor="let f of filters" 
                    (click)="onFilterChange(f)"
                    [class.bg-indigo-600]="activeFilter === f"
                    [class.text-white]="activeFilter === f"
                    class="px-3 py-1.5 text-[8px] font-black rounded-lg transition-all uppercase tracking-widest"
                    [class.text-gray-400]="activeFilter !== f">
              {{ f }}
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th class="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th class="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
              <tr *ngFor="let tx of transactions" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div [class]="tx.bg + ' w-8 h-8 rounded-xl flex items-center justify-center ' + tx.color + ' font-black text-xs shadow-sm border border-white dark:border-gray-700'">{{ tx.icon }}</div>
                    <span class="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ tx.type }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-[11px] font-bold text-gray-600 dark:text-gray-300">{{ tx.whom }}</td>
                <td class="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400">{{ tx.date | date:'dd MMM yyyy' }}</td>
                <td class="px-6 py-4 text-right">
                  <span [class]="tx.color + ' text-sm font-black'" [appCountUp]="tx.amount" prefix="₹"></span>
                </td>
              </tr>
              <tr *ngIf="transactions.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic text-[11px] uppercase tracking-widest opacity-60">No transactions found for this period.</td>
              </tr>
            </tbody>
          </table>
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
  `]
})
export class OverviewComponent implements OnInit {
  @Input() showOverviewData: boolean = false;
  @Input() selectedOverviewYear: number = new Date().getFullYear();
  @Input() availableOverviewYears: number[] = [];
  @Input() interests: InterestScheme[] = [];
  @Input() totalGivenLoans: number = 0;
  @Input() totalSettlement: number = 0;
  @Input() totalActivePrincipal: number = 0;
  @Input() totalCollectedInterest: number = 0;
  @Input() totalPendingInterest: number = 0;
  @Input() transactions: any[] = [];
  @Input() activeFilter: 'All' | 'Loan Issue' | 'Interest' | 'Settlement' = 'All';

  @Output() showOverviewDataChange = new EventEmitter<boolean>();
  @Output() yearChange = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<'All' | 'Loan Issue' | 'Interest' | 'Settlement'>();

  @ViewChild('overviewChart') overviewChart?: BaseChartDirective;

  readonly filters: ('All' | 'Loan Issue' | 'Interest' | 'Settlement')[] = ['All', 'Loan Issue', 'Interest', 'Settlement'];

  chartType: ChartType = 'line';
  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 9 }, callback: (v) => '₹' + v.toLocaleString() } }
    },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 10 },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          drag: { enabled: true, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.4)', borderWidth: 1 }
        }
      }
    }
  };

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges() {
    this.updateChart();
  }

  onYearChange(year: number) {
    this.yearChange.emit(year);
  }

  onFilterChange(filter: 'All' | 'Loan Issue' | 'Interest' | 'Settlement') {
    this.filterChange.emit(filter);
  }

  updateChart() {
    const year = this.selectedOverviewYear;
    let labels: string[];
    let givenLoans: number[];
    let settlements: number[];
    let interestCollected: number[];

    if (year === -1) {
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

    this.chartData = {
      labels,
      datasets: [
        { data: givenLoans, label: 'Given Loans', borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
        { data: settlements, label: 'Settlements', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
        { data: interestCollected, label: 'Interest Collected', borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4 }
      ]
    };
    this.overviewChart?.update();
  }

  resetChartZoom() {
    if (this.overviewChart?.chart) (this.overviewChart.chart as any).resetZoom();
  }
  zoomChart(amount: number) {
    if (this.overviewChart?.chart) (this.overviewChart.chart as any).zoom(amount);
  }
  panChart(amount: number) {
    if (this.overviewChart?.chart) (this.overviewChart.chart as any).pan({ x: amount });
  }
}
