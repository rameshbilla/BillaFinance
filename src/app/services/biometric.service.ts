import { Injectable } from '@angular/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private isAvailableSubject = new BehaviorSubject<boolean>(false);
  public isAvailable$ = this.isAvailableSubject.asObservable();
  
  private readonly SERVER_NAME = 'finserve_secure_vault';

  constructor() {
    this.checkAvailability();
  }

  async checkAvailability(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      this.isAvailableSubject.next(false);
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      const isAvailable = !!result.isAvailable;
      this.isAvailableSubject.next(isAvailable);
      return isAvailable;
    } catch (error) {
      console.warn('Biometric availability check failed:', error);
      this.isAvailableSubject.next(false);
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean) {
    localStorage.setItem('biometric_enabled', enabled ? 'true' : 'false');
  }

  isBiometricEnabled(): boolean {
    return localStorage.getItem('biometric_enabled') === 'true';
  }

  hasPromptedForEnrollment(): boolean {
    return localStorage.getItem('biometric_prompted') === 'true';
  }

  setPromptedForEnrollment(val: boolean) {
    localStorage.setItem('biometric_prompted', val ? 'true' : 'false');
  }

  async verifyIdentity(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to enable biometric login for your FinServe account',
        title: 'Biometric Verification',
        subtitle: 'Identification required',
        description: 'Please scan your fingerprint or Face ID to continue',
        negativeButtonText: 'Cancel'
      });
      return true;
    } catch (error) {
      console.error('Identity verification failed:', error);
      return false;
    }
  }

  async saveCredentials(username: string, password: string) {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await NativeBiometric.setCredentials({
        server: this.SERVER_NAME,
        username,
        password
      });
      console.log('Credentials saved securely');
    } catch (error) {
      console.error('Failed to save biometric credentials:', error);
    }
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to login into your FinServe account',
        title: 'Biometric Login',
        subtitle: 'Identification required',
        description: 'Please scan your fingerprint or Face ID to continue',
        negativeButtonText: 'Cancel'
      });

      const credentials = await NativeBiometric.getCredentials({
        server: this.SERVER_NAME
      });
      return {
        username: credentials.username,
        password: credentials.password
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  }

  async clearCredentials() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await NativeBiometric.deleteCredentials({
        server: this.SERVER_NAME
      });
      this.setBiometricEnabled(false);
    } catch (error) {
       console.error('Failed to clear biometric credentials:', error);
    }
  }
}
