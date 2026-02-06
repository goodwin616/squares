import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { GameService } from '../services/game';
import { map, switchMap, take, of, filter } from 'rxjs';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const gameService = inject(GameService);
  const router = inject(Router);

  return authService.user$.pipe(
    // Wait for the 'undefined' (loading) state to resolve
    filter((user) => user !== undefined),
    switchMap((user) => {
      if (!user) return of(false);
      return gameService.isSuperAdmin(user.uid);
    }),
    // Wait for a definitive true/false from the admin check
    filter((isSuper) => isSuper !== undefined),
    map((isSuper) => {
      if (isSuper === true) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
    take(1),
  );
};
