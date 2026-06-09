import { Component, inject, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { RentalHouse, RentalBill, RentalExpense, PastTenancy } from '../../services/rental.service';

@Component({
  selector: 'app-rental-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, CountUpDirective],
  template: `
    <div class="card-animate space-y-8" style="animation-delay:0.05s">
      
      @if (rentalView === 'houses') {
        <div class="mb-6">
          <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">House Management</h2>
          <p class="text-sm font-medium text-gray-500 mt-1">{{ searchQuery ? filteredHouses.length + ' of ' : '' }}{{ houses.length }} registered properties</p>
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

      <!-- Billing Details Table -->
      @if (rentalView === 'ledger' && activeHouse; as house) {
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden animate-fade-up">
          <div class="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="flex items-center gap-3">
                <button (click)="onBackToHouses.emit()" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-indigo-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ house.houseName }} History</h3>
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly breakdown and utility consumption</p>
                </div>
              </div>
              <div class="flex gap-2 w-full sm:w-auto">
                <button *ngIf="house.status === 'Occupied'" (click)="openVacateForm()" class="flex-1 sm:flex-none px-5 py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Vacate Tenant</button>
                <button (click)="onAddMonthlyRecord.emit()" class="flex-1 sm:flex-none px-5 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Record Collection</button>
              </div>
          </div>
          
          <div class="p-8 relative">
            <!-- Tenant / Property Details Panel -->
            <div class="mb-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
              <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property & Tenant Information</h4>
                <span class="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm"
                      [ngClass]="house.status === 'Occupied' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                  {{ house.status }}
                </span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Tenant Info -->
                <div *ngIf="house.status === 'Occupied'" class="space-y-2 text-left">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Tenant</p>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-black text-slate-900 dark:text-white leading-tight truncate" [title]="house.renterName">{{ house.renterName }}</p>
                      <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{{ house.renterPhone }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 pt-1">
                    <a *ngIf="house.renterPhone"
                       href="tel:{{ house.renterPhone }}"
                       (click)="$event.stopPropagation()"
                       class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.272.387-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      Call
                    </a>
                    <button *ngIf="house.renterPhone"
                            (click)="onSendRentReminder.emit(house)"
                            class="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe59] rounded-xl text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                      <svg class="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.855L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.368l-.36-.214-3.72.886.916-3.618-.235-.373A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
                <div *ngIf="house.status === 'Vacant'" class="space-y-1 text-left flex flex-col justify-center">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Tenant</p>
                  <p class="text-xs font-black text-slate-400 uppercase tracking-wide">No Active Tenant</p>
                </div>

                <!-- Tenancy & Timeline Details -->
                <div class="space-y-2 text-left">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenancy & Location</p>
                  <div class="space-y-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <p *ngIf="house.arrivedDate">Move-in Date: <span class="text-slate-900 dark:text-white font-black">{{ house.arrivedDate | date:'dd MMM yyyy' }}</span></p>
                    <p *ngIf="house.status === 'Occupied' && house.arrivedDate">Occupancy: <span class="text-emerald-500 font-black">{{ getCompletedMonthsOccupied(house) }} Months completed</span></p>
                    <p class="leading-relaxed mt-1" [title]="house.fullAddress || ''">Address: <span class="text-slate-900 dark:text-white font-black block mt-0.5">{{ house.fullAddress || 'Address Not Set' }}</span></p>
                  </div>
                </div>

                <!-- Financial Details -->
                <div class="space-y-2 text-left">
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</p>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly Rent</span>
                      <span class="block text-sm font-black text-slate-900 dark:text-white mt-0.5">₹{{ (house.monthlyRent || 0).toLocaleString('en-IN') }}</span>
                    </div>
                    <div>
                      <span class="block text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Advance Deposit</span>
                      <span class="block text-sm font-black text-slate-900 dark:text-white mt-0.5">₹{{ (house.advanceAmount || 0).toLocaleString('en-IN') }}</span>
                    </div>
                  </div>
                  <div class="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Rent Increase Due:</span>
                    <span class="font-black" [class]="isRentIncreaseDue(house) ? 'text-amber-500' : 'text-slate-900 dark:text-white'">
                      {{ isRentIncreaseDue(house) ? 'Yes (Overdue)' : 'No' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-8 relative">
                  <div *ngFor="let bill of sortBills(house.bills); trackBy: trackByBillDate; let i = index" class="history-step group">
                    <div *ngIf="i < house.bills.length - 1" class="stepper-line bg-indigo-500/20 dark:bg-indigo-500/10"></div>
                    
                    <div class="stepper-dot w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg z-10 transition-all group-hover:scale-110"
                         [ngClass]="bill.status.toLowerCase() === 'paid' ? 'bg-green-500 shadow-green-500/30' : 'bg-rose-500 shadow-rose-500/30'">
                      <svg *ngIf="bill.status.toLowerCase() === 'paid'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <svg *ngIf="bill.status.toLowerCase() !== 'paid'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>

                    <div class="p-5 rounded-3xl border transition-all hover:shadow-md"
                         [ngClass]="bill.status.toLowerCase() === 'paid' ? 
                            'border-green-100 dark:border-green-900/30 hover:border-green-200 bg-green-50/10 dark:bg-green-950/5 shadow-sm' : 
                            'border-rose-100 dark:border-rose-900/30 hover:border-rose-200 bg-rose-50/10 dark:bg-rose-950/5 shadow-sm'">
                      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <p class="text-[9px] font-black uppercase tracking-widest leading-none" [class]="bill.status.toLowerCase() === 'paid' ? 'text-green-500' : 'text-red-500'">
                              {{ bill.status.toLowerCase() === 'paid' ? 'Paid' : 'Unpaid' }}
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
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Electricity</span>
                              <span class="text-xs font-bold" [class]="bill.status.toLowerCase() === 'pending' && bill.electricBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.electricBill" prefix="₹"></span>
                            </div>
                            <div class="flex items-center text-gray-200 dark:text-gray-700 text-xs px-1">/</div>
                            <div class="flex flex-col">
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Water</span>
                              <span class="text-xs font-bold" [class]="bill.status.toLowerCase() === 'pending' && bill.waterBill > 0 ? 'text-red-500' : 'text-green-500'" [appCountUp]="bill.waterBill" prefix="₹"></span>
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 w-full sm:w-auto">
                          <button *ngIf="bill.rentAmount > 0" (click)="onPrintRentReceipt.emit({house, bill})" class="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all" title="View/Download HRA Receipt">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          </button>
                          <button (click)="onEditBill.emit({bill, index: findIndex(bill, house)})" class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="Edit Bill">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button (click)="onDeleteBill.emit(findIndex(bill, house))" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete Bill">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
          </div>

          <!-- Expense Maintenance Log Section -->
          <div class="p-8 border-t border-gray-50 dark:border-gray-800">
             <div class="flex justify-between items-center mb-6">
                <div>
                   <h4 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Maintenance & Expense Log</h4>
                   <p class="text-xs text-gray-400 uppercase font-bold mt-0.5">Track renovations, taxes, and repair costs</p>
                </div>
                <button (click)="openExpenseForm()" class="px-4 py-2.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">Add Expense</button>
             </div>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div *ngFor="let exp of house.expenses || []" class="bg-gray-50/70 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 flex justify-between items-center">
                   <div>
                      <div class="flex items-center gap-2 mb-1">
                         <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded">{{ exp.category }}</span>
                         <span class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{{ exp.date | date:'mediumDate' }}</span>
                      </div>
                      <p class="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-snug">{{ exp.description }}</p>
                   </div>
                   <div class="flex items-center gap-3 text-right">
                      <div>
                         <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                         <p class="text-base font-black text-rose-500 leading-none">₹{{ exp.amount }}</p>
                      </div>
                      <button (click)="onDeleteExpense.emit({houseId: house.id!, expenseId: exp.id})" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                   </div>
                </div>
                <div *ngIf="!house.expenses || house.expenses.length === 0" class="col-span-full py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl opacity-50">
                    <p class="text-gray-400 font-black uppercase tracking-widest text-[9px]">No maintenance expense logged</p>
                </div>
             </div>
          </div>

          <!-- Archived Tenancies Section -->
          <div class="p-8 border-t border-gray-50 dark:border-gray-800 bg-gray-50/10">
             <h4 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Past Tenancies</h4>
             <div class="space-y-4">
                <div *ngFor="let past of house.pastTenancies || []" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-5 shadow-sm">
                   <div class="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-50 dark:border-gray-700/50 pb-3 mb-3 gap-2">
                      <div>
                         <h5 class="text-sm font-black text-slate-800 dark:text-white">{{ past.renterName }}</h5>
                         <p class="text-[9px] font-bold text-gray-400 mt-0.5">{{ past.renterPhone }}</p>
                      </div>
                      <div class="sm:text-right">
                         <span class="text-[8px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded">Archived Tenancy</span>
                         <p class="text-[9px] font-bold text-indigo-500 mt-1 uppercase tracking-tight">{{ past.arrivedDate | date:'MMM yyyy' }} - {{ past.vacatedDate | date:'MMM yyyy' }}</p>
                      </div>
                   </div>
                   <div class="grid grid-cols-3 gap-4 text-xs font-bold">
                      <div>
                         <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Deductions</span>
                         <span class="text-rose-500">₹{{ past.deductions }}</span>
                         <p *ngIf="past.deductionReason" class="text-[7px] text-gray-400 font-medium uppercase mt-0.5 leading-none">{{ past.deductionReason }}</p>
                      </div>
                      <div>
                         <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Refunded Deposit</span>
                         <span class="text-emerald-500">₹{{ past.advanceRefunded }}</span>
                      </div>
                      <div>
                         <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Months Completed</span>
                         <span>{{ past.bills.length }}</span>
                      </div>
                   </div>
                </div>
                <div *ngIf="!house.pastTenancies || house.pastTenancies.length === 0" class="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl opacity-50">
                    <p class="text-gray-400 font-black uppercase tracking-widest text-[9px]">No historical tenancy archives</p>
                </div>
             </div>
          </div>
        </div>
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
    .card-animate { animation: fadeInUp 0.5s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out both; }
    @media (max-width: 639px) { .chart-touch-wrapper { touch-action: none; } }
    .history-step { position: relative; padding-left: 3.5rem; }
    .stepper-line { position: absolute; left: 1rem; top: 2.25rem; bottom: -2rem; width: 2px; transform: translateX(-50%); }
    .stepper-dot { position: absolute; left: 1rem; top: 0.25rem; transform: translateX(-50%); }
    .perspective-1000 { perspective: 1000px; }
    .preserve-3d { transform-style: preserve-3d; position: relative; }
    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .flipped { transform: rotateY(180deg); }
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

  ngOnInit() {}

  ngOnChanges() {
    this.rentalChart?.update();
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
    let pending = bills.filter(b => b.status && b.status.toLowerCase() === 'pending').reduce((sum, b) => sum + (b.electricBill || 0) + (b.waterBill || 0), 0);
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

  getHouseUtilityBill(house: RentalHouse, type: 'electricity' | 'water'): number {
    return this.rentalUtilityBills[house.id!]?.[type] || 0;
  }

  isHouseUtilityPaid(house: RentalHouse, type: 'electricity' | 'water'): boolean {
    const bills = house.bills || [];
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      const latestBill = sorted[0];
      const statusStr = (latestBill.status || '').toLowerCase();
      if (statusStr === 'paid') {
        return true;
      }
      if (statusStr === 'pending') {
        const amt = type === 'electricity' ? (latestBill.electricBill || 0) : (latestBill.waterBill || 0);
        return amt === 0;
      }
    }

    if (!house.id) return false;
    const cached = this.rentalUtilityBills[house.id];
    return cached ? (type === 'electricity' ? cached.electricityPaid === true : cached.waterPaid === true) : false;
  }

  getHouseUtilityPaidDate(house: RentalHouse, type: 'electricity' | 'water'): string {
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

    if (!house.id) return '';
    const cached = this.rentalUtilityBills[house.id];
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
}
