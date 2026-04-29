import { Injectable, inject } from '@angular/core';
import { Auth, signOut, user, RecaptchaVerifier, signInWithPhoneNumber } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, docData, updateDoc } from '@angular/fire/firestore';
import { Observable, of, switchMap, BehaviorSubject, map } from 'rxjs';
import { BiometricService } from './biometric.service';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'super-admin' | 'admin' | 'customer';
  phone?: string;
  username?: string;
  address?: string;
  idType?: string;
  idValue?: string;
  tabConfig?: {
    interest: boolean;
    chitti: boolean;
    customers: boolean;
    bills: boolean;
    rentals: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private biometricService = inject(BiometricService);

  public get firebaseAuth() { return this.auth; }

  // BehaviorSubject for static/custom logins (admin + customers)
  private staticUserSubject = new BehaviorSubject<any | null>(null);

  // Combined user observable
  user$: Observable<any | null> = this.staticUserSubject.pipe(
    switchMap(staticUser => {
      if (staticUser) return of(staticUser);
      return user(this.auth);
    })
  );

  constructor() {
    // Restore session from localStorage
    const stored = localStorage.getItem('customSession');
    if (stored) {
      try {
        this.staticUserSubject.next(JSON.parse(stored));
      } catch { }
    }
  }

  // Profile observable — reads from Firestore users collection
  userProfile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap(u => {
      if (!u) return of(null);
      if (u.uid === 'super-admin-static') {
        return of({ uid: 'super-admin-static', email: 'admin', displayName: 'Super Admin', role: 'super-admin' } as UserProfile);
      }
      const userRef = doc(this.firestore, `users/${u.uid}`);
      return docData(userRef).pipe(
        map(data => (data || u) as UserProfile)
      );
    })
  );

  /**
   * MAIN LOGIN METHOD
   * - "admin" / "billa007" → static Super Admin bypass
   * - admin_credentials lookup → dynamic admins
   * - customer_credentials lookup → customers
   */
  async login(username: string, password: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');

    // 1. Static Super Admin login
    if (clean === 'admin' && password === 'billa007') {
      const mockAdmin: any = {
        uid: 'super-admin-static', email: 'admin', displayName: 'Super Admin',
        role: 'super-admin'
      };
      this.staticUserSubject.next(mockAdmin);
      localStorage.setItem('customSession', JSON.stringify(mockAdmin));
      
      // Save biometric credentials if enabled
      if (this.biometricService.isBiometricEnabled()) {
        await this.biometricService.saveCredentials(username, password);
      }
      return;
    }

    // 2. Secondary Admin login
    const adminCredRef = doc(this.firestore, `admin_credentials/${clean}`);
    const adminSnap = await getDoc(adminCredRef);
    if (adminSnap.exists()) {
      const data = adminSnap.data();
      if (data['password'] === password) {
        const mockUser: any = {
          uid: data['uid'],
          email: `${clean}@admin.billa`,
          displayName: data['displayName'] || clean,
          role: 'admin'
        };
        this.staticUserSubject.next(mockUser);
        localStorage.setItem('customSession', JSON.stringify(mockUser));
        if (this.biometricService.isBiometricEnabled()) {
          await this.biometricService.saveCredentials(clean, password);
        }
        return;
      } else {
        throw new Error('Incorrect password for admin.');
      }
    }

    // 3. Customer login
    const lookupRef = doc(this.firestore, `customer_credentials/${clean}`);
    const lookupSnap = await getDoc(lookupRef);

    if (lookupSnap.exists()) {
      const data = lookupSnap.data();
      if (data['password'] === password) {
        const mockUser: any = {
          uid: data['uid'],
          email: `${clean}@billa.finance`,
          displayName: data['displayName'] || clean,
          role: 'customer'
        };
        this.staticUserSubject.next(mockUser);
        localStorage.setItem('customSession', JSON.stringify(mockUser));
        if (this.biometricService.isBiometricEnabled()) {
          await this.biometricService.saveCredentials(clean, password);
        }
        return;
      } else {
        throw new Error('Incorrect password.');
      }
    }

    throw new Error(`No account found for "${clean}".`);
  }

  /**
   * Public registration is disabled.
   */
  async register(_email: string, _pass: string, _name: string, _role: string = 'customer') {
    throw new Error('Self-registration is disabled. Please contact your Admin.');
  }

  /**
   * GENERIC USER PROVISIONING — used for both Admins and Customers
   */
  async provisionUser(role: 'admin' | 'customer', username: string, name: string, phone: string, defaultPassword?: string, address?: string, idType?: string, idValue?: string, tabConfig?: any) {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const colName = role === 'admin' ? 'admin_credentials' : 'customer_credentials';
    const pwd = defaultPassword || (role === 'admin' ? 'admin123' : '123456');

    const credRef = doc(this.firestore, `${colName}/${cleanUsername}`);
    const existingSnap = await getDoc(credRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : null;

    // Ensure we don't accidentally pull undefined if an old record was incomplete
    const password = (existingData && existingData['password']) ? existingData['password'] : pwd;
    const uid = (existingData && existingData['uid']) ? existingData['uid'] : `${role}_${cleanUsername}_${Date.now()}`;

    const profileData = this.cleanData({
      uid,
      email: `${cleanUsername}@${role}.billa`,
      displayName: name,
      role,
      phone,
      username: cleanUsername,
      address,
      idType,
      idValue,
      tabConfig
    });

    await setDoc(doc(this.firestore, `users/${uid}`), profileData);
    await setDoc(credRef, this.cleanData({
      uid,
      username: cleanUsername,
      password,
      displayName: name,
      phone,
      role,
      address,
      idType,
      idValue,
      tabConfig,
      updatedAt: new Date().toISOString()
    }));

    return uid;
  }

  private cleanData(obj: any): any {
    const result: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  async updateAdminInfo(uid: string, username: string, name: string, phone: string, address?: string, idType?: string, idValue?: string, tabConfig?: any) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');

    // Update Users Collection
    const userRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userRef, this.cleanData({
      displayName: name,
      phone: phone,
      username: clean,
      address,
      idType,
      idValue,
      tabConfig
    }));

    // Update Admin Credentials
    const credRef = doc(this.firestore, `admin_credentials/${clean}`);
    const snap = await getDoc(credRef);
    if (snap.exists()) {
      await updateDoc(credRef, this.cleanData({
        displayName: name,
        phone: phone,
        address,
        idType,
        idValue,
        tabConfig,
        updatedAt: new Date().toISOString()
      }));
    }
  }

  async getAdminPassword(username: string): Promise<string | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const credRef = doc(this.firestore, `admin_credentials/${clean}`);
    const snap = await getDoc(credRef);
    if (snap.exists()) {
      return snap.data()['password'] || null;
    }
    return null;
  }

  async provisionCustomer(username: string, name: string, phone: string, defaultPassword = '123456', address?: string, idType?: string, idValue?: string) {
    return this.provisionUser('customer', username, name, phone, defaultPassword, address, idType, idValue);
  }


  async changePassword(username: string, newPassword: string, role: 'admin' | 'customer') {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const colName = role === 'admin' ? 'admin_credentials' : 'customer_credentials';
    const credRef = doc(this.firestore, `${colName}/${clean}`);
    const snap = await getDoc(credRef);
    if (!snap.exists()) throw new Error('Account record not found.');
    await setDoc(credRef, { ...snap.data(), password: newPassword });
  }

  async verifyAndChangePassword(username: string, currentPassword: string, newPassword: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');

    // Check admin first then customer
    let colName: string | null = null;
    let credRef = doc(this.firestore, `admin_credentials/${clean}`);
    let snap = await getDoc(credRef);

    if (snap.exists()) {
      colName = 'admin_credentials';
    } else {
      credRef = doc(this.firestore, `customer_credentials/${clean}`);
      snap = await getDoc(credRef);
      if (snap.exists()) colName = 'customer_credentials';
    }

    if (!colName || !snap.exists()) throw new Error('Account not found.');

    const stored = snap.data()['password'];
    if (stored !== currentPassword) throw new Error('Current password is incorrect.');

    await setDoc(credRef, { ...snap.data(), password: newPassword });
  }

  async sendOtpWithPhoneNumber(phone: string, recaptchaVerifier: RecaptchaVerifier) {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    return await signInWithPhoneNumber(this.auth, formattedPhone, recaptchaVerifier);
  }

  async verifyOtpAndChangePassword(confirmationResult: any, otp: string, newPassword: string, username: string) {
    await confirmationResult.confirm(otp);
    // Password change after OTP — we need to determine the role
    // For simplicity, checking both
    try {
      await this.changePassword(username, newPassword, 'admin');
    } catch {
      await this.changePassword(username, newPassword, 'customer');
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() as UserProfile : null;
  }

  async checkUserExists(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    // Check both
    const adminSnap = await getDoc(doc(this.firestore, `admin_credentials/${clean}`));
    if (adminSnap.exists()) return true;
    const custSnap = await getDoc(doc(this.firestore, `customer_credentials/${clean}`));
    return custSnap.exists();
  }

  async getUidByUsername(username: string): Promise<string | null> {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const adminSnap = await getDoc(doc(this.firestore, `admin_credentials/${clean}`));
    if (adminSnap.exists()) return adminSnap.data()!['uid'];
    const custSnap = await getDoc(doc(this.firestore, `customer_credentials/${clean}`));
    if (custSnap.exists()) return custSnap.data()!['uid'];
    return null;
  }

  async logout() {
    this.staticUserSubject.next(null);
    localStorage.removeItem('customSession');
    try { await signOut(this.auth); } catch { }
  }

  async isSuperAdmin(): Promise<boolean> {
    const u = this.staticUserSubject.value;
    return u?.role === 'super-admin';
  }

  async isAdmin(): Promise<boolean> {
    const u = this.staticUserSubject.value;
    return u?.role === 'admin' || u?.role === 'super-admin';
  }
}
