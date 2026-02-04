import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth';
import { GameService } from '../../services/game';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { switchMap, map, of, Observable, combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private gameService = inject(GameService);
  private dialog = inject(MatDialog);

  user$ = this.authService.user$;

  vm$: Observable<{ owned: unknown[]; joined: unknown[] } | undefined> = this.user$.pipe(
    switchMap((user) => {
      if (user === undefined) return of(undefined);
      if (!user) return of({ owned: [], joined: [] });

      return combineLatest({
        owned: this.gameService.getOwnedGames(user.uid),
        joined: this.gameService
          .getParticipatingGames(user.uid)
          .pipe(map((games) => games.filter((g) => g.admin_id !== user.uid))),
      }).pipe(startWith(undefined));
    }),
  );

  login() {
    this.authService.login();
  }

  deleteGame(event: Event, game: { id: string; name: string }) {
    event.preventDefault();
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Game',
        message: `Are you sure you want to delete "${game.name}"? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.gameService.deleteGame(game.id);
        } catch (error) {
          console.error('Error deleting game:', error);
          // Ideally show a snackbar here
        }
      }
    });
  }
}
