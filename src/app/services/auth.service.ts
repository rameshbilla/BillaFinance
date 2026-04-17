import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, RecaptchaVerifier, signInWithPhoneNumber } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, docData, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, of, switchMap, BehaviorSubject } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'customer';
  photoURL?: string;
  phone?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

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
      if (u.uid === 'admin-static') {
        return of({ uid: 'admin-static', email: 'admin', displayName: 'Admin', role: 'admin' } as UserProfile);
      }
      const userRef = doc(this.firestore, `users/${u.uid}`);
      return docData(userRef) as Observable<UserProfile>;
    })
  );

  /**
   * MAIN LOGIN METHOD
   * - "admin" / "billa007" → static admin bypass
   * - anything else → pure Firestore lookup (no Firebase Auth needed)
   */
  async login(username: string, password: string) {
    const clean = username.trim().replace(/^@/, '');

    // 1. Static admin login
    if ((clean === 'admin') && password === 'billa007') {
      const mockAdmin: any = {
        uid: 'admin-static', email: 'admin', displayName: 'Admin',
        emailVerified: true, isAnonymous: false, metadata: {} as any,
        providerData: [], refreshToken: '', tenantId: null,
        delete: () => Promise.resolve(), getIdToken: () => Promise.resolve(''),
        getIdTokenResult: () => Promise.resolve({} as any),
        reload: () => Promise.resolve(), toJSON: () => ({}),
        phoneNumber: null, photoURL: null, providerId: 'password'
      };
      this.staticUserSubject.next(mockAdmin);
      localStorage.setItem('customSession', JSON.stringify(mockAdmin));
      return;
    }

    // 2. Customer login — pure Firestore lookup
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
        return;
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    }

    throw new Error(`No account found for username "${clean}". Please contact your admin.`);
  }

  /**
   * Public registration is disabled. Customers are created by the Admin.
   * This stub prevents build errors from the RegisterComponent.
   */
  async register(_email: string, _pass: string, _name: string, _role: string = 'customer') {
    throw new Error('Self-registration is disabled. Please contact your Admin to create an account.');
  }

  /**
   * CUSTOMER PROVISIONING — pure Firestore, no Firebase Auth needed.
   * Called when Admin creates a customer in the Chitti scheme.
   */
  async provisionCustomer(username: string, name: string, phone: string, defaultPassword = '123456') {
    const clean = username.trim().replace(/^@/, '');

    // Check if credential already exists (to preserve existing password)
    const credRef = doc(this.firestore, `customer_credentials/${clean}`);
    const existingSnap = await getDoc(credRef);
    const existingPassword = existingSnap.exists() ? existingSnap.data()['password'] : defaultPassword;
    const existingUid = existingSnap.exists() ? existingSnap.data()['uid'] : `customer_${clean}_${Date.now()}`;

    const profile: UserProfile = {
      uid: existingUid,
      email: `${clean}@billa.finance`,
      displayName: name,
      role: 'customer',
      phone,
      username: clean
    };

    // Write/update user profile (full overwrite with latest data)
    await setDoc(doc(this.firestore, `users/${existingUid}`), profile);

    // Write/update credential record (preserve existing password)
    await setDoc(credRef, {
      uid: existingUid,
      username: clean,
      password: existingPassword,
      displayName: name,
      phone,
      role: 'customer',
      updatedAt: new Date().toISOString()
    });

    return existingUid;
  }

  /**
   * Change password for currently logged-in customer (Firestore only)
   */
  async changeCustomerPassword(username: string, newPassword: string) {
    const clean = username.trim().replace(/^@/, '');
    const credRef = doc(this.firestore, `customer_credentials/${clean}`);
    const snap = await getDoc(credRef);
    if (!snap.exists()) throw new Error('Credential record not found.');
    await setDoc(credRef, { ...snap.data(), password: newPassword });
  }

  /**
   * Verify current password then change to a new one (no Firebase Auth required)
   */
  async verifyAndChangePassword(username: string, currentPassword: string, newPassword: string) {
    const clean = username.trim().replace(/^@/, '');
    const credRef = doc(this.firestore, `customer_credentials/${clean}`);
    const snap = await getDoc(credRef);
    if (!snap.exists()) throw new Error('Account not found. Please contact your admin.');
    const stored = snap.data()['password'];
    if (stored !== currentPassword) throw new Error('Current password is incorrect. Please try again.');
    await setDoc(credRef, { ...snap.data(), password: newPassword });
    // Update the local session with new password awareness (re-login not needed)
  }

  async sendOtpWithPhoneNumber(phone: string, recaptchaVerifier: RecaptchaVerifier) {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    return await signInWithPhoneNumber(this.auth, formattedPhone, recaptchaVerifier);
  }

  async verifyOtpAndChangePassword(confirmationResult: any, otp: string, newPassword: string, username: string) {
    await confirmationResult.confirm(otp);
    await this.changeCustomerPassword(username, newPassword);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() as UserProfile : null;
  }

  async checkUserExists(username: string): Promise<boolean> {
    const clean = username.trim().replace(/^@/, '');
    const ref = doc(this.firestore, `customer_credentials/${clean}`);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async logout() {
    this.staticUserSubject.next(null);
    localStorage.removeItem('customSession');
    try { await signOut(this.auth); } catch { }
  }

  async isAdmin(): Promise<boolean> {
    const u = this.staticUserSubject.value;
    return u?.uid === 'admin-static';
  }
}
