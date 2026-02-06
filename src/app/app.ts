import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './services/auth';
import { GameService } from './services/game';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private authService = inject(AuthService);
  private gameService = inject(GameService);
  protected readonly title = signal('Squares');

  user$ = this.authService.user$;

  isSuperAdmin$ = this.user$.pipe(
    switchMap((user) => {
      if (!user) return of(false);
      return this.gameService.isSuperAdmin(user.uid);
    }),
  );

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
