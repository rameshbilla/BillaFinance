import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { CommonModule } from '@angular/common';
import { take, filter } from 'rxjs';
import { BiometricService } from '../../services/biometric.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  public biometricService = inject(BiometricService);

  isLoading = signal(false);
  showPassword = false;
  showEnrollmentModal = false;
  private pendingProfile: any = null;

  forgotPasswordMode = signal(false);
  forgotPhone = '';
  otpSent = signal(false);
  otpCode = '';
  newPassword = '';
  forgotUsername = '';
  confirmationResult: any = null;
  simulatedOtp = '';
  isVerifyingOtp = signal(false);
  isSendingOtp = signal(false);

  ngOnInit() {
    // If biometrics are enabled, automatically trigger the login prompt
    if (this.biometricService.isBiometricEnabled()) {
      // Small delay to ensure UI is ready on native devices
      setTimeout(() => {
        this.biometricLogin();
      }, 500);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleForgotPasswordMode() {
    this.forgotPasswordMode.set(!this.forgotPasswordMode());
    this.otpSent.set(false);
    this.forgotPhone = '';
    this.otpCode = '';
    this.newPassword = '';
    this.forgotUsername = '';
    this.confirmationResult = null;
    this.simulatedOtp = '';
  }

  async sendForgotPasswordOtp() {
    if (!this.forgotPhone) {
      this.toastService.error('Please enter your mobile number.');
      return;
    }
    this.isSendingOtp.set(true);
    try {
      const customer = await this.authService.getCustomerByPhone(this.forgotPhone);
      if (!customer) {
        this.toastService.error('No customer record found with this mobile number.');
        this.isSendingOtp.set(false);
        return;
      }
      this.forgotUsername = customer.username;
      this.confirmationResult = await this.authService.sendOtp(this.forgotPhone, 'recaptcha-container');
      this.simulatedOtp = this.confirmationResult?.otpCode || '';
      this.otpSent.set(true);
      this.toastService.success('OTP sent successfully!');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      this.toastService.error(error.message || 'Failed to send OTP.');
    } finally {
      this.isSendingOtp.set(false);
    }
  }

  async verifyOtpAndResetPassword() {
    if (!this.otpCode) {
      this.toastService.error('Please enter the OTP.');
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toastService.error('Password must be at least 6 characters.');
      return;
    }
    this.isVerifyingOtp.set(true);
    try {
      await this.authService.verifyOtpAndChangePassword(
        this.confirmationResult,
        this.otpCode,
        this.newPassword,
        this.forgotUsername
      );
      this.toastService.success('Password updated successfully!');
      this.toggleForgotPasswordMode();
    } catch (error: any) {
      console.error('OTP reset error:', error);
      this.toastService.error(error.message || 'OTP verification or password update failed.');
    } finally {
      this.isVerifyingOtp.set(false);
    }
  }

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
        
        this.authService.userProfile$.pipe(
          filter(profile => !!profile),
          take(1)
        ).subscribe(profile => {
          if (profile) {
            this.handleLoginSuccess(profile);
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

  async biometricLogin() {
    this.isLoading.set(true);
    try {
      const credentials = await this.biometricService.getCredentials();
      if (credentials) {
        await this.authService.login(credentials.username, credentials.password);
        
        this.authService.userProfile$.pipe(
          filter(profile => !!profile),
          take(1)
        ).subscribe(profile => {
          if (profile) {
            this.handleLoginSuccess(profile, true);
          }
        });
      } else {
         this.toastService.error('Biometric authentication failed.');
      }
    } catch (error: any) {
      this.toastService.error(error.message || 'Biometric login failed.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleLoginSuccess(profile: any, isBiometric = false) {
    const isEnabled = this.biometricService.isBiometricEnabled();
    const isAvailable = await this.biometricService.checkAvailability();
    const hasPrompted = this.biometricService.hasPromptedForEnrollment();

    if (!isBiometric && !isEnabled && isAvailable && !hasPrompted) {
      this.pendingProfile = profile;
      this.showEnrollmentModal = true;
    } else {
      this.completeNavigation(profile);
    }
  }

  async enableBiometrics() {
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.biometricService.saveCredentials(email, password);
      this.biometricService.setBiometricEnabled(true);
      this.biometricService.setPromptedForEnrollment(true);
      this.toastService.success('Biometric login enabled!');
      this.showEnrollmentModal = false;
      this.completeNavigation(this.pendingProfile);
    } catch (e) {
      this.toastService.error('Failed to enable biometrics.');
    }
  }

  skipBiometrics() {
    this.biometricService.setPromptedForEnrollment(true);
    this.showEnrollmentModal = false;
    this.completeNavigation(this.pendingProfile);
  }

  private completeNavigation(profile: any) {
    this.toastService.success(`Welcome back, ${profile.displayName}!`);
    if (profile.role === 'admin' || profile.role === 'super-admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/customer']);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToGame() {
    this.router.navigate(['/car']);
  }
}
