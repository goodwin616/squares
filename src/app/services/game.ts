import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  onSnapshot,
  where,
  collectionGroup,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Observable, map, switchMap, combineLatest, of } from 'rxjs';

export interface ScoreValue {
  home: number | null;
  away: number | null;
}

export interface GameScores {
  q1: ScoreValue;
  half: ScoreValue;
  q3: ScoreValue;
  final: ScoreValue;
  [key: string]: ScoreValue;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

export interface Square {
  id: string;
  owner_id: string;
  owner_name: string;
  is_paid: boolean;
}

export interface GameConfigData {
  price: number;
  payouts: Record<string, number>;
  rules: {
    unclaimed_rule: string;
    max_squares: number | null;
  };
}

export interface Game {
  id: string;
  admin_id: string;
  status: string;
  grid_numbers?: {
    row: number[];
    col: number[];
  };
  scores?: GameScores;
  config?: GameConfigData;
  big_game_id?: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private firestore = getFirestore();
  private functions = getFunctions();

  // --- Reads ---
  getUsers(uids: string[]): Observable<UserProfile[]> {
    if (!uids || uids.length === 0) return of([]);

    const uniqueIds = [...new Set(uids)];

    const userObservables = uniqueIds.map((uid) => {
      const userDoc = doc(this.firestore, 'users', uid);
      return new Observable<UserProfile>((observer) => {
        const unsubscribe = onSnapshot(
          userDoc,
          (snap) => {
            if (snap.exists()) {
              observer.next({ uid: snap.id, ...snap.data() } as UserProfile);
            } else {
              observer.next({ uid: uid, displayName: 'Unknown' });
            }
          },
          (error) => {
            console.error(`Error fetching user ${uid}:`, error);
            observer.next({ uid: uid, displayName: 'Unknown' });
          },
        );
        return () => unsubscribe();
      });
    });

    return combineLatest(userObservables);
  }

  getOwnedGames(userId: string): Observable<Game[]> {
    const gamesCol = collection(this.firestore, 'games');
    const q = query(gamesCol, where('admin_id', '==', userId));
    return new Observable<Game[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Game);
          observer.next(data);
        },
        (error) => {
          observer.error(error);
        },
      );
      return () => unsubscribe();
    });
  }

  getParticipatingGames(userId: string): Observable<Game[]> {
    const squaresCol = collectionGroup(this.firestore, 'squares');
    const q = query(squaresCol, where('owner_id', '==', userId));

    return new Observable<string[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const gameIds = [...new Set(snap.docs.map((d) => d.ref.parent.parent!.id))];
          observer.next(gameIds);
        },
        (error) => {
          observer.error(error);
        },
      );
      return () => unsubscribe();
    }).pipe(
      switchMap((gameIds) => {
        if (gameIds.length === 0) return of([]);

        const gameRequests = gameIds.map((id) => this.getGame(id));
        return combineLatest(gameRequests).pipe(
          map((games) => games.filter((g): g is Game => !!g)),
        );
      }),
    );
  }

  getGame(gameId: string): Observable<Game | null> {
    const gameDoc = doc(this.firestore, `games/${gameId}`);
    return new Observable<Game | null>((observer) => {
      const unsubscribe = onSnapshot(
        gameDoc,
        (snap) => {
          if (snap.exists()) {
            observer.next({ id: snap.id, ...snap.data() } as Game);
          } else {
            observer.next(null);
          }
        },
        (error) => {
          observer.error(error);
        },
      );
      return () => unsubscribe();
    }).pipe(
      switchMap((game) => {
        if (!game || !game.big_game_id) {
          return of(game);
        }
        return this.getGlobalScores(game.big_game_id).pipe(
          map((scores) => {
            if (scores) {
              return { ...game, scores };
            }
            return game;
          }),
        );
      }),
    );
  }

  getGlobalScores(year: string): Observable<GameScores | null> {
    const scoresDoc = doc(this.firestore, `scores/${year}`);
    return new Observable<GameScores | null>((observer) => {
      const unsubscribe = onSnapshot(
        scoresDoc,
        (snap) => {
          if (snap.exists()) {
            observer.next(snap.data() as GameScores);
          } else {
            observer.next(null);
          }
        },
        (error) => {
          console.error(`Error fetching global scores for ${year}:`, error);
          observer.next(null); // Emit null on error so the stream doesn't hang
        },
      );
      return () => unsubscribe();
    });
  }

  getSquares(gameId: string): Observable<Square[]> {
    const squaresCol = collection(this.firestore, `games/${gameId}/squares`);
    const q = query(squaresCol);
    return new Observable((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Square);
          observer.next(data);
        },
        (error) => {
          observer.error(error);
        },
      );
      return () => unsubscribe();
    });
  }

  // --- Writes ---
  async createGame(gameData: Partial<Game>): Promise<string> {
    const gamesCol = collection(this.firestore, 'games');
    const docRef = doc(gamesCol);
    await setDoc(docRef, { ...gameData, id: docRef.id });
    return docRef.id;
  }

  async claimSquare(
    gameId: string,
    squareId: number,
    user: { uid: string; displayName: string | null },
  ) {
    const squareDoc = doc(this.firestore, `games/${gameId}/squares/${squareId}`);
    await setDoc(squareDoc, {
      id: squareId.toString(),
      owner_id: user.uid,
      owner_name: user.displayName,
      is_paid: false,
    });
  }

  async releaseSquare(gameId: string, squareId: number) {
    const squareDoc = doc(this.firestore, `games/${gameId}/squares/${squareId}`);
    await deleteDoc(squareDoc);
  }

  // --- Admin ---
  async deleteGame(gameId: string) {
    const gameDoc = doc(this.firestore, `games/${gameId}`);
    await deleteDoc(gameDoc);
  }

  async togglePaidStatus(gameId: string, squareId: string, isPaid: boolean) {
    const squareDoc = doc(this.firestore, `games/${gameId}/squares/${squareId}`);
    await updateDoc(squareDoc, { is_paid: isPaid });
  }

  async togglePlayerPaidStatus(gameId: string, userId: string, isPaid: boolean) {
    const squaresCol = collection(this.firestore, `games/${gameId}/squares`);
    const q = query(squaresCol, where('owner_id', '==', userId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { is_paid: isPaid });
    });

    await batch.commit();
  }

  async startGame(gameId: string) {
    const startGameFn = httpsCallable(this.functions, 'start_game');
    return startGameFn({ gameId });
  }

  async updateScores(gameId: string, scores: GameScores) {
    const gameDoc = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameDoc, { scores });
  }

  async updateGameConfig(gameId: string, config: GameConfigData) {
    const gameDoc = doc(this.firestore, `games/${gameId}`);
    await updateDoc(gameDoc, { config });
  }

  // --- Super Admin ---
  async saveGlobalScores(year: string, scores: GameScores) {
    const scoresDoc = doc(this.firestore, `scores/${year}`);
    await setDoc(scoresDoc, scores, { merge: true });
  }

  isSuperAdmin(uid: string): Observable<boolean> {
    const adminDoc = doc(this.firestore, `super_admins/${uid}`);
    return new Observable<boolean>((observer) => {
      const unsubscribe = onSnapshot(
        adminDoc,
        (snap) => {
          observer.next(snap.exists());
        },
        (error) => {
          console.error('Error checking super admin status', error);
          observer.next(false);
        },
      );
      return () => unsubscribe();
    });
  }
}
