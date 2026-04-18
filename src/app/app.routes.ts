import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { 
    path: 'admin', 
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'create-chit', loadComponent: () => import('./admin/chit-create/chit-create.component').then(m => m.AdminChitCreateComponent) },
      { path: 'edit-chit/:id', loadComponent: () => import('./admin/chit-create/chit-create.component').then(m => m.AdminChitCreateComponent) },
      { path: 'chit/:id', loadComponent: () => import('./admin/chit-details/chit-details.component').then(m => m.AdminChitDetailsComponent) },
      { path: 'create-interest', loadComponent: () => import('./admin/interest-create/interest-create.component').then(m => m.AdminInterestCreateComponent) },
      { path: 'edit-interest/:id', loadComponent: () => import('./admin/interest-create/interest-create.component').then(m => m.AdminInterestCreateComponent) },
      { path: 'interest/:id', loadComponent: () => import('./admin/interest-details/interest-details.component').then(m => m.AdminInterestDetailsComponent) },
    ]
  },
  { 
    path: 'customer', 
    canActivate: [authGuard],
    loadComponent: () => import('./customer/dashboard/dashboard.component').then(m => m.CustomerDashboardComponent) 
  }
];
