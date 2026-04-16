import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { CommonModule } from '@angular/common';
import { take, filter } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isLoading = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      const { email, password } = this.loginForm.value;
      
      try {
        await this.authService.login(email, password);
        
        // On successful login, check role and redirect
        this.authService.userProfile$.pipe(
          filter(profile => !!profile),
          take(1)
        ).subscribe(profile => {
          if (profile) {
            this.toastService.success(`Welcome back, ${profile.displayName}!`);
            if (profile.role === 'admin') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/customer']);
            }
          }
        });
      } catch (error: any) {
        console.error('Login error:', error);
        this.toastService.error(error.message || 'Login failed. Please check your credentials.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
