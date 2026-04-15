import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChittiService, ChittiScheme } from '../services/chitti.service';
import { CustomerService, Customer } from '../services/customer.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-admin-chit-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center space-x-4">
           <button (click)="goBack()" class="text-gray-500 hover:text-purple-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-white">Chit Scheme Details</h1>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        @if (scheme) {
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8 flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ scheme.name }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ scheme.startDate }} to {{ scheme.endDate }} • {{ scheme.tenure }} Months • ₹{{ scheme.monthlyAmount }} / month</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
              <p class="text-3xl font-extrabold text-purple-600 dark:text-purple-400">₹{{ scheme.totalValue }}</p>
            </div>
          </div>
        }

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Enrolled Customers</h3>
            <button (click)="openAddCustomerModal()" class="flex items-center px-4 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-sm">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              Add Customer
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <th class="px-6 py-4 font-medium">Name</th>
                  <th class="px-6 py-4 font-medium">Contact</th>
                  <th class="px-6 py-4 font-medium">Joined Date</th>
                  <th class="px-6 py-4 font-medium">Status</th>
                  <th class="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                @for (customer of customers; track customer.id) {
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ customer.name }}</td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ customer.phone }}<br><span class="text-xs">{{ customer.email }}</span></td>
                    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ customer.joinedDate }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                            [ngClass]="{'bg-green-100 text-green-800': customer.status === 'Active', 'bg-red-100 text-red-800': customer.status === 'Inactive'}">
                        {{ customer.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right space-x-3 text-sm font-medium">
                      <button (click)="openEditCustomerModal(customer)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Edit</button>
                      <button (click)="deleteCustomer(customer.id!)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                }
                @if (customers.length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No customers enrolled yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Customer Modal -->
      @if (showModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ isEditModal ? 'Edit Customer' : 'Add Customer' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" formControlName="name" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input type="text" formControlName="phone" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" formControlName="email" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joined Date</label>
                <input type="date" formControlName="joinedDate" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select formControlName="status" class="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div class="pt-4 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()" class="px-5 py-2 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">Cancel</button>
                <button type="submit" [disabled]="customerForm.invalid || isSaving" class="px-5 py-2 font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors text-sm">
                  {{ isSaving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminChitDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chittiService = inject(ChittiService);
  private customerService = inject(CustomerService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  schemeId: string | null = null;
  scheme: ChittiScheme | null = null;
  customers: Customer[] = [];

  showModal = false;
  isEditModal = false;
  editingCustomerId: string | null = null;
  isSaving = false;

  customerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    joinedDate: ['', Validators.required],
    status: ['Active', Validators.required]
  });

  ngOnInit() {
    this.schemeId = this.route.snapshot.paramMap.get('id');
    if (this.schemeId) {
      this.loadScheme();
      this.loadCustomers();
    }
  }

  loadScheme() {
    this.chittiService.getChittiById(this.schemeId!).subscribe(data => {
      this.scheme = data;
    });
  }

  loadCustomers() {
    this.customerService.getCustomersByScheme(this.schemeId!, 'chitti').subscribe(data => {
      this.customers = data;
    });
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  openAddCustomerModal() {
    this.isEditModal = false;
    this.editingCustomerId = null;
    this.customerForm.reset({ status: 'Active' });
    this.showModal = true;
  }

  openEditCustomerModal(customer: Customer) {
    this.isEditModal = true;
    this.editingCustomerId = customer.id!;
    this.customerForm.patchValue(customer);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveCustomer() {
    if (this.customerForm.valid && this.schemeId) {
      this.isSaving = true;
      const customerData: Customer = {
        ...this.customerForm.value,
        schemeId: this.schemeId,
        schemeType: 'chitti'
      };

      try {
        if (this.isEditModal && this.editingCustomerId) {
          await this.customerService.updateCustomer(this.editingCustomerId, customerData);
          this.toast.success('Customer updated successfully!');
        } else {
          await this.customerService.addCustomer(customerData);
          this.toast.success('Customer added successfully!');
        }
        this.closeModal();
      } catch (error) {
        console.error('Error saving customer', error);
        this.toast.error('Failed to save customer');
      } finally {
        this.isSaving = false;
      }
    }
  }

  async deleteCustomer(id: string) {
    if (confirm('Are you sure you want to remove this customer?')) {
      try {
        await this.customerService.deleteCustomer(id);
        this.toast.success('Customer removed.');
      } catch (error) {
        console.error('Error deleting customer', error);
        this.toast.error('Failed to remove customer.');
      }
    }
  }
}
