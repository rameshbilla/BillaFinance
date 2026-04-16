import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isLoading = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      adminCode: ['']
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      const { email, password, fullName, adminCode } = this.registerForm.value;
      const role = (adminCode === environment.adminSecretCode) ? 'admin' : 'customer';
      
      try {
        await this.authService.register(email, password, fullName, role);
        this.toastService.success('Registration successful! Redirecting...');
        
        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/customer']);
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        this.toastService.error(error.message || 'Registration failed. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
