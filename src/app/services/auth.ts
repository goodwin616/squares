import { Injectable } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Observable, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth();
  private firestore = getFirestore();

  constructor() {
    this.handleRedirectResult();
  }

  // Observable for components to subscribe to authentication state
  // undefined = loading, null = logged out, User = logged in
  user$: Observable<User | null | undefined> = new Observable<User | null>((observer) => {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      observer.next(user);
    });
    return () => unsubscribe();
  }).pipe(startWith(undefined));

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        await this.updateUserProfile(result.user);
      }
    } catch (error) {
      console.error('Error handling redirect result:', error);
    }
  }

  private async updateUserProfile(user: User) {
    const userDoc = doc(this.firestore, `users/${user.uid}`);
    await setDoc(
      userDoc,
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      },
      { merge: true },
    );
  }

  async login() {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(this.auth, provider);
  }

  logout() {
    return signOut(this.auth);
  }
}
