import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChittiService, ChittiScheme } from '../../admin/services/chitti.service';
import { InterestService, InterestScheme } from '../../admin/services/interest.service';
import { CustomerService, Customer } from '../../admin/services/customer.service';
import { ToastService } from '../../shared/toast.service';
import { Observable, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <!-- Top Navigation -->
      <nav class="bg-gradient-to-r from-purple-800 to-indigo-900 sticky top-0 z-50 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-white">FinServe</span>
            </div>
            <div class="flex space-x-4 items-center" *ngIf="authService.userProfile$ | async as profile">
              <span class="text-purple-200 text-sm font-medium hidden sm:block">Welcome, {{ profile.displayName || 'Customer' }}</span>
              <button (click)="logout()" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-medium border border-white/10 backdrop-blur-sm">Log out</button>
            </div>
            <div class="flex space-x-4 items-center" *ngIf="!(authService.userProfile$ | async)">
               <span class="text-purple-200 text-sm font-medium hidden sm:block">Welcome, Customer</span>
               <button (click)="logout()" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-medium border border-white/10 backdrop-blur-sm">Log out</button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" *ngIf="profile$ | async as profile">
        
        <!-- Total Balance Card -->
        <div class="bg-gradient-to-br from-purple-600 to-pink-500 rounded-[2rem] p-8 shadow-xl mb-8 text-white relative overflow-hidden">
           <div class="absolute top-0 right-0 p-12 opacity-10">
              <svg class="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.11-1.36-3.11-3.09h2.38c0 1.04 1.15 1.51 2.05 1.51 1.48 0 2.22-.72 2.22-1.63 0-2.31-4.78-1.22-4.78-4.73 0-1.54 1.19-2.61 2.91-2.94V5.1h2.67v1.93c1.68.32 2.76 1.43 2.85 2.89h-2.32c-.11-.84-.96-1.35-1.91-1.35-1.07 0-2.14.54-2.14 1.5 0 2.23 4.78 1.16 4.78 4.79 0 1.83-1.42 2.87-2.93 3.23z"/></svg>
           </div>
           
           <div class="relative z-10">
              <p class="text-purple-100 font-medium tracking-wide">Net Outstanding Dues</p>
              <h2 class="text-5xl font-extrabold mt-2 mb-4">₹{{ totalDues$ | async | number:'1.0-0' }}</h2>
              <div class="flex space-x-4 mt-6">
                 <button class="px-6 py-2.5 bg-white text-purple-700 rounded-xl font-bold shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">Support Center</button>
                 <button class="px-6 py-2.5 bg-purple-800/40 border border-purple-300/30 text-white rounded-xl font-medium hover:bg-purple-800/60 transition-all">My Profile</button>
              </div>
           </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- My Chit Schemes -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">My Chit Schemes</h3>
            <div class="space-y-4">
               <div *ngFor="let chit of chits$ | async" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  <div class="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-l-2xl"></div>
                  <div class="flex justify-between items-start">
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-lg">{{ chit.name }}</h4>
                        <p class="text-gray-500 text-sm mt-1">₹{{ chit.monthlyAmount }}/mo • Valued at ₹{{ chit.totalValue }}</p>
                     </div>
                  </div>
               </div>
               <div *ngIf="(chits$ | async)?.length === 0" class="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p class="text-gray-500">You haven't joined any schemes yet.</p>
               </div>
            </div>
          </div>

          <!-- My Loans -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Loans</h3>
            <div class="space-y-4">
               <div *ngFor="let loan of loans$ | async" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div class="flex justify-between mb-4">
                     <div>
                        <h4 class="font-bold text-gray-900 dark:text-white text-lg">{{ loan.name }}</h4>
                        <p class="text-gray-500 text-sm">Principal: ₹{{ loan.amount }} &#64; {{ loan.interestRate }}%</p>
                     </div>
                     <div class="text-right">
                        <p class="text-sm text-gray-500">Remaining Balance</p>
                        <p class="font-bold text-gray-900 dark:text-white text-lg text-pink-600">₹{{ getBalance(loan) | number:'1.0-0' }}</p>
                     </div>
                  </div>
               </div>
               <div *ngIf="(loans$ | async)?.length === 0" class="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p class="text-gray-500">No active loans found.</p>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private chittiService = inject(ChittiService);
  private interestService = inject(InterestService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);

  profile$ = this.authService.userProfile$;
  chits$: Observable<ChittiScheme[]> = of([]);
  loans$: Observable<InterestScheme[]> = of([]);
  totalDues$: Observable<number> = of(0);

  ngOnInit() {
    this.chits$ = this.profile$.pipe(
      switchMap(profile => {
        if (!profile || !profile.phone) return of([]);
        return this.customerService.getCustomersByUserIdentifier(profile.phone).pipe(
           switchMap(customerRecords => {
              if (customerRecords.length === 0) return of([]);
              const schemeIds = customerRecords.map(r => r.schemeId);
              return this.chittiService.getChittis().pipe(
                 map(chits => chits.filter(c => schemeIds.includes(c.id!)))
              );
           })
        );
      })
    );

    this.loans$ = this.profile$.pipe(
      switchMap(profile => {
        if (!profile) return of([]);
        // Filter interests by borrower phone matching profile phone or email
        return this.interestService.getInterests().pipe(
           map(interests => interests.filter(i => 
             (profile.phone && i.borrowerPhone === profile.phone) || 
             (profile.email && i.borrowerEmail === profile.email)
           ))
        );
      })
    );

    this.totalDues$ = this.loans$.pipe(
      map(loans => loans.reduce((acc, loan) => acc + this.getBalance(loan), 0))
    );
  }

  getBalance(loan: InterestScheme): number {
    const settled = (loan.settlements || []).reduce((sum, s) => sum + s.amount, 0);
    return Math.max(0, loan.amount - settled);
  }

  logout() {
    this.authService.logout().then(() => {
      this.toast.success('Successfully logged out.');
      this.router.navigate(['/login']);
    });
  }
}
