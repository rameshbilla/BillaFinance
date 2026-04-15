import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, updateProfile, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, docData } from '@angular/fire/firestore';
import { Observable, of, switchMap, map, from, BehaviorSubject } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'customer';
  photoURL?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // BehaviorSubject for static admin login
  private staticUserSubject = new BehaviorSubject<User | null>(null);

  // Observable for current user auth state (Firebase + static)
  user$: Observable<User | null> = this.staticUserSubject.pipe(
    switchMap(staticUser => {
      if (staticUser) {
        return of(staticUser);
      }
      return user(this.auth);
    })
  );

  constructor() {
    // Check if admin is statically logged in
    const adminLoggedIn = localStorage.getItem('adminLoggedIn');
    if (adminLoggedIn === 'true') {
      const adminUserStr = localStorage.getItem('adminUser');
      if (adminUserStr) {
        const adminUser = JSON.parse(adminUserStr);
        this.staticUserSubject.next(adminUser);
      }
    }
  }

  // Observable for current user profile from Firestore or static
  userProfile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);
      
      // Check if it's static admin
      if (user.uid === 'admin-static') {
        return of({
          uid: 'admin-static',
          email: 'admin',
          displayName: 'Admin',
          role: 'admin'
        } as UserProfile);
      }
      
      const userRef = doc(this.firestore, `users/${user.uid}`);
      return docData(userRef) as Observable<UserProfile>;
    })
  );

  async register(email: string, pass: string, name: string, role: 'admin' | 'customer' = 'customer') {
    const credentials = await createUserWithEmailAndPassword(this.auth, email, pass);
    const user = credentials.user;
    
    await updateProfile(user, { displayName: name });

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      role: role
    };

    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, userProfile);
    
    return credentials;
  }

  async login(email: string, pass: string) {
    // Check for static admin credentials
    if (email === 'admin' && pass === 'billa007') {
      // Simulate admin login
      const mockUser: User = {
        uid: 'admin-static',
        email: 'admin',
        displayName: 'Admin',
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: () => Promise.resolve(),
        getIdToken: () => Promise.resolve(''),
        getIdTokenResult: () => Promise.resolve({} as any),
        reload: () => Promise.resolve(),
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password'
      };
      this.staticUserSubject.next(mockUser);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminUser', JSON.stringify(mockUser));
      return Promise.resolve();
    }
    
    // Reset static user for regular login
    this.staticUserSubject.next(null);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    
    return await signInWithEmailAndPassword(this.auth, email, pass);
  }

  async logout() {
    // Clear static admin login
    this.staticUserSubject.next(null);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    
    return await signOut(this.auth);
  }

  // Helper to check if current user is admin
  async isAdmin(): Promise<boolean> {
    const user = this.staticUserSubject.value;
    if (user && user.uid === 'admin-static') {
      return true;
    }
    
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return false;
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data()?.['role'] === 'admin';
    }
    return false;
  }
}
