import { Component, inject, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { RentalHouse, RentalBill } from '../../services/rental.service';

@Component({
  selector: 'app-rental-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="card-animate space-y-8" style="animation-delay:0.05s">
      
      @if (rentalView === 'houses') {
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">House Management</h2>
            <p class="text-sm font-medium text-gray-500 mt-1">{{ houses.length }} registered properties</p>
          </div>
          <button (click)="onRegisterProperty.emit()" class="hidden sm:block px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
             Register New Property
          </button>
        </div>

        <!-- Rental Analytics Chart -->
        <div class="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm mb-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h3 class="text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Rent Collections</h3>
                    <span class="hidden sm:inline text-gray-300">•</span>
                    <p class="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Monthly revenue breakdown for {{ selectedYear }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div class="flex-1 sm:flex-none flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <select [ngModel]="selectedYear" (ngModelChange)="onYearChange.emit($event)" class="bg-transparent border-none outline-none text-[9px] sm:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest px-3 py-2 appearance-none cursor-pointer">
                      <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
                  </select>
                  <div class="h-6 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
                  <div class="px-3 py-1 text-right min-w-[80px]">
                      <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Total</p>
                      <p class="text-[11px] sm:text-sm font-black text-indigo-600" [appCountUp]="filteredTotalRent" prefix="₹"></p>
                  </div>
                </div>
                <button (click)="onRegisterProperty.emit()" class="sm:hidden p-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl shadow-lg">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
          </div>

          <div class="h-[200px] sm:h-[250px] relative chart-touch-wrapper"
               (touchstart)="onLockScroll.emit()" (touchend)="onUnlockScroll.emit()" (touchcancel)="onUnlockScroll.emit()">
              <canvas baseChart #rentalChart="base-chart"
                [data]="chartData"
                [options]="chartOptions"
                [type]="chartType">
              </canvas>
          </div>
        </div>

        <!-- House Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div *ngFor="let house of houses; trackBy: trackByHouseId" 
               class="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden h-full flex flex-col"
               [class.ring-2]="activeHouseId === house.id" [class.ring-indigo-500]="activeHouseId === house.id">
              
              <!-- Status Badges -->
              <div class="absolute top-5 right-5 flex gap-1.5">
                <span *ngIf="isRentIncreaseDue(house)" class="text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse">
                  Increase
                </span>
                <span class="text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm"
                      [ngClass]="house.status === 'Occupied' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'">
                    {{ house.status }}
                </span>
              </div>

              <!-- Icon & Title -->
              <div class="flex items-start gap-3 mb-4 pr-24 min-h-[74px]">
                <div class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate">{{ house.houseName }}</h3>
                  <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 leading-snug overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;" [title]="house.fullAddress || ''">{{ house.fullAddress || 'Address Not Set' }}</p>
                  <p class="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-1.5">Arrived: {{ house.arrivedDate | date:'dd MMM yyyy' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-4 bg-gray-50/70 dark:bg-gray-900/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div class="min-w-0">
                    <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Electric</span>
                    <span class="block text-sm font-black leading-tight"
                          [class]="isHouseUtilityPaid(house, 'electricity') ? 'text-emerald-500' : 'text-amber-500'">₹{{ getHouseUtilityBill(house, 'electricity') }}</span>
                    <span *ngIf="getHouseUtilityPaidDate(house, 'electricity')" class="block text-[7px] font-black text-emerald-500 uppercase tracking-widest truncate">Paid {{ getHouseUtilityPaidDate(house, 'electricity') }}</span>
                </div>
                <div class="min-w-0">
                    <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Water</span>
                    <span class="block text-sm font-black leading-tight"
                          [class]="isHouseUtilityPaid(house, 'water') ? 'text-emerald-500' : 'text-blue-500'">₹{{ getHouseUtilityBill(house, 'water') }}</span>
                    <span *ngIf="getHouseUtilityPaidDate(house, 'water')" class="block text-[7px] font-black text-emerald-500 uppercase tracking-widest truncate">Paid {{ getHouseUtilityPaidDate(house, 'water') }}</span>
                </div>
                <div class="min-w-0 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Pending</span>
                    <span class="block text-sm font-black text-rose-500 leading-tight" [appCountUp]="getHouseStats(house).pending" prefix="₹"></span>
                </div>
                <div class="min-w-0 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Collected</span>
                    <span class="block text-sm font-black text-green-500 leading-tight" [appCountUp]="getHouseStats(house).collected" prefix="₹"></span>
                </div>
              </div>

              <div class="flex items-center gap-2 mt-auto">
                <button (click)="onViewLedger.emit(house.id!)" class="flex-1 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all hover:opacity-90">Ledger</button>
                <button (click)="onEditProperty.emit(house)" class="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button (click)="onDeleteProperty.emit(house.id!)" class="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 transition-all">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
          </div>
          <div *ngIf="houses.length === 0" class="col-span-full py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-50">
              <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No rental properties registered</p>
          </div>
        </div>
      }

      <!-- Billing Details Table -->
      @if (rentalView === 'ledger' && activeHouse; as house) {
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden animate-fade-up">
          <div class="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="flex items-center gap-3">
                <button (click)="onBackToHouses.emit()" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ house.houseName }} Ledger</h3>
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly breakdown and utility consumption</p>
                </div>
              </div>
              <button (click)="onAddMonthlyRecord.emit()" class="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Record Collection</button>
          </div>
          
          <div class="p-8 relative">
              <div class="space-y-8 relative">
                  <div *ngFor="let bill of sortBills(house.bills); trackBy: trackByBillDate; let i = index" class="history-step group">
                    <div *ngIf="i < house.bills.length - 1" class="stepper-line bg-indigo-500/20 dark:bg-indigo-500/10"></div>
                    
                    <div class="stepper-dot w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg z-10 transition-all group-hover:scale-110 bg-green-500 shadow-green-500/30">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>

                    <div class="p-5 rounded-3xl border border-green-100 dark:border-green-900/30 hover:border-green-200 bg-green-50/10 dark:bg-green-950/5 shadow-sm transition-all hover:shadow-md">
                      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <p class="text-[9px] font-black uppercase tracking-widest leading-none" [class]="bill.status === 'Paid' ? 'text-green-500' : 'text-red-500'">
                              {{ bill.status === 'Paid' ? 'Paid' : 'Unpaid' }}
                            </p>
                            <span class="text-[8px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded font-black text-gray-400 uppercase tracking-tighter">Step {{ house.bills.length - i }}</span>
                          </div>
                          <p class="text-base font-black text-gray-900 dark:text-white leading-none mb-3">{{ bill.billDate | date:'MMMM dd, yyyy' }}</p>
                          
                          <div class="flex flex-wrap gap-x-4 gap-y-2">
                            <div class="flex flex-col">
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rent</span>
                              <span class="text-xs font-bold text-green-500" [appCountUp]="bill.rentAmount" prefix="₹"></span>
                            </div>
                            <div class="flex items-center text-gray-200 dark:text-gray-700 text-xs px-1">/</div>
                            <div class="flex flex-col">
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Electric</span>
                              <span class="text-xs font-bold" [class]="bill.status === 'Pending' && bill.electricBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.electricBill" prefix="₹"></span>
                            </div>
                            <div class="flex items-center text-gray-200 dark:text-gray-700 text-xs px-1">/</div>
                            <div class="flex flex-col">
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Water</span>
                              <span class="text-xs font-bold" [class]="bill.status === 'Pending' && bill.waterBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.waterBill" prefix="₹"></span>
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                          <button (click)="onEditBill.emit({bill, index: findIndex(bill, house)})" class="flex-1 sm:flex-none py-2 px-4 bg-gray-100 dark:bg-gray-700 text-[10px] font-black uppercase rounded-lg">Edit</button>
                          <button (click)="onDeleteBill.emit(findIndex(bill, house))" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .card-animate { animation: fadeInUp 0.5s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @media (max-width: 639px) { .chart-touch-wrapper { touch-action: none; } }
    .history-step { position: relative; padding-left: 3.5rem; }
    .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
    .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
  `]
})
export class RentalManagementComponent implements OnInit {
  @Input() houses: RentalHouse[] = [];
  @Input() activeHouseId: string | null = null;
  @Input() activeHouse: RentalHouse | null = null;
  @Input() rentalView: 'houses' | 'ledger' = 'houses';
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() availableYears: number[] = [];
  @Input() filteredTotalRent: number = 0;
  @Input() chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  @Input() rentalUtilityBills: Record<string, any> = {};

  @Output() onRegisterProperty = new EventEmitter<void>();
  @Output() onEditProperty = new EventEmitter<RentalHouse>();
  @Output() onDeleteProperty = new EventEmitter<string>();
  @Output() onViewLedger = new EventEmitter<string>();
  @Output() onBackToHouses = new EventEmitter<void>();
  @Output() onAddMonthlyRecord = new EventEmitter<void>();
  @Output() onEditBill = new EventEmitter<{bill: RentalBill, index: number}>();
  @Output() onDeleteBill = new EventEmitter<number>();
  @Output() onYearChange = new EventEmitter<number>();
  @Output() onLockScroll = new EventEmitter<void>();
  @Output() onUnlockScroll = new EventEmitter<void>();

  @ViewChild('rentalChart') rentalChart?: BaseChartDirective;

  chartType: ChartType = 'bar';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 9 }, callback: (v) => '₹' + Number(v).toLocaleString() } }
    },
    plugins: {
      legend: { display: false },
      zoom: {
        pan: { enabled: true, mode: 'x', threshold: 10 },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x', drag: { enabled: true, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.4)', borderWidth: 1 } }
      }
    }
  };

  ngOnInit() {}

  ngOnChanges() {
    this.rentalChart?.update();
  }

  trackByHouseId(index: number, house: RentalHouse) { return house.id; }
  trackByBillDate(index: number, bill: RentalBill) { return bill.billDate; }

  sortBills(bills: RentalBill[]) {
    return [...(bills || [])].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
  }

  findIndex(bill: RentalBill, house: RentalHouse) {
    return (house.bills || []).indexOf(bill);
  }

  getHouseStats(house: RentalHouse) {
    const bills = house.bills || [];
    const collected = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.rentAmount || 0), 0);
    let pending = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.total || 0), 0);
    const months = bills.length;

    if (house.status === 'Occupied' && house.arrivedDate) {
      const now = new Date();
      const arrived = new Date(house.arrivedDate);
      let tempDate = new Date(arrived.getFullYear(), arrived.getMonth(), arrived.getDate());
      while (tempDate <= now) {
         const monthName = tempDate.toLocaleString('default', { month: 'long' });
         const year = tempDate.getFullYear();
         const billExists = bills.some(b => b.month === monthName && b.year === year);
         if (!billExists) pending += (house.monthlyRent || 0);
         tempDate.setMonth(tempDate.getMonth() + 1);
      }
    }
    return { collected, pending, months };
  }

  getHouseUtilityBill(house: RentalHouse, type: 'electricity' | 'water'): number {
    return this.rentalUtilityBills[house.id!]?.[type] || 0;
  }

  isHouseUtilityPaid(house: RentalHouse, type: 'electricity' | 'water'): boolean {
    const cached = this.rentalUtilityBills[house.id!];
    return cached ? (type === 'electricity' ? cached.electricityPaid === true : cached.waterPaid === true) : false;
  }

  getHouseUtilityPaidDate(house: RentalHouse, type: 'electricity' | 'water'): string {
    const cached = this.rentalUtilityBills[house.id!];
    return cached ? (type === 'electricity' ? cached.electricityPaidDate || '' : cached.waterPaidDate || '') : '';
  }

  isRentIncreaseDue(house: RentalHouse): boolean {
    if (!house.arrivedDate || house.status !== 'Occupied') return false;
    const referenceDateStr = house.lastRentIncreaseDate || house.arrivedDate;
    const refDate = new Date(referenceDateStr);
    const today = new Date();
    let yearsPassed = today.getFullYear() - refDate.getFullYear();
    const monthDiff = today.getMonth() - refDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < refDate.getDate())) yearsPassed--;
    return yearsPassed >= 1;
  }
}
