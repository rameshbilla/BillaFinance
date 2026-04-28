import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { Firestore, collection, collectionData, query, where, deleteDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-manage-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-500 pb-20">
      <!-- Header -->
      <nav class="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 animate-fade-down">
        <div class="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
             </div>
             <div>
                <h1 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Admin Management</h1>
                <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Super Admin Console</p>
             </div>
          </div>
          <button (click)="goBack()" class="p-2 text-gray-400 hover:text-gray-600">
             <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </nav>

      <main class="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-up delay-100">
         
         <!-- Create Admin Form -->
         <section class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Register New Admin</h2>
            <form [formGroup]="adminForm" (ngSubmit)="createAdmin()" class="space-y-6">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                     <input type="text" formControlName="name" placeholder="Admin Full Name"
                        class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                  </div>
                  <div>
                     <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Username (Login ID)</label>
                     <div class="relative">
                        <span class="absolute left-4 top-4 text-gray-400 font-bold">&#64;</span>
                        <input type="text" formControlName="username" placeholder="username"
                           class="w-full pl-9 pr-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-black">
                     </div>
                  </div>
                  <div>
                     <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                     <input type="tel" formControlName="phone" placeholder="10 Digit Number"
                        class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white font-bold">
                  </div>
                  <div>
                     <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Default Password</label>
                     <input type="text" readonly value="admin123"
                        class="w-full px-5 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800/50 border-none outline-none text-gray-400 font-mono text-sm cursor-not-allowed">
                  </div>
               </div>
               
               <div class="flex justify-end pt-4">
                  <button type="submit" [disabled]="adminForm.invalid || isSaving"
                     class="px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all disabled:opacity-50">
                     {{ isSaving ? 'Establishing Account...' : 'Finalize Admin Access' }}
                  </button>
               </div>
            </form>
         </section>

         <!-- Admin List -->
         <section class="space-y-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white px-2">Active Admin Members</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               @for (admin of admins$ | async; track admin.uid) {
                  <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex justify-between items-center group">
                     <div>
                        <p class="font-black text-gray-900 dark:text-white leading-tight">{{ admin.displayName }}</p>
                        <p class="text-xs text-indigo-500 font-bold mt-0.5">&#64;{{ admin.username }}</p>
                        <p class="text-[10px] text-gray-400 mt-2 uppercase tracking-tighter">{{ admin.phone }}</p>
                     </div>
                     <button (click)="removeAdmin(admin)" class="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                     </button>
                  </div>
               }
               @if ((admins$ | async)?.length === 0) {
                  <div class="col-span-full py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem]">
                     <p class="text-gray-400 font-bold uppercase tracking-widest text-xs">No secondary admins enrolled</p>
                  </div>
               }
            </div>
         </section>
      </main>
    </div>
  `
})
export class ManageAdminsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private firestore = inject(Firestore);

  isSaving = false;
  admins$: Observable<UserProfile[]> | null = null;

  adminForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\.]+$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    const adminQuery = query(collection(this.firestore, 'users'), where('role', '==', 'admin'));
    this.admins$ = collectionData(adminQuery) as Observable<UserProfile[]>;
  }

  async createAdmin() {
    if (this.adminForm.valid) {
      this.isSaving = true;
      try {
        const { username, name, phone } = this.adminForm.value;
        const exists = await this.authService.checkUserExists(username);
        if (exists) {
          this.toast.error('Username or Identity already exists.');
          return;
        }

        await this.authService.provisionUser('admin', username, name, phone, 'admin123');
        this.toast.success(`Admin @${username} provisioned successfully!`);
        this.adminForm.reset();
      } catch (e: any) {
        this.toast.error(e.message || 'Failed to provision admin.');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async removeAdmin(admin: UserProfile) {
    if (confirm(`Revoke all admin privileges for @${admin.username}?`)) {
       try {
          // Remove from users collection
          await deleteDoc(doc(this.firestore, `users/${admin.uid}`));
          // Remove from admin_credentials collection
          await deleteDoc(doc(this.firestore, `admin_credentials/${admin.username}`));
          this.toast.success('Admin privileges revoked.');
       } catch (e) {
          this.toast.error('Failed to revoke privileges.');
       }
    }
  }

  goBack() {
    window.history.back();
  }
}
