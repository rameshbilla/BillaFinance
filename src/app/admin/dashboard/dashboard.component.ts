import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { InterestService, InterestScheme } from '../services/interest.service';
import { CustomerService, Customer } from '../services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <!-- Top Navigation -->
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">FinServe Admin</span>
            </div>
            <div class="flex space-x-4 items-center" *ngIf="authService.userProfile$ | async as profile">
              <span class="text-gray-600 dark:text-gray-300 font-medium text-sm hidden sm:block">Welcome, {{ profile.displayName || 'Admin' }}</span>
              <button (click)="logout()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all text-sm font-medium">Log out</button>
            </div>
            <div class="flex space-x-4 items-center" *ngIf="!(authService.userProfile$ | async)">
               <span class="text-gray-600 dark:text-gray-300 font-medium text-sm hidden sm:block">Welcome, Admin</span>
               <button (click)="logout()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all text-sm font-medium">Log out</button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Tabs for Switching Dashboard Context -->
        <div class="flex space-x-1 p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl w-full sm:max-w-sm mb-8 relative">
           <button (click)="activeTab = 'chitti'" 
                   [class.bg-white]="activeTab === 'chitti'" [class.dark:bg-gray-700]="activeTab === 'chitti'" [class.shadow-sm]="activeTab === 'chitti'"
                   class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-gray-700 dark:text-gray-200 hover:text-purple-600">
             Chitti Schemes
           </button>
           <button (click)="activeTab = 'interest'" 
                   [class.bg-white]="activeTab === 'interest'" [class.dark:bg-gray-700]="activeTab === 'interest'" [class.shadow-sm]="activeTab === 'interest'"
                   class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-gray-700 dark:text-gray-200 hover:text-blue-600">
             Interest Dashboard
           </button>
        </div>

        @if (activeTab === 'chitti') {
           <!-- CHITTI DASHBOARD -->
           <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Chitti Management</h2>
              <button (click)="goToCreateChit()" class="flex items-center px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg transition-all">
                 <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                 New Chitti
              </button>
           </div>

           <!-- Current Month Snapshot -->
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                 <div class="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </div>
                 <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Collected ({{ currentMonthName }})</p>
                    <p class="text-2xl font-black text-gray-900 dark:text-white">₹{{ totalCollectedThisMonth | number:'1.0-0' }}</p>
                 </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                 <div class="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 mr-4">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </div>
                 <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending ({{ currentMonthName }})</p>
                    <p class="text-2xl font-black text-pink-600">₹{{ totalPendingThisMonth | number:'1.0-0' }}</p>
                 </div>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (chit of chittis; track chit.id) {
                 <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
                    <div class="flex justify-between items-start mb-4">
                       <h3 class="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600" (click)="viewChitDetails(chit.id!)">{{ chit.name }}</h3>
                       <div class="flex space-x-2">
                          <button (click)="editChit(chit.id!)" class="text-gray-400 hover:text-indigo-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                          <button (click)="deleteChit(chit.id!)" class="text-gray-400 hover:text-red-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                       </div>
                    </div>
                    <div class="mb-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                       <p>Tenure: <span class="font-semibold text-gray-900 dark:text-gray-200">{{ chit.tenure }} Months</span></p>
                       <p>Monthly: <span class="font-semibold text-gray-900 dark:text-gray-200">₹{{ chit.monthlyAmount }}</span></p>
                       <p class="mt-2 text-purple-600 dark:text-purple-400 font-medium flex items-center">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          {{ getCustomerCount(chit.id!, 'chitti') }} Customers
                       </p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                       <div class="text-left">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Collected (Month)</p>
                          <p class="text-sm font-bold text-green-600">₹{{ getChittiStats(chit.id!).collected | number:'1.0-0' }}</p>
                       </div>
                       <div class="text-right">
                          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total Pending</p>
                          <p class="text-sm font-bold text-pink-600">₹{{ getChittiStats(chit.id!).pending | number:'1.0-0' }}</p>
                       </div>
                    </div>
                    <div class="pt-3 flex justify-between items-center">
                       <p class="text-xs text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline" (click)="viewChitDetails(chit.id!)">Manage Customers →</p>
                       <p class="text-base font-bold text-gray-900 dark:text-white">₹{{ chit.totalValue | number:'1.0-0' }}</p>
                    </div>
                 </div>
              }
           </div>
           @if (chittis.length === 0) {
              <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <p class="text-gray-500 dark:text-gray-400">No Chitti Schemes found. Create one to get started.</p>
              </div>
           }
        } @else {
           <!-- INTEREST DASHBOARD -->
           <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Interest Management</h2>
              <button (click)="goToCreateInterest()" class="flex items-center px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:shadow-lg transition-all">
                 <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                 New Interest Scheme
              </button>
           </div>

           <!-- Interest Snapshot -->
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                 <div class="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 </div>
                 <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Interest Collected ({{ currentMonthName }})</p>
                    <p class="text-2xl font-black text-gray-900 dark:text-white">₹{{ totalInterestCollectedThisMonth | number:'1.0-0' }}</p>
                 </div>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (interest of interests; track interest.id) {
                 <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
                    <div class="flex justify-between items-start mb-4">
                       <h3 class="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" (click)="viewInterestDetails(interest.id!)">
                          {{ interest.borrowerName || 'Unknown' }} ({{ interest.interestRate }}%)
                       </h3>
                       <div class="flex space-x-2">
                          <button (click)="editInterest(interest.id!)" class="text-gray-400 hover:text-indigo-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                          <button (click)="deleteInterest(interest.id!)" class="text-gray-400 hover:text-red-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                       </div>
                    </div>
                    <div class="mb-4 text-sm text-gray-500 dark:text-gray-400">
                       <p class="font-bold text-gray-800 dark:text-gray-200 truncate">{{ interest.name }}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                       <div>
                          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Principal</p>
                          <p class="text-sm font-black text-gray-900 dark:text-white">₹{{ interest.amount | number:'1.0-0' }}</p>
                       </div>
                       <div class="text-right">
                          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Int.</p>
                          <p class="text-sm font-black text-indigo-600">₹{{ getMonthlyInterest(interest) | number:'1.0-0' }}</p>
                       </div>
                       
                       <div class="bg-orange-50 dark:bg-orange-900/10 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          <p class="text-[9px] font-black text-orange-600 uppercase tracking-tight">Pending (Month)</p>
                          <p class="text-xs font-black text-orange-700 dark:text-orange-400 mt-0.5">₹{{ getPendingMonth(interest) | number:'1.0-0' }}</p>
                       </div>
                       <div class="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30 text-right">
                          <p class="text-[9px] font-black text-red-600 uppercase tracking-tight">Pending (Overall)</p>
                          <p class="text-xs font-black text-red-700 dark:text-red-400 mt-0.5">₹{{ getOverallPending(interest) | number:'1.0-0' }}</p>
                       </div>
                    </div>

                    <div class="pt-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 -mx-6 px-6 mt-4 -mb-6 pb-6 rounded-b-2xl border-t border-gray-100 dark:border-gray-700">
                       <div>
                          <p class="text-[9px] text-gray-400 uppercase tracking-widest font-black">Current Balance</p>
                          <p class="text-sm font-black text-red-600 dark:text-red-400">₹{{ getInterestBalance(interest) | number:'1.0-0' }}</p>
                       </div>
                       <button (click)="viewInterestDetails(interest.id!)" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm">
                          Manage
                       </button>
                    </div>
                 </div>
              }
           </div>
           @if (interests.length === 0) {
              <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <p class="text-gray-500 dark:text-gray-400">No Interest Schemes found. Create one to get started.</p>
              </div>
           }
        }

      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);

  activeTab: 'chitti' | 'interest' = 'chitti';
  
  chittis: ChittiScheme[] = [];
  interests: InterestScheme[] = [];
  allCustomers: Customer[] = [];

  ngOnInit() {
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
    
    let total = 0;
    this.allCustomers.forEach(cust => {
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
       // Collected this month
       (cust.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
             collected += p.amount;
          }
       });

       // Pending (cumulative)
       if (cust.joinedDate) {
          const joined = new Date(cust.joinedDate);
          let monthsCount = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1;
          const totalExpected = monthsCount * scheme.monthlyAmount;
          const totalPaid = (cust.payments || []).reduce((sum, p) => sum + p.amount, 0);
          pending += Math.max(0, totalExpected - totalPaid);
       }
    });

    return { collected, pending };
  }

  getCustomerCount(schemeId: string, type: 'chitti'): number {
     return this.allCustomers.filter(c => c.schemeId === schemeId && c.schemeType === type).length;
  }

  getInterestBalance(interest: InterestScheme): number {
     if (!interest.settlements) return interest.amount;
     const settled = interest.settlements.reduce((sum, s) => sum + s.amount, 0);
     return Math.max(0, interest.amount - settled);
  }

  getMonthlyInterest(interest: InterestScheme): number {
    const balance = this.getInterestBalance(interest);
    return (balance * (interest.interestRate || 0)) / 100;
  }

  getOverallPending(interest: InterestScheme): number {
    if (!interest || !interest.startDate) return 0;
    const start = new Date(interest.startDate);
    const today = new Date();
    let totalDue = 0;
    let iterDate = new Date(start);
    iterDate.setMonth(iterDate.getMonth() + 1);
    
    while (iterDate <= today) {
      const periodStart = new Date(iterDate);
      periodStart.setMonth(periodStart.getMonth() - 1);
      const settlementsBefore = (interest.settlements || [])
        .filter(s => new Date(s.date) < periodStart);
      const settledAmount = settlementsBefore.reduce((sum, s) => sum + s.amount, 0);
      const balance = Math.max(0, interest.amount - settledAmount);
      totalDue += (balance * (interest.interestRate / 100));
      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    const collectedTotal = (interest.interestCollections || []).reduce((sum, c) => sum + c.amount, 0);
    return Math.max(0, totalDue - collectedTotal);
  }

  getPendingMonth(interest: InterestScheme): number {
    const monthlyDue = this.getMonthlyInterest(interest);
    const collectedThisMonth = this.getInterestStats(interest).collectedMonth;
    return Math.max(0, monthlyDue - collectedThisMonth);
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

  getInterestStats(interest: InterestScheme): { collectedMonth: number, collectedTotal: number } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let collectedMonth = 0;
    let collectedTotal = 0;

    (interest.interestCollections || []).forEach(c => {
       const cDate = new Date(c.date);
       if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear) {
          collectedMonth += c.amount;
       }
       collectedTotal += c.amount;
    });

    return { collectedMonth, collectedTotal };
  }

  // --- Chitti Navigation & Actions ---
  goToCreateChit() {
    this.router.navigate(['/admin/create-chit']);
  }
  editChit(id: string) {
    this.router.navigate(['/admin/edit-chit', id]);
  }
  viewChitDetails(id: string) {
    this.router.navigate(['/admin/chit', id]);
  }
  async deleteChit(id: string) {
    if (confirm('Are you sure you want to permanently delete this Chitti scheme?')) {
      try {
        await this.chittiService.deleteChitti(id);
        this.toast.success('Chitti scheme deleted.');
      } catch (e) {
        this.toast.error('Failed to delete scheme.');
      }
    }
  }

  // --- Interest Navigation & Actions ---
  goToCreateInterest() {
    this.router.navigate(['/admin/create-interest']);
  }
  editInterest(id: string) {
    this.router.navigate(['/admin/edit-interest', id]);
  }
  viewInterestDetails(id: string) {
    this.router.navigate(['/admin/interest', id]);
  }
  async deleteInterest(id: string) {
    if (confirm('Are you sure you want to permanently delete this Interest scheme?')) {
      try {
        await this.interestService.deleteInterest(id);
        this.toast.success('Interest scheme deleted.');
      } catch (e) {
        this.toast.error('Failed to delete scheme.');
      }
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
