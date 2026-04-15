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
        <div class="flex space-x-1 p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl max-w-sm mb-8 relative">
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
                    <div class="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                       <p class="text-xs text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline" (click)="viewChitDetails(chit.id!)">Manage Customers →</p>
                       <p class="text-lg font-bold text-gray-900 dark:text-white">₹{{ chit.totalValue }}</p>
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

           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (interest of interests; track interest.id) {
                 <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
                    <div class="flex justify-between items-start mb-4">
                       <h3 class="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" (click)="viewInterestDetails(interest.id!)">{{ interest.borrowerName || 'Unknown Borrower' }}</h3>
                       <div class="flex space-x-2">
                          <button (click)="editInterest(interest.id!)" class="text-gray-400 hover:text-indigo-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                          <button (click)="deleteInterest(interest.id!)" class="text-gray-400 hover:text-red-500 transition-colors p-1"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                       </div>
                    </div>
                    <div class="mb-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                       <p class="font-medium text-gray-800 dark:text-gray-200">{{ interest.name }}</p>
                       <p class="mt-2 text-blue-600 dark:text-blue-400 font-medium flex items-center">
                          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          Principal: ₹{{ interest.amount | number:'1.0-0' }}
                       </p>
                    </div>
                    <div class="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                       <p class="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline" (click)="viewInterestDetails(interest.id!)">Manage / Settle →</p>
                       <div class="text-right">
                         <p class="text-xs text-gray-500">Balance</p>
                         <p class="text-lg font-bold text-gray-900 dark:text-white text-red-600 dark:text-red-400">₹{{ getInterestBalance(interest) | number:'1.0-0' }}</p>
                       </div>
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

  getCustomerCount(schemeId: string, type: 'chitti'): number {
     return this.allCustomers.filter(c => c.schemeId === schemeId && c.schemeType === type).length;
  }

  getInterestBalance(interest: InterestScheme): number {
     if (!interest.settlements) return interest.amount;
     const settled = interest.settlements.reduce((sum, s) => sum + s.amount, 0);
     return Math.max(0, interest.amount - settled);
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
