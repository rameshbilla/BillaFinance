import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, updateProfile, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, docData } from '@angular/fire/firestore';
import { Observable, of, switchMap, map, from } from 'rxjs';

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

  // Observable for current user auth state
  user$ = user(this.auth);

  // Observable for current user profile from Firestore
  userProfile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap(user => {
      if (!user) return of(null);
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
    return await signInWithEmailAndPassword(this.auth, email, pass);
  }

  async logout() {
    return await signOut(this.auth);
  }

  // Helper to check if current user is admin
  async isAdmin(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data()?.['role'] === 'admin';
    }
    return false;
  }
}
