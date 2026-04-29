import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent), data: { animation: 'LoginPage' } },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent), data: { animation: 'RegisterPage' } },
  { 
    path: 'admin', 
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent), data: { animation: 'AdminDash' } },
      { path: 'create-chit', loadComponent: () => import('./admin/chit-create/chit-create.component').then(m => m.AdminChitCreateComponent), data: { animation: 'ChitForm' } },
      { path: 'edit-chit/:id', loadComponent: () => import('./admin/chit-create/chit-create.component').then(m => m.AdminChitCreateComponent), data: { animation: 'ChitForm' } },
      { path: 'chit/:id', loadComponent: () => import('./admin/chit-details/chit-details.component').then(m => m.AdminChitDetailsComponent), data: { animation: 'ChitDetails' } },
      { path: 'create-interest', loadComponent: () => import('./admin/interest-create/interest-create.component').then(m => m.AdminInterestCreateComponent), data: { animation: 'InterestForm' } },
      { path: 'edit-interest/:id', loadComponent: () => import('./admin/interest-create/interest-create.component').then(m => m.AdminInterestCreateComponent), data: { animation: 'InterestForm' } },
      { path: 'interest/:id', loadComponent: () => import('./admin/interest-details/interest-details.component').then(m => m.AdminInterestDetailsComponent), data: { animation: 'InterestDetails' } },
      { path: 'manage-admins', loadComponent: () => import('./admin/manage-admins/manage-admins.component').then(m => m.ManageAdminsComponent), data: { animation: 'ManageAdmins' } },
    ]
  },
  { 
    path: 'customer', 
    canActivate: [authGuard],
    loadComponent: () => import('./customer/dashboard/dashboard.component').then(m => m.CustomerDashboardComponent),
    data: { animation: 'CustomerDash' }
  }
];
