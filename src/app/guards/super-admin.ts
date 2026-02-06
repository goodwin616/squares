import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { GameService } from '../services/game';
import { map, switchMap, take, of } from 'rxjs';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const gameService = inject(GameService);
  const router = inject(Router);

  return authService.user$.pipe(
    // Filter out the 'undefined' initial state
    switchMap((user) => {
      if (user === undefined) return of(undefined);
      if (!user) return of(false);
      return gameService.isSuperAdmin(user.uid);
    }),
    // Wait for a definitive true/false
    map((isSuper) => {
      if (isSuper === true) {
        return true;
      }
      if (isSuper === false) {
        router.navigate(['/']);
        return false;
      }
      return false;
    }),
    take(1)
  );
};
