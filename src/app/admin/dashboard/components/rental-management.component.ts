import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { RentalHouse, RentalBill, RentalExpense, PastTenancy } from '../../services/rental.service';
import { Bill, TrackedService } from '../../services/bill.service';

@Component({
  selector: 'app-rental-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="card-animate space-y-8" style="animation-delay:0.05s">
      
      @if (rentalView === 'houses') {


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
              
              <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
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

        <!-- House View (Grid / List Toggle) -->
        @if (houses.length === 0) {
          <div class="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-50">
              <p class="text-gray-400 font-black uppercase tracking-widest text-xs mb-4">No rental properties registered</p>
              <button (click)="onRegisterProperty.emit()" class="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer">
                Register New Property
              </button>
          </div>
        } @else {
          <!-- Controls Bar: Search & View Modes & Register Button -->
          <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-md">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 dark:text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input type="text" 
                     [(ngModel)]="searchQuery" 
                     placeholder="Search properties, renters..." 
                     class="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:border-transparent transition-all shadow-sm" />
              <!-- Clear query button -->
              <button *ngIf="searchQuery" (click)="searchQuery = ''" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- View Switcher & Register Button -->
            <div class="flex items-center justify-between md:justify-end gap-3">
              <!-- Grid/List Switcher -->
              <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700/50">
                <button (click)="viewMode = 'grid'" 
                        [class.bg-white]="viewMode === 'grid'"
                        [class.dark:bg-gray-700]="viewMode === 'grid'"
                        [class.shadow-sm]="viewMode === 'grid'"
                        [class.text-indigo-600]="viewMode === 'grid'"
                        class="p-2 rounded-lg transition-all text-gray-500 hover:text-indigo-600 flex items-center justify-center shrink-0 cursor-pointer"
                        title="Grid View">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-16zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button (click)="viewMode = 'list'" 
                        [class.bg-white]="viewMode === 'list'"
                        [class.dark:bg-gray-700]="viewMode === 'list'"
                        [class.shadow-sm]="viewMode === 'list'"
                        [class.text-indigo-600]="viewMode === 'list'"
                        class="p-2 rounded-lg transition-all text-gray-500 hover:text-indigo-600 flex items-center justify-center shrink-0 cursor-pointer"
                        title="List View">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <!-- Register New Property Button -->
              <button (click)="onRegisterProperty.emit()" class="px-5 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-sm cursor-pointer">
                 Register New Property
              </button>
            </div>
          </div>

          @if (filteredHouses.length === 0) {
            <div class="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] opacity-50">
                <p class="text-gray-400 font-black uppercase tracking-widest text-xs">No properties match your search</p>
            </div>
          } @else {
            @if (viewMode === 'grid') {
              <!-- House Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 perspective-1000">
                <div *ngFor="let house of filteredHouses; trackBy: trackByHouseId" 
                   (click)="toggleExpand(house.id!, $event)"
                   class="preserve-3d w-full transition-transform duration-700 cursor-pointer"
                   [class.flipped]="expandedHouseIds[house.id!]"
                   style="height: 380px;">
                  
                  <!-- Front Side (Summary) -->
                  <div class="backface-hidden absolute inset-0 w-full h-full bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                       [class.ring-2]="activeHouseId === house.id" [class.ring-indigo-500]="activeHouseId === house.id">
                    
                    <!-- Top Summary & Actions -->
                    <div>
                      <div class="flex items-center justify-end gap-1.5 mb-4">
                        <button (click)="onRefetchBills.emit(house); $event.stopPropagation()" 
                                class="p-1 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700 flex items-center justify-center shrink-0 cursor-pointer"
                                [title]="'Refetch Bills'">
                          <svg class="w-3.5 h-3.5" [class.animate-spin]="refetchingHouseIds[house.id!]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        </button>
                        <button *ngIf="house.status === 'Occupied' && house.renterPhone"
                                (click)="onSendRentReminder.emit(house); $event.stopPropagation()"
                                class="p-1 bg-[#25D366] hover:bg-[#1ebe59] rounded-lg text-white transition-colors shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                                [title]="'Chat on WhatsApp'">
                          <svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                        </button>
                        <a *ngIf="house.status === 'Occupied' && house.renterPhone"
                           href="tel:{{ house.renterPhone }}"
                           (click)="$event.stopPropagation()"
                           class="p-1 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                           [title]="'Call Tenant'">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.272.387-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                        </a>
                        <span *ngIf="isRentIncreaseDue(house)" class="text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse">
                          Increase
                        </span>
                        <span class="text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm"
                              [ngClass]="house.status === 'Occupied' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'">
                          {{ house.status }}
                        </span>
                      </div>

                      <div class="flex items-start gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        </div>
                        <div class="min-w-0 flex-1 text-left">
                          <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate" [title]="house.houseName">{{ house.houseName }}</h3>
                          <p *ngIf="house.status === 'Occupied'" class="text-[10px] font-black text-slate-700 dark:text-slate-300 mt-1 truncate">{{ house.renterName }} • {{ house.renterPhone }}</p>
                          <p *ngIf="house.status === 'Vacant'" class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">No Active Tenant</p>
                        </div>
                      </div>
                    </div>

                    <!-- Graphic Middle Area -->
                    <div class="flex items-center justify-center my-3 relative overflow-hidden rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border border-dashed border-gray-100 dark:border-gray-800/80 h-28 shrink-0">
                      @if (house.status === 'Occupied') {
                        <div class="text-center space-y-1 z-10 animate-fade-in">
                          <div class="inline-flex p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full mb-1">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <p class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Tenant Active</p>
                          <p class="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{{ getCompletedMonthsOccupied(house) }} Months Occupied</p>
                        </div>
                        <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl"></div>
                      } @else {
                        <div class="text-center space-y-1 z-10 animate-fade-in">
                          <div class="inline-flex p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-full mb-1">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p class="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">Vacant / Available</p>
                          <p class="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Ready for Tenant</p>
                        </div>
                        <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-xl"></div>
                      }
                    </div>

                    <!-- Bottom Details Summary -->
                    <div class="pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-xs font-bold shrink-0">
                      <div class="flex flex-col text-left">
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Rent:</span>
                        <span class="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">{{ getLastRentCollected(house) }}</span>
                      </div>
                      <div class="flex flex-col items-end">
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Electricity:</span>
                        <div class="flex items-center gap-1.5 mt-1">
                          <span class="text-[10px] font-black" [class]="isHouseUtilityPaid(house, 'electricity') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                            ₹{{ getHouseUtilityBill(house, 'electricity') }}
                          </span>
                          <span class="text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm"
                                [ngClass]="isHouseUtilityPaid(house, 'electricity') ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-rose-500 text-white shadow-rose-500/10'">
                            {{ isHouseUtilityPaid(house, 'electricity') ? 'Paid' : 'Unpaid' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Back Side (Detailed View) -->
                  <div class="backface-hidden rotate-y-180 absolute inset-0 w-full h-full bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                       [class.ring-2]="activeHouseId === house.id" [class.ring-indigo-500]="activeHouseId === house.id">
                    
                    <!-- Back Card Header -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <h4 class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Full Property Details</h4>
                        <!-- Close / Flip back button -->
                        <button (click)="expandedHouseIds[house.id!] = false; $event.stopPropagation()" class="p-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-900 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm border border-gray-100/30 dark:border-gray-800 flex items-center justify-center shrink-0 cursor-pointer">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div class="text-left mb-3">
                        <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate" [title]="house.houseName">{{ house.houseName }}</h3>
                        <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate" [title]="house.fullAddress || ''">Address: {{ house.fullAddress || 'Address Not Set' }}</p>
                        <div class="flex items-center gap-x-3 mt-1.5">
                          <span class="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">Arrived: {{ house.arrivedDate | date:'dd MMM yyyy' }}</span>
                          <span *ngIf="house.status === 'Occupied' && house.arrivedDate" class="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Occupied: {{ getCompletedMonthsOccupied(house) }}m completed</span>
                        </div>
                      </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 gap-2 bg-gray-50/70 dark:bg-gray-900/30 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div class="min-w-0 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Electricity</span>
                          <span class="block text-xs font-black leading-tight mt-0.5"
                                [class]="isHouseUtilityPaid(house, 'electricity') ? 'text-emerald-500' : 'text-amber-500'">
                            ₹{{ getHouseUtilityBill(house, 'electricity') }}
                          </span>
                          <span *ngIf="getHouseUtilityPaidDate(house, 'electricity')" class="block text-[6px] font-black text-emerald-500 uppercase tracking-widest truncate mt-0.5">Paid {{ getHouseUtilityPaidDate(house, 'electricity') }}</span>
                      </div>
                      <div class="min-w-0 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Water</span>
                          <span class="block text-xs font-black leading-tight mt-0.5"
                                [class]="isHouseUtilityPaid(house, 'water') ? 'text-emerald-500' : 'text-blue-500'">
                            ₹{{ getHouseUtilityBill(house, 'water') }}
                          </span>
                      </div>
                      <div class="min-w-0 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Pending</span>
                          <span class="block text-xs font-black text-rose-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).pending" prefix="₹"></span>
                      </div>
                      <div class="min-w-0 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Collected</span>
                          <span class="block text-xs font-black text-green-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).collected" prefix="₹"></span>
                      </div>
                      <div class="min-w-0 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Expenses</span>
                          <span class="block text-xs font-black text-amber-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).expensesTotal" prefix="₹"></span>
                      </div>
                      <div class="min-w-0 pt-1.5 border-t border-gray-100 dark:border-gray-800 text-left">
                          <span class="block text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">Net Yield</span>
                          <span class="block text-xs font-black text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).netYield" prefix="₹"></span>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-1.5 mt-2 shrink-0">
                      <button (click)="onViewLedger.emit(house.id!); $event.stopPropagation()" class="flex-1 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all hover:opacity-90">History</button>
                      <button (click)="onEditProperty.emit(house); $event.stopPropagation()" class="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shrink-0 flex items-center justify-center cursor-pointer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button (click)="onDeleteProperty.emit(house.id!); $event.stopPropagation()" class="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shrink-0 flex items-center justify-center cursor-pointer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            } @else {
            <!-- House List -->
            <div class="space-y-3">
              <div *ngFor="let house of filteredHouses; trackBy: trackByHouseId" 
                   (click)="toggleExpand(house.id!, $event)"
                   class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer animate-fade-in">
                
                <!-- List Row Summary Header -->
                <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5 min-w-0 flex-1">
                    <!-- Icon -->
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                    </div>
                    <!-- House Details -->
                    <div class="min-w-0 flex-1 text-left">
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate" [title]="house.houseName">{{ house.houseName }}</h3>
                        <span class="text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm leading-none flex items-center"
                              [ngClass]="house.status === 'Occupied' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'">
                            {{ house.status }}
                        </span>
                        <span *ngIf="isRentIncreaseDue(house)" class="text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-amber-500 text-white shadow-sm animate-pulse leading-none flex items-center">
                          Increase
                        </span>
                      </div>
                      <!-- Renter info -->
                      <p *ngIf="house.status === 'Occupied'" class="text-[10px] font-black text-slate-700 dark:text-slate-300 mt-1 truncate">{{ house.renterName }} • {{ house.renterPhone }}</p>
                      <p *ngIf="house.status === 'Vacant'" class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">No Active Tenant</p>
                    </div>
                  </div>

                  <!-- Last Rent Collected / Actions -->
                  <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
                    <div class="text-left sm:text-right">
                      <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Last Rent Collected</span>
                      <span class="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-tight mt-0.5">{{ getLastRentCollected(house) }}</span>
                    </div>

                    <!-- Electricity Badge on List Thumbnail -->
                    <div class="text-left sm:text-right min-w-[50px]">
                      <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest font-sans">Electricity</span>
                      <div class="flex items-center justify-start sm:justify-end gap-1.5 mt-1">
                        <span class="text-[10px] font-black" [class]="isHouseUtilityPaid(house, 'electricity') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                          ₹{{ getHouseUtilityBill(house, 'electricity') }}
                        </span>
                        <span class="inline-block text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm"
                              [ngClass]="isHouseUtilityPaid(house, 'electricity') ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-rose-500 text-white shadow-rose-500/10'">
                          {{ isHouseUtilityPaid(house, 'electricity') ? 'Paid' : 'Unpaid' }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <button (click)="onRefetchBills.emit(house); $event.stopPropagation()" 
                              class="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm border border-gray-100/50 dark:border-gray-700 flex items-center justify-center shrink-0 cursor-pointer"
                              [title]="'Refetch Bills'">
                        <svg class="w-3.5 h-3.5" [class.animate-spin]="refetchingHouseIds[house.id!]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      </button>
                      <button *ngIf="house.status === 'Occupied' && house.renterPhone"
                              (click)="onSendRentReminder.emit(house); $event.stopPropagation()"
                              class="p-1.5 bg-[#25D366] hover:bg-[#1ebe59] rounded-lg text-white transition-colors shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                              [title]="'Chat on WhatsApp'">
                        <svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                        </svg>
                      </button>
                      <a *ngIf="house.status === 'Occupied' && house.renterPhone"
                         href="tel:{{ house.renterPhone }}"
                         (click)="$event.stopPropagation()"
                         class="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                         [title]="'Call Tenant'">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.272.387-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </a>
                      <!-- Expand Chevron -->
                      <div class="w-8 h-8 rounded-lg border border-gray-100 dark:border-gray-700/50 flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all bg-gray-50/50 dark:bg-gray-800/50">
                        <svg class="w-4 h-4 transition-transform duration-300" [class.rotate-180]="expandedHouseIds[house.id!]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- List Expanded Content Panel -->
                @if (expandedHouseIds[house.id!]) {
                  <div class="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 bg-gray-50/20 dark:bg-gray-900/10 space-y-4 animate-fade-in text-left">
                    <!-- Address & Timeline Details -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                      <p class="text-xs font-bold text-gray-500 uppercase tracking-widest leading-snug" [title]="house.fullAddress || ''">Address: {{ house.fullAddress || 'Address Not Set' }}</p>
                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <p class="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Arrived: {{ house.arrivedDate | date:'dd MMM yyyy' }}</p>
                        <p *ngIf="house.status === 'Occupied' && house.arrivedDate" class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Occupied: {{ getCompletedMonthsOccupied(house) }} {{ getCompletedMonthsOccupied(house) === 1 ? 'Month' : 'Months' }} completed</p>
                      </div>
                    </div>

                    <!-- Grid of detailed stats -->
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Electricity</span>
                          <span class="block text-sm font-black leading-tight mt-0.5"
                                [class]="isHouseUtilityPaid(house, 'electricity') ? 'text-emerald-500' : 'text-amber-500'">₹{{ getHouseUtilityBill(house, 'electricity') }}</span>
                          <span *ngIf="getHouseUtilityPaidDate(house, 'electricity')" class="block text-[7px] font-black text-emerald-500 uppercase tracking-widest truncate mt-0.5">Paid {{ getHouseUtilityPaidDate(house, 'electricity') }}</span>
                      </div>
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Water</span>
                          <span class="block text-sm font-black leading-tight mt-0.5"
                                [class]="isHouseUtilityPaid(house, 'water') ? 'text-emerald-500' : 'text-blue-500'">₹{{ getHouseUtilityBill(house, 'water') }}</span>
                      </div>
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Pending</span>
                          <span class="block text-sm font-black text-rose-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).pending" prefix="₹"></span>
                      </div>
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Collected</span>
                          <span class="block text-sm font-black text-green-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).collected" prefix="₹"></span>
                      </div>
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Expenses</span>
                          <span class="block text-sm font-black text-amber-500 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).expensesTotal" prefix="₹"></span>
                      </div>
                      <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 text-left">
                          <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">Net Yield</span>
                          <span class="block text-sm font-black text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5" [appCountUp]="getHouseStats(house).netYield" prefix="₹"></span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 justify-end pt-2">
                      <button (click)="onViewLedger.emit(house.id!); $event.stopPropagation()" class="px-5 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all hover:opacity-90">History</button>
                      <button (click)="onEditProperty.emit(house); $event.stopPropagation()" class="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shrink-0 flex items-center justify-center cursor-pointer">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button (click)="onDeleteProperty.emit(house.id!); $event.stopPropagation()" class="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shrink-0 flex items-center justify-center cursor-pointer">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      }
    }

      <!-- Billing Details / Property History Screen -->
      @if (rentalView === 'ledger' && activeHouse; as house) {
        <div class="ledger-screen animate-fade-up" id="property-history-screen">

          <!-- ══════════════════════════════════════════════════════
               HERO HEADER  (back btn · title · action buttons)
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-hero">
            <!-- Decorative overlays -->
            <div class="ledger-hero-overlay"></div>
            <!-- SVG property illustration backdrop -->
            <svg class="ledger-hero-illustration" viewBox="0 0 200 120" fill="none" aria-hidden="true">
              <path d="M20 80 L60 40 L100 80" stroke="rgba(99,102,241,0.25)" stroke-width="2" stroke-linejoin="round"/>
              <rect x="30" y="80" width="60" height="35" rx="2" fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.2)" stroke-width="1.5"/>
              <rect x="44" y="90" width="12" height="25" rx="1" fill="rgba(99,102,241,0.18)"/>
              <rect x="62" y="90" width="12" height="14" rx="1" fill="rgba(99,102,241,0.15)"/>
              <path d="M80 80 L110 52 L140 80" stroke="rgba(139,92,246,0.2)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="88" y="80" width="44" height="30" rx="2" fill="rgba(139,92,246,0.07)" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>
              <rect x="100" y="89" width="9" height="21" rx="1" fill="rgba(139,92,246,0.15)"/>
              <circle cx="160" cy="35" r="15" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.15)" stroke-width="1"/>
              <line x1="160" y1="20" x2="160" y2="50" stroke="rgba(251,191,36,0.3)" stroke-width="1"/>
              <line x1="145" y1="35" x2="175" y2="35" stroke="rgba(251,191,36,0.3)" stroke-width="1"/>
            </svg>

            <!-- Top bar -->
            <div class="ledger-topbar">
              <button (click)="onBackToHouses.emit()" class="ledger-back-btn" title="Back to properties">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div class="ledger-topbar-center">
                <h1 class="ledger-hero-title">{{ house.houseName }}</h1>
                <p class="ledger-hero-sub">
                  <svg class="w-3 h-3 inline-block mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ house.fullAddress || 'Address not set' }}
                </p>
              </div>
              <div class="ledger-topbar-actions">
                <span class="ledger-status-badge" [ngClass]="house.status.toLowerCase() === 'occupied' ? 'ledger-status-occupied' : 'ledger-status-vacant'">
                  <span class="ledger-status-dot" [ngClass]="house.status.toLowerCase() === 'occupied' ? 'bg-emerald-400' : 'bg-gray-400'"></span>
                  {{ house.status }}
                </span>
              </div>
            </div>

            <!-- Action buttons row -->
            <div class="ledger-action-row">
              <button *ngIf="house.status.toLowerCase() === 'occupied'" (click)="openVacateForm()" class="ledger-btn-danger">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Vacate Tenant
              </button>
              <button (click)="onAddMonthlyRecord.emit()" class="ledger-btn-primary">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Record Collection
              </button>
              <button (click)="onEditProperty.emit(house)" class="ledger-btn-ghost" title="Edit property">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════
               STATS CARDS ROW
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-stats-grid">
            <!-- Monthly Rent -->
            <div class="ledger-stat-card ledger-stat-indigo">
              <div class="ledger-stat-icon-wrap" style="background:rgba(99,102,241,0.15)">
                <!-- House / Rent icon -->
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 21V12h6v9"/>
                </svg>
              </div>
              <div class="ledger-stat-body">
                <p class="ledger-stat-label">Monthly Rent</p>
                <p class="ledger-stat-value" style="color:var(--c-rent)">₹{{ (house.monthlyRent || 0).toLocaleString('en-IN') }}</p>
                <p class="ledger-stat-sub">Due on 6th every month</p>
              </div>
            </div>

            <!-- Pending Amount -->
            <div class="ledger-stat-card ledger-stat-rose">
              <div class="ledger-stat-icon-wrap" style="background:rgba(251,113,133,0.15)">
                <!-- Alert / Pending icon -->
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fb7185" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div class="ledger-stat-body">
                <p class="ledger-stat-label">Pending Amount</p>
                <p class="ledger-stat-value" style="color:var(--c-due)" [appCountUp]="getLedgerPendingAmount(house)" prefix="₹"></p>
                <p class="ledger-stat-sub" *ngIf="getLedgerPendingAmount(house) > 0" style="color:var(--c-due)">
                  {{ getLedgerPendingBillsCount(house) }} Payment{{ getLedgerPendingBillsCount(house) > 1 ? 's' : '' }} Pending
                </p>
                <p class="ledger-stat-sub" *ngIf="getLedgerPendingAmount(house) === 0" style="color:var(--c-paid)">All Clear ✓</p>
              </div>
            </div>

            <!-- Advance Deposit -->
            <div class="ledger-stat-card ledger-stat-emerald">
              <div class="ledger-stat-icon-wrap" style="background:rgba(52,211,153,0.15)">
                <!-- Shield / Secure deposit icon -->
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div class="ledger-stat-body">
                <p class="ledger-stat-label">Advance Deposit</p>
                <p class="ledger-stat-value" style="color:var(--c-paid)">₹{{ (house.advanceAmount || 0).toLocaleString('en-IN') }}</p>
                <p class="ledger-stat-sub" style="color:var(--c-paid)">Refundable on exit</p>
              </div>
            </div>

            <!-- Stay Duration -->
            <div class="ledger-stat-card ledger-stat-sky">
              <div class="ledger-stat-icon-wrap" style="background:rgba(56,189,248,0.15)">
                <!-- Duration / Calendar icon -->
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 2v4M8 2v4M3 10h18"/>
                  <circle cx="12" cy="15" r="2" fill="#38bdf8" stroke="none"/>
                </svg>
              </div>
              <div class="ledger-stat-body">
                <p class="ledger-stat-label">Stay Duration</p>
                <p class="ledger-stat-value" style="color:var(--c-water)">
                  {{ getLedgerStayYears(house) }}<span style="font-size:0.65rem;margin-left:2px">Yrs</span>
                  <span class="ledger-months-badge" *ngIf="getLedgerStayExtraMonths(house) > 0">{{ getLedgerStayExtraMonths(house) }}m</span>
                </p>
                <p class="ledger-stat-sub" *ngIf="house.arrivedDate">Since {{ house.arrivedDate | date:'dd MMM, yyyy' }}</p>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════
               TENANT INFO CARD
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-section-grid ledger-section-grid-full">
            <div class="ledger-card" *ngIf="house.status === 'Occupied'">
              <div class="ledger-card-header">
                <!-- Monogram avatar with tenant initial -->
                <div class="ledger-tenant-avatar">
                  <span class="ledger-tenant-monogram">{{ (house.renterName || '?').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="ledger-tenant-name">{{ house.renterName }}</h3>
                    <span class="ledger-primary-badge">Primary Tenant</span>
                  </div>
                  <p class="ledger-tenant-phone">{{ house.renterPhone }}</p>
                </div>
                <div class="ledger-tenant-actions">
                  <a *ngIf="house.renterPhone" href="tel:{{ house.renterPhone }}" class="ledger-action-btn ledger-action-call" title="Call">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.272.387-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                    </svg>
                    Call
                  </a>
                  <button *ngIf="house.renterPhone" (click)="onSendRentReminder.emit(house)" class="ledger-action-btn ledger-action-whatsapp" title="WhatsApp">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button class="ledger-action-btn ledger-action-agree" title="Agreement">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Agreement
                  </button>
                </div>
              </div>

              <!-- Tenancy Meta Row -->
              <div class="ledger-tenancy-meta">
                <div class="ledger-meta-item">
                  <span class="ledger-meta-icon">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <div>
                    <p class="ledger-meta-label">Move-in Date</p>
                    <p class="ledger-meta-value">{{ house.arrivedDate | date:'MMM dd, yyyy' }}</p>
                  </div>
                </div>
                <div class="ledger-meta-item">
                  <span class="ledger-meta-icon">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </span>
                  <div>
                    <p class="ledger-meta-label">Occupancy</p>
                    <p class="ledger-meta-value">{{ getCompletedMonthsOccupied(house) }} Months</p>
                  </div>
                </div>
                <div class="ledger-meta-item">
                  <span class="ledger-meta-icon" style="background:rgba(52,211,153,0.15)">
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </span>
                  <div>
                    <p class="ledger-meta-label">Agreement Status</p>
                    <p class="ledger-meta-value" style="color:#34d399">Active</p>
                  </div>
                </div>
              </div>

              <!-- Tenancy Progress Bar -->
              <div class="ledger-progress-wrap">
                <div class="ledger-progress-header">
                  <span class="ledger-progress-label">Tenancy Progress</span>
                  <span class="ledger-progress-pct">{{ getLedgerTenancyProgress(house) }}% Completed</span>
                </div>
                <div class="ledger-progress-track">
                  <div class="ledger-progress-fill" [style.width]="getLedgerTenancyProgress(house) + '%'"></div>
                </div>
                <div class="ledger-progress-dates">
                  <span>Started: {{ house.arrivedDate | date:'dd MMM, yyyy' }}</span>
                  <span>Expected End: {{ getLedgerExpectedEnd(house) | date:'dd MMM, yyyy' }}</span>
                </div>
              </div>
            </div>

            <!-- Vacant State -->
            <div class="ledger-card" *ngIf="house.status === 'Vacant'">
              <div class="flex items-center gap-4 py-4">
                <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-black text-gray-950 dark:text-white">No Active Tenant</h3>
                  <p class="text-sm text-gray-400 mt-1">This property is currently vacant and available for rent.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════
               PAYMENT TIMELINE
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-card">
            <div class="ledger-card-title-row">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <h3 class="ledger-card-title">Payment Timeline</h3>
              </div>
            </div>

            <!-- Bills list -->
            <div class="ledger-timeline" *ngIf="(house.bills || []).length > 0; else noBills">
              <div *ngFor="let bill of sortBills(house.bills); trackBy: trackByBillDate; let i = index; let last = last" class="ledger-timeline-item">
                <!-- Vertical line -->
                <div class="ledger-timeline-line" *ngIf="!last"></div>
                <!-- Dot -->
                <div class="ledger-timeline-dot" [ngClass]="isMonthlyBillFullyPaid(house, bill) ? 'ledger-dot-paid' : 'ledger-dot-pending'">
                  <svg *ngIf="isMonthlyBillFullyPaid(house, bill)" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <div *ngIf="!isMonthlyBillFullyPaid(house, bill)" class="w-2 h-2 rounded-full bg-white"></div>
                </div>

                <!-- Bill Content -->
                <div class="ledger-timeline-content" [ngClass]="isMonthlyBillFullyPaid(house, bill) ? 'ledger-bill-paid' : 'ledger-bill-pending'">
                  <div class="ledger-bill-header">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="ledger-bill-month">{{ bill.billDate | date:'MMMM yyyy' }}</span>
                        <span class="ledger-bill-status-badge" [ngClass]="isMonthlyBillFullyPaid(house, bill) ? 'ledger-badge-paid' : 'ledger-badge-pending'">
                          {{ isMonthlyBillFullyPaid(house, bill) ? 'Paid' : 'Pending' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <button *ngIf="bill.rentAmount > 0" (click)="onPrintRentReceipt.emit({house, bill})" class="ledger-icon-btn" title="Download Receipt">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                      </button>
                      <button (click)="onEditBill.emit({bill, index: findIndex(bill, house)})" class="ledger-icon-btn ledger-icon-edit" title="Edit Bill">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button (click)="onDeleteBill.emit(findIndex(bill, house))" class="ledger-icon-btn ledger-icon-delete" title="Delete Bill">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Breakdown rows -->
                  <div class="ledger-bill-breakdown">
                    <div class="ledger-breakdown-row">
                      <span class="ledger-breakdown-label">Rent</span>
                      <span class="ledger-breakdown-amount" style="color:#818cf8" [appCountUp]="bill.rentAmount" prefix="₹"></span>
                      <span class="ledger-breakdown-badge" style="background:rgba(52,211,153,0.15);color:#34d399">✓ Paid</span>
                    </div>
                    <div class="ledger-breakdown-row">
                      <span class="ledger-breakdown-label">Electricity</span>
                      <span class="ledger-breakdown-amount" [style.color]="!isMonthlyUtilityPaid(house, bill, 'electricity') && bill.electricBill > 0 ? '#fb7185' : '#34d399'" [appCountUp]="bill.electricBill" prefix="₹"></span>
                      <span class="ledger-breakdown-badge" [style]="!isMonthlyUtilityPaid(house, bill, 'electricity') && bill.electricBill > 0 ? 'background:rgba(251,113,133,0.15);color:#fb7185' : 'background:rgba(52,211,153,0.15);color:#34d399'">
                        {{ (!isMonthlyUtilityPaid(house, bill, 'electricity') && bill.electricBill > 0) ? 'Due' : '✓ Paid' }}
                      </span>
                    </div>
                    <div class="ledger-breakdown-row">
                      <span class="ledger-breakdown-label">Water</span>
                      <span class="ledger-breakdown-amount" [style.color]="!isMonthlyUtilityPaid(house, bill, 'water') && bill.waterBill > 0 ? '#fb7185' : '#34d399'" [appCountUp]="bill.waterBill" prefix="₹"></span>
                      <span class="ledger-breakdown-badge" [style]="!isMonthlyUtilityPaid(house, bill, 'water') && bill.waterBill > 0 ? 'background:rgba(251,113,133,0.15);color:#fb7185' : 'background:rgba(52,211,153,0.15);color:#34d399'">
                        {{ (!isMonthlyUtilityPaid(house, bill, 'water') && bill.waterBill > 0) ? 'Due' : '✓ Paid' }}
                      </span>
                    </div>
                    <div class="ledger-breakdown-total" *ngIf="!isMonthlyBillFullyPaid(house, bill)">
                      <span class="ledger-breakdown-label font-black text-gray-950 dark:text-white">Total Due</span>
                      <span class="font-black" style="color:#fb7185" [appCountUp]="getMonthlyPendingTotal(house, bill)" prefix="₹"></span>
                      <button (click)="onAddMonthlyRecord.emit()" class="ledger-collect-btn">Collect Payment</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ng-template #noBills>
              <div class="ledger-empty-state">
                <svg class="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p class="text-gray-500 text-xs font-bold uppercase tracking-widest">No payment records yet</p>
                <button (click)="onAddMonthlyRecord.emit()" class="ledger-collect-btn mt-3">Record First Collection</button>
              </div>
            </ng-template>
          </div>

          <!-- ══════════════════════════════════════════════════════
               BILLS COLLECTION CHART
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-card" *ngIf="(house.bills || []).length > 0">
            <div class="ledger-card-title-row">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <h3 class="ledger-card-title">Bills Collection Chart</h3>
              </div>
              <!-- Legend -->
              <div class="flex items-center gap-3">
                <span class="ledger-chart-legend" style="background:var(--c-rent)">Rent</span>
                <span class="ledger-chart-legend" style="background:var(--c-electric)">Elec</span>
                <span class="ledger-chart-legend" style="background:var(--c-water)">Water</span>
              </div>
            </div>
            <div class="ledger-chart-wrap">
              <canvas baseChart
                [data]="ledgerChartCache[house.id!] || getLedgerChartData(house)"
                [options]="ledgerChartOptions"
                type="bar">
              </canvas>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════
               MAINTENANCE & EXPENSE LOG + PROPERTY INFO  (2-col)
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-two-col-grid">

            <!-- Maintenance Log -->
            <div class="ledger-card">
              <div class="ledger-card-title-row">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <h3 class="ledger-card-title">Maintenance & Expense Log</h3>
                </div>
                <button (click)="openExpenseForm()" class="ledger-add-btn">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Expense
                </button>
              </div>

              <div class="space-y-3" *ngIf="(house.expenses || []).length > 0; else noExpenses">
                <div *ngFor="let exp of house.expenses || []" class="ledger-expense-item">
                  <!-- Per-category unique SVG icon -->
                  <div class="ledger-expense-icon" [ngClass]="getExpenseCategoryClass(exp.category)">
                    <!-- Plumbing -->
                    <svg *ngIf="exp.category === 'Plumbing'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v4m0 0a3 3 0 103 3M12 7a3 3 0 00-3 3m6 0H6m9 0a3 3 0 11-6 0M6 10H3m9 6v5"/>
                    </svg>
                    <!-- Electrical -->
                    <svg *ngIf="exp.category === 'Electrical'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <!-- Painting -->
                    <svg *ngIf="exp.category === 'Painting'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    <!-- Cleaning -->
                    <svg *ngIf="exp.category === 'Cleaning'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <!-- Tax -->
                    <svg *ngIf="exp.category === 'Tax'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                    </svg>
                    <!-- Repairs -->
                    <svg *ngIf="exp.category === 'Repairs'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
                    </svg>
                    <!-- Other (fallback) -->
                    <svg *ngIf="!['Plumbing','Electrical','Painting','Cleaning','Tax','Repairs'].includes(exp.category)" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="ledger-expense-title">{{ exp.description || exp.category }}</p>
                    <p class="ledger-expense-date">{{ exp.date | date:'dd MMM yyyy' }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="ledger-expense-amount">₹{{ exp.amount.toLocaleString('en-IN') }}</span>
                    <button (click)="onDeleteExpense.emit({houseId: house.id!, expenseId: exp.id})" class="ledger-icon-btn ledger-icon-delete">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <!-- Total -->
                <div class="ledger-expense-total">
                  <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Expenses (This Year)</span>
                  <span class="font-black text-rose-400" [appCountUp]="getLedgerYearExpenses(house)" prefix="₹"></span>
                </div>
              </div>

              <ng-template #noExpenses>
                <div class="ledger-empty-state">
                  <svg class="w-6 h-6 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  </svg>
                  <p class="text-gray-500 text-xs font-bold uppercase tracking-widest">No expenses logged</p>
                </div>
              </ng-template>
            </div>

            <!-- Property Information -->
            <div class="ledger-card">
              <div class="ledger-card-title-row">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  <h3 class="ledger-card-title">Property Information</h3>
                </div>
                <button (click)="onEditProperty.emit(house)" class="ledger-ghost-icon-btn" title="Edit">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
              </div>

              <div class="ledger-prop-grid">
                <div class="ledger-prop-item">
                  <span class="ledger-prop-label">Property Name</span>
                  <span class="ledger-prop-value">{{ house.houseName }}</span>
                </div>
                <div class="ledger-prop-item">
                  <span class="ledger-prop-label">Status</span>
                  <span class="ledger-prop-value" [style.color]="house.status === 'Occupied' ? '#34d399' : '#94a3b8'">{{ house.status }}</span>
                </div>
                <div class="ledger-prop-item">
                  <span class="ledger-prop-label">Monthly Rent</span>
                  <span class="ledger-prop-value">₹{{ (house.monthlyRent || 0).toLocaleString('en-IN') }}</span>
                </div>
                <div class="ledger-prop-item">
                  <span class="ledger-prop-label">Advance Deposit</span>
                  <span class="ledger-prop-value">₹{{ (house.advanceAmount || 0).toLocaleString('en-IN') }}</span>
                </div>
                <div class="ledger-prop-item" *ngIf="house.electricMeterNo">
                  <span class="ledger-prop-label">Electricity Meter</span>
                  <span class="ledger-prop-value">{{ house.electricMeterNo }}</span>
                </div>
                <div class="ledger-prop-item" *ngIf="house.waterBillNo">
                  <span class="ledger-prop-label">Water Bill No.</span>
                  <span class="ledger-prop-value">{{ house.waterBillNo }}</span>
                </div>
                <div class="ledger-prop-item col-span-2" *ngIf="house.fullAddress">
                  <span class="ledger-prop-label">Address</span>
                  <span class="ledger-prop-value">{{ house.fullAddress }}</span>
                </div>
                <div class="ledger-prop-item">
                  <span class="ledger-prop-label">Rent Increase</span>
                  <span class="ledger-prop-value" [style.color]="isRentIncreaseDue(house) ? '#fbbf24' : '#34d399'">
                    {{ isRentIncreaseDue(house) ? 'Overdue' : 'Not Due' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════
               PAST TENANCIES
          ══════════════════════════════════════════════════════ -->
          <div class="ledger-card" *ngIf="(house.pastTenancies || []).length > 0 || true">
            <div class="ledger-card-title-row">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                <h3 class="ledger-card-title">Past Tenancies</h3>
              </div>
              <span class="text-[10px] font-black text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors">View All Archives →</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" *ngIf="(house.pastTenancies || []).length > 0; else noPastTenancies">
              <div *ngFor="let past of house.pastTenancies || []" class="ledger-past-card">
                <div class="ledger-past-header">
                  <div class="ledger-past-avatar">
                    <svg class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="ledger-past-name">{{ past.renterName }}</h4>
                    <div class="flex items-center gap-1 mt-0.5">
                      <svg class="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span class="text-[10px] text-gray-500 font-medium">{{ past.arrivedDate | date:'MMM yyyy' }} – {{ past.vacatedDate | date:'MMM yyyy' }}</span>
                    </div>
                  </div>
                  <span class="ledger-past-duration-badge">{{ past.bills.length }} Months</span>
                </div>
                <div class="ledger-past-stats">
                  <div>
                    <span class="ledger-prop-label">Deductions</span>
                    <span class="text-xs font-black text-rose-400">₹{{ (past.deductions || 0).toLocaleString('en-IN') }}</span>
                  </div>
                  <div>
                    <span class="ledger-prop-label">Refunded</span>
                    <span class="text-xs font-black text-emerald-400">₹{{ (past.advanceRefunded || 0).toLocaleString('en-IN') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <ng-template #noPastTenancies>
              <div class="ledger-empty-state">
                <svg class="w-6 h-6 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p class="text-gray-500 text-xs font-bold uppercase tracking-widest">No historical tenancy archives</p>
              </div>
            </ng-template>
          </div>

        </div><!-- end .ledger-screen -->
      }

      <!-- Expense Modal -->
      @if (showExpenseForm && activeHouse) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-up border border-gray-100 dark:border-gray-800 flex flex-col">
               <div class="p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                  <div class="flex justify-between items-center mb-6">
                     <div>
                        <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Add Maintenance Expense</h3>
                        <p class="text-xs text-gray-500">Record maintenance or utility expenses for {{ activeHouse.houseName }}</p>
                     </div>
                     <button (click)="showExpenseForm = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  
                  <div class="space-y-6">
                    <div>
                        <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                        <select [(ngModel)]="expenseFormCategory" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-700 dark:text-gray-300">
                          <option value="Plumbing">Plumbing</option>
                          <option value="Electrical">Electrical</option>
                          <option value="Painting">Painting</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Tax">Property Tax</option>
                          <option value="Repairs">Repairs</option>
                          <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                          <input type="number" [(ngModel)]="expenseFormAmount" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white" placeholder="Amount">
                      </div>
                      <div>
                          <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                          <input type="date" [(ngModel)]="expenseFormDate" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white">
                      </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                        <textarea [(ngModel)]="expenseFormDescription" rows="3" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white" placeholder="Repair description..."></textarea>
                    </div>
                    <button (click)="submitExpense()" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all mt-2">Log Expense</button>
                  </div>
               </div>
            </div>
        </div>
      }

      <!-- Vacate Modal -->
      @if (showVacateForm && activeHouse) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-up border border-gray-100 dark:border-gray-800 flex flex-col">
               <div class="p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                  <div class="flex justify-between items-center mb-6">
                     <div>
                        <h3 class="text-xl font-black text-rose-600 tracking-tighter uppercase">Vacate Tenant & Settlement</h3>
                        <p class="text-xs text-gray-500">Record move-out settlement details for {{ activeHouse.renterName }}</p>
                     </div>
                     <button (click)="showVacateForm = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                  
                  <div class="space-y-6">
                    <div class="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-3xl mb-2">
                      <div class="flex justify-between items-center text-xs font-black text-indigo-900 dark:text-indigo-300">
                        <span>ADVANCE DEPOSIT:</span>
                        <span>₹{{ activeHouse.advanceAmount.toLocaleString('en-IN') }}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Vacated Date</label>
                          <input type="date" [(ngModel)]="vacateFormDate" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white">
                      </div>
                      <div>
                          <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Deductions (₹)</label>
                          <input type="number" [(ngModel)]="vacateFormDeductions" (ngModelChange)="updateRefundAmount()" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white" placeholder="0">
                      </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Deduction Reason</label>
                        <input type="text" [(ngModel)]="vacateFormDeductionReason" class="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 outline-none text-xs font-bold text-gray-900 dark:text-white" placeholder="Painting charges, damage repair, etc.">
                    </div>
                    <div class="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/20">
                      <div class="flex justify-between items-center text-sm font-black text-emerald-600">
                        <span>FINAL REFUND AMOUNT:</span>
                        <span>₹{{ vacateFormRefund.toLocaleString('en-IN') }}</span>
                      </div>
                    </div>
                    <button (click)="submitVacate()" class="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all mt-2">Confirm Move-out</button>
                  </div>
               </div>
            </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ─── THEME COLOR TOKENS ─── */
    :host {
      --c-rent:     #818cf8; /* indigo-400  */
      --c-electric: #fbbf24; /* amber-400   */
      --c-water:    #38bdf8; /* sky-400     */
      --c-paid:     #10b981; /* emerald-500 */
      --c-due:      #f43f5e; /* rose-500    */
      --c-primary:  #6366f1; /* indigo-500  */
      --c-bg-card:  #ffffff;
      --c-bg-screen:#f8fafc;
      --c-bg-hero:  linear-gradient(135deg, #f1f5f9 0%, #f8fafc 50%, #e2e8f0 100%);
      --c-border:   rgba(99,102,241,0.08);
      --c-text-primary: #1e293b;
      --c-text-secondary: #64748b;
      --c-text-muted: #94a3b8;
      --c-bg-row:   #f1f5f9;
      --c-bg-dot-pending: #fee2e2;
      --c-bg-dot-paid: #d1fae5;
    }

    :host-context(.dark) {
      --c-paid:     #34d399; /* emerald-400 */
      --c-due:      #fb7185; /* rose-400    */
      --c-bg-card:  #161b27;
      --c-bg-screen:#0f1117;
      --c-bg-hero:  linear-gradient(135deg, #1a1f2e 0%, #0d1117 50%, #1a1430 100%);
      --c-border:   rgba(255,255,255,0.06);
      --c-text-primary: #f8fafc;
      --c-text-secondary: #cbd5e1;
      --c-text-muted: rgba(255,255,255,0.4);
      --c-bg-row:   rgba(255,255,255,0.03);
      --c-bg-dot-pending: #ef4444;
      --c-bg-dot-paid: #22c55e;
    }

    /* ─── existing animations ─── */
    .card-animate { animation: fadeInUp 0.5s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out both; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    .animate-fade-up { animation: fadeUp 0.4s ease both; }
    @media (max-width: 639px) { .chart-touch-wrapper { touch-action: none; } }
    .history-step { position: relative; padding-left: 3.5rem; }
    .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
    .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
    .perspective-1000 { perspective: 1000px; }
    .preserve-3d { transform-style: preserve-3d; position: relative; }
    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .flipped { transform: rotateY(180deg); }

    /* ─── LEDGER SCREEN ─── */
    .ledger-screen {
      display: flex; flex-direction: column; gap: 1rem;
      background: var(--c-bg-screen); border-radius: 1.5rem;
      color: var(--c-text-secondary);
      overflow: hidden; min-height: 100vh;
    }
    @media (min-width: 640px) { .ledger-screen { gap: 1.25rem; } }

    /* Hero */
    .ledger-hero {
      position: relative; min-height: 160px;
      background: var(--c-bg-hero);
      padding: 1rem;
      display: flex; flex-direction: column; justify-content: space-between;
      border-bottom: 1px solid var(--c-border);
    }
    @media (min-width: 640px) { .ledger-hero { min-height: 180px; padding: 1.25rem 1.5rem; } }
    /* Property illustration backdrop */
    .ledger-hero-illustration {
      position: absolute; right: 0; bottom: 0; width: 240px; height: 120px;
      opacity: 0.7; pointer-events: none;
    }
    @media (max-width: 480px) { .ledger-hero-illustration { width: 160px; height: 80px; } }
    .ledger-hero-overlay {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse at top right, rgba(99,102,241,0.12) 0%, transparent 60%),
                  radial-gradient(ellipse at bottom left, rgba(139,92,246,0.08) 0%, transparent 60%);
    }
    .ledger-topbar {
      position: relative; z-index: 1;
      display: flex; align-items: flex-start; gap: 0.75rem;
    }
    .ledger-back-btn {
      flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 50%;
      background: var(--c-bg-row); border: 1px solid var(--c-border);
      color: var(--c-text-primary); display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .ledger-back-btn:hover { background: rgba(99,102,241,0.3); border-color: rgba(99,102,241,0.5); }
    .ledger-topbar-center { flex: 1; min-width: 0; }
    .ledger-hero-title {
      font-size: 1.2rem; font-weight: 900; color: var(--c-text-primary);
      letter-spacing: -0.03em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    @media (min-width: 640px) { .ledger-hero-title { font-size: 1.5rem; } }
    .ledger-hero-sub {
      font-size: 0.65rem; color: var(--c-text-muted); margin-top: 0.25rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ledger-topbar-actions { flex-shrink: 0; display: flex; align-items: center; gap: 0.5rem; }
    .ledger-status-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 0.25rem 0.6rem; border-radius: 9999px; border: 1px solid;
    }
    .ledger-status-occupied { background: rgba(52,211,153,0.1); color: #34d399; border-color: rgba(52,211,153,0.3); }
    .ledger-status-vacant   { background: rgba(148,163,184,0.1); color: #94a3b8; border-color: rgba(148,163,184,0.3); }
    .ledger-status-dot { width: 0.4rem; height: 0.4rem; border-radius: 50%; display: inline-block; }
    .ledger-action-row {
      position: relative; z-index: 1; display: flex; align-items: center; gap: 0.5rem;
      flex-wrap: wrap; margin-top: 0.75rem;
    }
    .ledger-btn-danger {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
      padding: 0.45rem 0.9rem; background: #ef4444; color: #fff;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      border-radius: 0.6rem; cursor: pointer; transition: all 0.2s;
      border: none; white-space: nowrap;
    }
    .ledger-btn-danger:hover { background: #dc2626; box-shadow: 0 4px 12px rgba(239,68,68,0.4); }
    .ledger-btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
      padding: 0.45rem 0.9rem; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      border-radius: 0.6rem; cursor: pointer; transition: all 0.2s; border: none; white-space: nowrap;
    }
    .ledger-btn-primary:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.5); }
    .ledger-btn-ghost {
      padding: 0.45rem 0.65rem; background: var(--c-bg-row);
      border: 1px solid var(--c-border); color: var(--c-text-secondary);
      border-radius: 0.6rem; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .ledger-btn-ghost:hover { background: var(--c-bg-row); opacity: 0.8; }

    /* Stats grid */
    .ledger-stats-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;
      padding: 0 0.75rem;
    }
    @media (min-width: 640px) { .ledger-stats-grid { grid-template-columns: repeat(4,1fr); gap: 0.75rem; padding: 0 1rem; } }
    .ledger-stat-card {
      background: var(--c-bg-card); border: 1px solid var(--c-border);
      border-radius: 1rem; padding: 0.85rem 0.75rem;
      display: flex; align-items: flex-start; gap: 0.65rem;
      transition: transform 0.2s;
    }
    .ledger-stat-card:hover { transform: translateY(-2px); }
    .ledger-stat-icon-wrap {
      width: 2.1rem; height: 2.1rem; border-radius: 0.6rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ledger-stat-body { min-width: 0; flex: 1; }
    .ledger-stat-label { font-size: 0.55rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .ledger-stat-value { font-size: 1.05rem; font-weight: 900; margin-top: 0.1rem; line-height: 1.1; }
    .ledger-stat-sub { font-size: 0.55rem; font-weight: 600; color: var(--c-text-muted); margin-top: 0.15rem; }
    .ledger-months-badge {
      display: inline-block; font-size: 0.55rem; font-weight: 800;
      background: rgba(56,189,248,0.15); color: #38bdf8;
      padding: 0.1rem 0.4rem; border-radius: 0.3rem; margin-left: 0.2rem;
    }

    /* Cards */
    .ledger-card {
      background: var(--c-bg-card); border: 1px solid var(--c-border);
      border-radius: 1.25rem; padding: 1rem;
      margin: 0 0.75rem;
    }
    @media (min-width: 640px) { .ledger-card { padding: 1.25rem; margin: 0 1rem; } }
    .ledger-card-title-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1rem;
    }
    .ledger-card-title { font-size: 0.8rem; font-weight: 900; color: var(--c-text-primary); letter-spacing: -0.01em; }
    .ledger-card-header {
      display: flex; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .ledger-section-grid-full .ledger-card { /* full width already */ }

    /* Tenant */
    .ledger-tenant-avatar {
      width: 2.8rem; height: 2.8rem; border-radius: 50%;
      background: linear-gradient(135deg, #312e81, #1e1b4b);
      border: 2px solid rgba(99,102,241,0.4);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ledger-tenant-monogram {
      font-size: 1.15rem; font-weight: 900; color: #a5b4fc;
      line-height: 1; letter-spacing: -0.02em;
      text-shadow: 0 0 12px rgba(165,180,252,0.4);
    }
    .ledger-tenant-name { font-size: 1rem; font-weight: 900; color: var(--c-text-primary); letter-spacing: -0.02em; }
    .ledger-primary-badge {
      font-size: 0.55rem; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase;
      background: rgba(99,102,241,0.2); color: #818cf8; border: 1px solid rgba(99,102,241,0.35);
      padding: 0.15rem 0.5rem; border-radius: 9999px;
    }
    .ledger-tenant-phone { font-size: 0.75rem; font-weight: 700; color: var(--c-text-muted); margin-top: 0.15rem; }
    .ledger-tenant-actions {
      display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
      width: 100%; margin-top: 0.5rem;
    }
    @media (min-width: 480px) { .ledger-tenant-actions { width: auto; margin-top: 0; } }
    .ledger-action-btn {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0.35rem 0.7rem; border-radius: 0.5rem; cursor: pointer;
      border: none; transition: all 0.2s; white-space: nowrap; text-decoration: none;
    }
    .ledger-action-call    { background: #3b82f6; color: #fff; }
    .ledger-action-call:hover { background: #2563eb; }
    .ledger-action-whatsapp { background: #25D366; color: #fff; }
    .ledger-action-whatsapp:hover { background: #1ebe59; }
    .ledger-action-agree   { background: var(--c-bg-row); color: var(--c-text-secondary); border: 1px solid var(--c-border); }
    .ledger-action-agree:hover { background: var(--c-bg-row); opacity: 0.8; }

    /* Tenancy meta row */
    .ledger-tenancy-meta {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 0.5rem; margin-bottom: 1rem;
      background: var(--c-bg-row); border-radius: 0.75rem; padding: 0.75rem;
    }
    @media (min-width: 480px) { .ledger-tenancy-meta { grid-template-columns: repeat(3,1fr); } }
    .ledger-meta-item { display: flex; align-items: center; gap: 0.5rem; }
    .ledger-meta-icon {
      width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; flex-shrink: 0;
      background: rgba(99,102,241,0.15); color: #818cf8;
      display: flex; align-items: center; justify-content: center;
    }
    .ledger-meta-label { font-size: 0.55rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
    .ledger-meta-value { font-size: 0.75rem; font-weight: 800; color: var(--c-text-primary); margin-top: 0.05rem; }

    /* Progress bar */
    .ledger-progress-wrap { margin-top: 0.5rem; }
    .ledger-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .ledger-progress-label { font-size: 0.65rem; font-weight: 700; color: var(--c-text-secondary); text-transform: uppercase; letter-spacing: 0.07em; }
    .ledger-progress-pct { font-size: 0.65rem; font-weight: 800; color: #818cf8; }
    .ledger-progress-track { height: 0.45rem; background: var(--c-bg-row); border-radius: 9999px; overflow: hidden; }
    .ledger-progress-fill {
      height: 100%; border-radius: 9999px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
    }
    .ledger-progress-dates { display: flex; justify-content: space-between; margin-top: 0.3rem; }
    .ledger-progress-dates span { font-size: 0.55rem; color: var(--c-text-muted); font-weight: 600; }

    /* Chart section */
    .ledger-chart-wrap {
      height: 220px; position: relative;
    }
    @media (min-width: 640px) { .ledger-chart-wrap { height: 260px; } }
    .ledger-chart-legend {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.55rem; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase;
      color: #fff; padding: 0.2rem 0.5rem; border-radius: 0.35rem; opacity: 0.9;
    }

    /* Two-col grid */
    .ledger-two-col-grid {
      display: grid; grid-template-columns: 1fr; gap: 1rem;
      padding: 0 0.75rem;
    }
    @media (min-width: 768px) { .ledger-two-col-grid { grid-template-columns: 1fr 1fr; } }
    .ledger-two-col-grid .ledger-card { margin: 0; }

    /* Timeline */
    .ledger-timeline { display: flex; flex-direction: column; gap: 0; }
    .ledger-timeline-item { position: relative; display: flex; gap: 0.75rem; padding-bottom: 1rem; }
    .ledger-timeline-item:last-child { padding-bottom: 0; }
    .ledger-timeline-line {
      position: absolute; left: 0.6rem; top: 1.5rem; bottom: 0;
      width: 2px; background: var(--c-border);
    }
    .ledger-timeline-dot {
      width: 1.25rem; height: 1.25rem; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative; z-index: 1;
      margin-top: 0.15rem; color: #fff;
    }
    .ledger-dot-paid    { background: var(--c-bg-dot-paid); box-shadow: 0 0 8px rgba(34,197,94,0.3); }
    .ledger-dot-pending { background: var(--c-bg-dot-pending); box-shadow: 0 0 8px rgba(239,68,68,0.3); }
    .ledger-timeline-content {
      flex: 1; border-radius: 0.85rem; padding: 0.85rem;
      border: 1px solid; margin-bottom: 0;
    }
    .ledger-bill-paid    { border-color: rgba(34,197,94,0.15); background: rgba(34,197,94,0.04); }
    .ledger-bill-pending { border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.04); }
    .ledger-bill-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.65rem; }
    .ledger-bill-month { font-size: 0.8rem; font-weight: 900; color: var(--c-text-primary); }
    .ledger-bill-status-badge {
      font-size: 0.55rem; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase;
      padding: 0.15rem 0.5rem; border-radius: 0.3rem;
    }
    .ledger-badge-paid    { background: rgba(34,197,94,0.15); color: #4ade80; }
    .ledger-badge-pending { background: rgba(239,68,68,0.15); color: #fb7185; }
    .ledger-bill-breakdown { display: flex; flex-direction: column; gap: 0.35rem; }
    .ledger-breakdown-row {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.35rem 0.5rem; background: var(--c-bg-row); border-radius: 0.4rem;
    }
    .ledger-breakdown-label { flex: 1; font-size: 0.65rem; font-weight: 700; color: var(--c-text-secondary); }
    .ledger-breakdown-amount { font-size: 0.75rem; font-weight: 800; }
    .ledger-breakdown-badge {
      font-size: 0.5rem; font-weight: 800; padding: 0.12rem 0.4rem; border-radius: 0.25rem;
      text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0;
    }
    .ledger-breakdown-total {
      display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      padding: 0.5rem; background: rgba(239,68,68,0.08); border-radius: 0.5rem;
      border-top: 1px solid rgba(239,68,68,0.15); margin-top: 0.25rem;
    }
    .ledger-collect-btn {
      margin-left: auto; padding: 0.35rem 0.75rem;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff; font-size: 0.6rem; font-weight: 800;
      letter-spacing: 0.06em; text-transform: uppercase;
      border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.2s;
    }
    .ledger-collect-btn:hover { box-shadow: 0 4px 12px rgba(239,68,68,0.4); }

    /* Icon buttons */
    .ledger-icon-btn {
      width: 1.6rem; height: 1.6rem; border-radius: 0.4rem; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; color: var(--c-text-muted);
      background: var(--c-bg-row);
    }
    .ledger-icon-btn:hover { background: var(--c-bg-row); opacity: 0.8; color: var(--c-text-primary); }
    .ledger-icon-edit:hover  { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .ledger-icon-delete:hover { background: rgba(239,68,68,0.15); color: #fb7185; }

    /* Add / ghost buttons */
    .ledger-add-btn {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0.35rem 0.7rem; border-radius: 0.5rem; cursor: pointer;
      background: rgba(251,191,36,0.12); color: #fbbf24;
      border: 1px solid rgba(251,191,36,0.25); transition: all 0.2s;
    }
    .ledger-add-btn:hover { background: rgba(251,191,36,0.2); }
    .ledger-ghost-icon-btn {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0.35rem 0.6rem; border-radius: 0.5rem; cursor: pointer;
      background: var(--c-bg-row); color: var(--c-text-secondary);
      border: 1px solid var(--c-border); transition: all 0.2s;
    }
    .ledger-ghost-icon-btn:hover { background: var(--c-bg-row); opacity: 0.8; color: var(--c-text-primary); }

    /* Expense items */
    .ledger-expense-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.75rem; background: var(--c-bg-row);
      border-radius: 0.75rem; border: 1px solid var(--c-border);
      transition: all 0.2s;
    }
    .ledger-expense-item:hover { background: var(--c-bg-row); opacity: 0.8; }
    .ledger-expense-icon {
      width: 2rem; height: 2rem; border-radius: 0.6rem; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .ledger-expense-icon-plumbing  { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .ledger-expense-icon-painting  { background: rgba(168,85,247,0.15); color: #c084fc; }
    .ledger-expense-icon-electrical{ background: rgba(251,191,36,0.15); color: #fbbf24; }
    .ledger-expense-icon-default   { background: rgba(156,163,175,0.15); color: #9ca3af; }
    .ledger-expense-title { font-size: 0.72rem; font-weight: 800; color: var(--c-text-primary); }
    .ledger-expense-date  { font-size: 0.57rem; font-weight: 600; color: var(--c-text-muted); margin-top: 0.1rem; }
    .ledger-expense-amount { font-size: 0.85rem; font-weight: 900; color: #fb7185; white-space: nowrap; }
    .ledger-expense-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.6rem 0.75rem; background: rgba(251,113,133,0.06);
      border-radius: 0.6rem; border-top: 1px solid rgba(251,113,133,0.15);
      margin-top: 0.5rem;
    }

    /* Property grid */
    .ledger-prop-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
    }
    .ledger-prop-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .ledger-prop-label { font-size: 0.55rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
    .ledger-prop-value { font-size: 0.75rem; font-weight: 800; color: var(--c-text-primary); line-height: 1.3; }
    .col-span-2 { grid-column: span 2; }

    /* Past tenancies */
    .ledger-past-card {
      background: var(--c-bg-row); border: 1px solid var(--c-border);
      border-radius: 0.85rem; padding: 0.85rem; transition: all 0.2s;
    }
    .ledger-past-card:hover { background: var(--c-bg-row); opacity: 0.8; }
    .ledger-past-header { display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 0.65rem; }
    .ledger-past-avatar {
      width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
      background: var(--c-border); display: flex; align-items: center; justify-content: center;
    }
    .ledger-past-name { font-size: 0.78rem; font-weight: 800; color: var(--c-text-primary); }
    .ledger-past-duration-badge {
      font-size: 0.55rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
      background: rgba(99,102,241,0.15); color: #818cf8;
      padding: 0.2rem 0.5rem; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;
    }
    .ledger-past-stats {
      display: flex; gap: 1rem; padding-top: 0.5rem;
      border-top: 1px solid var(--c-border);
    }
    .ledger-past-stats > div { display: flex; flex-direction: column; gap: 0.1rem; }

    /* Empty state */
    .ledger-empty-state {
      padding: 2rem 1rem; text-align: center;
      border: 1px dashed var(--c-border); border-radius: 0.75rem;
    }

    /* Bottom padding for mobile nav clearance */
    .ledger-screen { padding-bottom: 1.5rem; }
  `]
})
export class RentalManagementComponent implements OnInit, OnChanges {
  @Input() houses: RentalHouse[] = [];
  @Input() bills: Bill[] = [];
  @Input() trackedServices: TrackedService[] = [];
  @Input() activeHouseId: string | null = null;
  @Input() activeHouse: RentalHouse | null = null;
  @Input() rentalView: 'houses' | 'ledger' = 'houses';
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() availableYears: number[] = [];
  @Input() filteredTotalRent: number = 0;
  @Input() chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  @Input() rentalUtilityBills: Record<string, any> = {};
  @Input() refetchingHouseIds: Record<string, boolean> = {};

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
  @Output() onRefetchBills = new EventEmitter<RentalHouse>();

  @Output() onSendRentReminder = new EventEmitter<RentalHouse>();
  @Output() onPrintRentReceipt = new EventEmitter<{house: RentalHouse, bill: RentalBill}>();
  @Output() onAddExpense = new EventEmitter<{houseId: string, expense: Omit<RentalExpense, 'id'>}>();
  @Output() onDeleteExpense = new EventEmitter<{houseId: string, expenseId: string}>();
  @Output() onVacateTenant = new EventEmitter<{houseId: string, settlement: { vacatedDate: string, refundAmount: number, deductions: number, deductionReason: string }}>();

  // Local state for modals
  showExpenseForm = false;
  expenseFormCategory: 'Plumbing' | 'Electrical' | 'Painting' | 'Cleaning' | 'Tax' | 'Repairs' | 'Other' = 'Other';
  expenseFormAmount = 0;
  expenseFormDescription = '';
  expenseFormDate = new Date().toISOString().split('T')[0];

  showVacateForm = false;
  vacateFormDate = new Date().toISOString().split('T')[0];
  vacateFormRefund = 0;
  vacateFormDeductions = 0;
  vacateFormDeductionReason = '';

  // View mode and expansion state
  viewMode: 'grid' | 'list' = 'list';
  expandedHouseIds: Record<string, boolean> = {};
  searchQuery: string = '';

  get filteredHouses(): RentalHouse[] {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      return this.houses;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.houses.filter(house => 
      (house.houseName || '').toLowerCase().includes(query) ||
      (house.renterName || '').toLowerCase().includes(query) ||
      (house.renterPhone || '').toLowerCase().includes(query)
    );
  }

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

  // Cache for Bills Collection chart data, keyed by house ID.
  // Avoids calling getLedgerChartData() on every change-detection cycle (scroll, etc.)
  ledgerChartCache: Record<string, any> = {};

  ngOnInit() {}

  ngOnChanges() {
    this.rentalChart?.update();
    // Rebuild ledger chart cache whenever houses data changes
    this._rebuildLedgerChartCache();
  }

  private _rebuildLedgerChartCache() {
    const next: Record<string, any> = {};
    for (const house of this.houses) {
      if (house.id) {
        next[house.id] = this.getLedgerChartData(house);
      }
    }
    // Also include activeHouse if not already in houses list
    if (this.activeHouse?.id && !next[this.activeHouse.id]) {
      next[this.activeHouse.id] = this.getLedgerChartData(this.activeHouse);
    }
    this.ledgerChartCache = next;
  }

  getLastRentCollected(house: RentalHouse): string {
    const paidBills = (house.bills || []).filter(b => b.rentAmount > 0);
    if (paidBills.length === 0) return 'No rent collected yet';
    
    const latest = paidBills.reduce((latestBill, currentBill) => {
      return new Date(currentBill.billDate).getTime() > new Date(latestBill.billDate).getTime() ? currentBill : latestBill;
    }, paidBills[0]);
    
    let monthDisp = latest.month;
    if (!monthDisp && latest.billDate) {
      const d = new Date(latest.billDate);
      if (!isNaN(d.getTime())) {
        monthDisp = d.toLocaleString('default', { month: 'short' });
      }
    }
    return `₹${latest.rentAmount.toLocaleString('en-IN')} (${monthDisp || ''} ${latest.year || ''})`;
  }

  toggleExpand(houseId: string, event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('select') || target.closest('input')) {
      return;
    }
    this.expandedHouseIds[houseId] = !this.expandedHouseIds[houseId];
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
    const collected = bills.filter(b => b.rentAmount > 0).reduce((sum, b) => sum + (b.rentAmount || 0), 0);
    let pending = bills.reduce((sum, b) => sum + this.getMonthlyPendingTotal(house, b), 0);
    const months = bills.length;

    if (house.status === 'Occupied' && house.arrivedDate) {
      const now = new Date();
      const arrived = new Date(house.arrivedDate);
      let tempDate = new Date(arrived.getFullYear(), arrived.getMonth(), arrived.getDate());
      while (tempDate <= now) {
         const monthNameLong = tempDate.toLocaleString('default', { month: 'long' }).toLowerCase();
         const monthNameShort = tempDate.toLocaleString('default', { month: 'short' }).toLowerCase();
         const year = tempDate.getFullYear();
         const monthlyBill = bills.find(b => {
           if (b.billDate) {
             const d = new Date(b.billDate);
             if (!isNaN(d.getTime())) {
               return d.getMonth() === tempDate.getMonth() && d.getFullYear() === tempDate.getFullYear();
             }
           }
           const bMonth = (b.month || '').toLowerCase();
           return (bMonth === monthNameLong || bMonth === monthNameShort) && b.year === year;
         });
         if (!monthlyBill) {
           pending += (house.monthlyRent || 0);
         } else if (!(monthlyBill.rentAmount > 0)) {
           pending += (house.monthlyRent || 0);
         }
         tempDate.setMonth(tempDate.getMonth() + 1);
      }
    }

    const expensesTotal = (house.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const netYield = collected - expensesTotal;

    return { collected, pending, months, expensesTotal, netYield };
  }

  normalizeServiceNumber(num: any): string {
    if (num === null || num === undefined) return '';
    const str = String(num).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return str.replace(/^0+/, '');
  }

  getHouseUtilityBill(house: RentalHouse, type: 'electricity' | 'water'): number {
    // 1. Check local monthly bills first for the latest recorded value
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
      if (amt > 0) {
        return amt;
      }
    }

    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return 0;
    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);

    // 2. Check tracked services next (live portal values)
    const service = (this.trackedServices || []).find(s => 
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service && service.lastAmount !== undefined && service.lastAmount !== null && service.lastAmount > 0) {
      return service.lastAmount;
    }

    // 3. Check cached sync details
    const cachedAmount = house.id ? this.rentalUtilityBills[house.id]?.[type] : undefined;
    if (cachedAmount !== undefined && cachedAmount > 0) return cachedAmount;
    
    // 4. Check global bills next
    if (cleanServiceNo) {
      const matchingBills = (this.bills || []).filter(b => 
        b.serviceNumber &&
        this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
        b.serviceType?.toLowerCase() === type.toLowerCase() &&
        !b.isDeleted
      );
      if (matchingBills.length > 0) {
        const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
        return sortedBills[0].amount || 0;
      }
    }

    return 0;
  }

  isHouseUtilityPaid(house: RentalHouse, type: 'electricity' | 'water'): boolean {
    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return false;

    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);
    if (!cleanServiceNo) return false;

    // 1. Check local monthly bills first
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const statusStr = (latestBill.status || '').toLowerCase();
      if (statusStr === 'paid') {
        return true;
      }
      const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
      if (statusStr === 'pending' && amt > 0) {
        return false;
      }
    }

    // 2. Check global bills next
    const matchingBills = (this.bills || []).filter(b => 
      b.serviceNumber &&
      this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
      b.serviceType?.toLowerCase() === type.toLowerCase() &&
      !b.isDeleted
    );
    if (matchingBills.length > 0) {
      const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
      const latestGlobalBill = sortedBills[0];
      const statusStr = (latestGlobalBill.status || '').toLowerCase();
      if (statusStr === 'completed' || statusStr === 'paid') {
        return true;
      }
      if (statusStr === 'pending' || statusStr === 'overdue') {
        return false;
      }
    }

    // 3. Check cached sync details
    if (house.id) {
      const cached = this.rentalUtilityBills[house.id];
      if (cached) {
        const isPaid = type === 'electricity' ? cached.electricityPaid === true : cached.waterPaid === true;
        if (isPaid) return true;
      }
    }

    // 4. Check tracked services status
    const service = (this.trackedServices || []).find(s => 
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service) {
      const isStatusPaid = service.lastBillStatus === 'paid' || String(service.lastAmountLabel || '').toLowerCase().includes('paid');
      return isStatusPaid;
    }

    return true; // default to true if no service details found
  }

  getHouseUtilityPaidDate(house: RentalHouse, type: 'electricity' | 'water'): string {
    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) return '';

    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);
    if (!cleanServiceNo) return '';

    // 1. Check global bills first
    const matchingBills = (this.bills || []).filter(b => 
      b.serviceNumber &&
      this.normalizeServiceNumber(b.serviceNumber) === cleanServiceNo &&
      b.serviceType?.toLowerCase() === type.toLowerCase() &&
      !b.isDeleted
    );
    if (matchingBills.length > 0) {
      const sortedBills = [...matchingBills].sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
      const latestGlobalBill = sortedBills[0];
      const statusStr = (latestGlobalBill.status || '').toLowerCase();
      if (statusStr === 'completed' || statusStr === 'paid') {
        return latestGlobalBill.paidDate || latestGlobalBill.dueDate || '';
      }
    }

    // 2. Check local monthly bills next
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const statusStr = (latestBill.status || '').toLowerCase();
      if (statusStr === 'paid') {
        return latestBill.paidDate || latestBill.billDate;
      }
      if (statusStr === 'pending') {
        const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
        if (amt === 0) {
          return latestBill.billDate;
        }
      }
    }

    // 3. Check cached sync details
    if (house.id) {
      const cached = this.rentalUtilityBills[house.id];
      if (cached) {
        const date = type === 'electricity' ? cached.electricityPaidDate : cached.waterPaidDate;
        if (date) return date;
      }
    }

    // 4. Check tracked services
    const service = (this.trackedServices || []).find(s => 
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service && (service.lastBillStatus === 'paid' || String(service.lastAmountLabel || '').toLowerCase().includes('paid'))) {
      return service.lastPaidDate || '';
    }

    return '';
  }

  isMonthlyUtilityPaid(house: RentalHouse, bill: RentalBill, type: 'electricity' | 'water'): boolean {
    if (bill.status.toLowerCase() === 'paid') {
      return true;
    }

    const amt = type === 'electricity' ? (bill.electricBill || 0) : (bill.waterBill || 0);
    if (amt === 0) {
      return true;
    }

    const serviceNo = type === 'electricity' ? house.electricMeterNo : house.waterBillNo;
    if (!serviceNo) {
      return false;
    }

    const cleanServiceNo = this.normalizeServiceNumber(serviceNo);
    if (!cleanServiceNo) {
      return false;
    }

    const billMonthLower = (bill.month || '').toLowerCase();
    const billYear = bill.year;

    // 1. Search global bills for a matching record
    const matchingBills = (this.bills || []).filter(b => {
      if (b.isDeleted) return false;
      if (!b.serviceNumber || this.normalizeServiceNumber(b.serviceNumber) !== cleanServiceNo) return false;
      if (b.serviceType?.toLowerCase() !== type.toLowerCase()) return false;

      // Match by month and year
      if (b.month && b.year) {
        const bMonthLower = String(b.month).toLowerCase();
        const monthMatches = bMonthLower.includes(billMonthLower) || billMonthLower.includes(bMonthLower);
        const yearMatches = b.year === billYear;
        if (monthMatches && yearMatches) {
          return true;
        }
      }

      // Fallback matching: if amount matches exactly, it's highly likely to be the same month's bill
      if (b.amount === amt) {
        return true;
      }

      return false;
    });

    if (matchingBills.length > 0) {
      const isPaidInGlobal = matchingBills.some(b => {
        const statusStr = (b.status || '').toLowerCase();
        return statusStr === 'completed' || statusStr === 'paid';
      });
      if (isPaidInGlobal) {
        return true;
      }
    }

    // 2. Also check tracked services last synced status (if the amount matches and it's paid)
    const service = (this.trackedServices || []).find(s => 
      s.serviceNumber && this.normalizeServiceNumber(s.serviceNumber) === cleanServiceNo && s.serviceType === type
    );
    if (service) {
      const lastAmount = service.lastAmount || 0;
      const isStatusPaid = service.lastBillStatus === 'paid' || String(service.lastAmountLabel || '').toLowerCase().includes('paid');
      if (isStatusPaid && lastAmount === amt) {
        return true;
      }
    }

    return false;
  }

  getMonthlyPendingTotal(house: RentalHouse, bill: RentalBill): number {
    const elecDue = !this.isMonthlyUtilityPaid(house, bill, 'electricity') ? (bill.electricBill || 0) : 0;
    const waterDue = !this.isMonthlyUtilityPaid(house, bill, 'water') ? (bill.waterBill || 0) : 0;
    return elecDue + waterDue;
  }

  isMonthlyBillFullyPaid(house: RentalHouse, bill: RentalBill): boolean {
    if (bill.status.toLowerCase() === 'paid') return true;
    const rentPaid = bill.rentAmount > 0;
    const elecPaid = this.isMonthlyUtilityPaid(house, bill, 'electricity');
    const waterPaid = this.isMonthlyUtilityPaid(house, bill, 'water');
    return rentPaid && elecPaid && waterPaid;
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

  getCompletedMonthsOccupied(house: RentalHouse): number {
    if (!house.arrivedDate || house.status !== 'Occupied') return 0;
    const arrived = new Date(house.arrivedDate);
    const today = new Date();
    
    let months = (today.getFullYear() - arrived.getFullYear()) * 12 + (today.getMonth() - arrived.getMonth());
    
    if (today.getDate() < arrived.getDate()) {
      months--;
    }
    return Math.max(0, months);
  }

  openExpenseForm() {
    this.expenseFormCategory = 'Other';
    this.expenseFormAmount = 0;
    this.expenseFormDescription = '';
    this.expenseFormDate = new Date().toISOString().split('T')[0];
    this.showExpenseForm = true;
  }

  submitExpense() {
    if (!this.activeHouse?.id) return;
    this.onAddExpense.emit({
      houseId: this.activeHouse.id,
      expense: {
        category: this.expenseFormCategory,
        amount: this.expenseFormAmount,
        description: this.expenseFormDescription,
        date: this.expenseFormDate
      }
    });
    this.showExpenseForm = false;
  }

  openVacateForm() {
    if (!this.activeHouse) return;
    this.vacateFormDate = new Date().toISOString().split('T')[0];
    this.vacateFormDeductions = 0;
    this.vacateFormDeductionReason = '';
    this.vacateFormRefund = this.activeHouse.advanceAmount || 0;
    this.showVacateForm = true;
  }

  updateRefundAmount() {
    if (!this.activeHouse) return;
    const advance = this.activeHouse.advanceAmount || 0;
    this.vacateFormRefund = Math.max(0, advance - (this.vacateFormDeductions || 0));
  }

  // ─── Ledger helper methods ───────────────────────────────────────────

  getLedgerPendingAmount(house: RentalHouse): number {
    return (house.bills || [])
      .reduce((sum, b) => sum + this.getMonthlyPendingTotal(house, b), 0);
  }

  getLedgerPendingBillsCount(house: RentalHouse): number {
    return (house.bills || []).filter(b => !this.isMonthlyBillFullyPaid(house, b)).length;
  }

  getLedgerStayYears(house: RentalHouse): number {
    if (!house.arrivedDate) return 0;
    const months = this.getCompletedMonthsOccupied(house);
    return Math.floor(months / 12);
  }

  getLedgerStayExtraMonths(house: RentalHouse): number {
    const months = this.getCompletedMonthsOccupied(house);
    return months % 12;
  }

  getLedgerTenancyProgress(house: RentalHouse): number {
    if (!house.arrivedDate) return 0;
    const totalMonths = 24; // assume 2-year agreement as base
    const completed = this.getCompletedMonthsOccupied(house);
    return Math.min(100, Math.round((completed / totalMonths) * 100));
  }

  getLedgerExpectedEnd(house: RentalHouse): Date {
    if (!house.arrivedDate) return new Date();
    const d = new Date(house.arrivedDate);
    d.setFullYear(d.getFullYear() + 3); // assume 3-year tenancy
    return d;
  }

  getLedgerYearExpenses(house: RentalHouse): number {
    const year = new Date().getFullYear();
    return (house.expenses || [])
      .filter(e => new Date(e.date).getFullYear() === year)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getExpenseCategoryClass(category: string): string {
    const map: Record<string, string> = {
      'Plumbing':    'ledger-expense-icon ledger-expense-icon-plumbing',
      'Electrical':  'ledger-expense-icon ledger-expense-icon-electrical',
      'Painting':    'ledger-expense-icon ledger-expense-icon-painting',
    };
    return map[category] || 'ledger-expense-icon ledger-expense-icon-default';
  }

  // ─────────────────────────────────────────────────────────────────────

  submitVacate() {
    if (!this.activeHouse?.id) return;
    this.onVacateTenant.emit({
      houseId: this.activeHouse.id,
      settlement: {
        vacatedDate: this.vacateFormDate,
        refundAmount: this.vacateFormRefund,
        deductions: this.vacateFormDeductions || 0,
        deductionReason: this.vacateFormDeductionReason
      }
    });
    this.showVacateForm = false;
  }

  // ─── Bills Collection Chart ────────────────────────────────────────────

  getLedgerChartData(house: RentalHouse): any {
    const bills = [...(house.bills || [])].sort((a, b) =>
      new Date(a.billDate).getTime() - new Date(b.billDate).getTime()
    ).slice(-12); // last 12 months

    const labels = bills.map(b => {
      const d = new Date(b.billDate);
      return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Rent',
          data: bills.map(b => b.rentAmount || 0),
          backgroundColor: 'rgba(129,140,248,0.8)',   // --c-rent
          borderColor: '#818cf8',
          borderWidth: 1,
          borderRadius: 4,
          stack: 'bills'
        },
        {
          label: 'Electricity',
          data: bills.map(b => b.electricBill || 0),
          backgroundColor: 'rgba(251,191,36,0.8)',    // --c-electric
          borderColor: '#fbbf24',
          borderWidth: 1,
          borderRadius: 4,
          stack: 'bills'
        },
        {
          label: 'Water',
          data: bills.map(b => b.waterBill || 0),
          backgroundColor: 'rgba(56,189,248,0.8)',    // --c-water
          borderColor: '#38bdf8',
          borderWidth: 1,
          borderRadius: 4,
          stack: 'bills'
        }
      ]
    };
  }

  ledgerChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ₹${(ctx.raw || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#64748b', font: { size: 10, weight: '700' } },
        border: { display: false }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#64748b', font: { size: 10, weight: '700' },
          callback: (v: any) => '₹' + Number(v).toLocaleString('en-IN')
        },
        border: { display: false }
      }
    },
    animation: { duration: 600, easing: 'easeInOutQuart' }
  };
}
