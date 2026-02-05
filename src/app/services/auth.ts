import { Injectable } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

  // Observable for components to subscribe to authentication state
  // undefined = loading, null = logged out, User = logged in
  user$: Observable<User | null | undefined> = new Observable<User | null>((observer) => {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      observer.next(user);
    });
    return () => unsubscribe();
  }).pipe(startWith(undefined));

  async login() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    // Update User Profile in Firestore on every login to keep sync
    if (user) {
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
  }

  logout() {
    return signOut(this.auth);
  }
}
