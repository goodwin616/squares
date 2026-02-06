import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameService, GameScores } from '../../../services/game';
import { AuthService } from '../../../services/auth';
import { GAMES_SCHEDULE } from '../../../config/games';
import { BehaviorSubject, switchMap, tap, map } from 'rxjs';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './super-admin.html',
  styleUrls: ['./super-admin.scss'],
})
export class SuperAdminComponent {
  private gameService = inject(GameService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  year$ = new BehaviorSubject<string>(new Date().getFullYear().toString());

  gameConfig$ = this.year$.pipe(
    map((year) => GAMES_SCHEDULE.find((g) => new Date(g.date).getFullYear().toString() === year)),
  );

  // Local state for the form
  scores: GameScores = this.createEmptyScores();
  loaded = false;

  scores$ = this.year$.pipe(
    tap(() => (this.loaded = false)),
    switchMap((year) => this.gameService.getGlobalScores(year)),
    tap((scores) => {
      if (scores) {
        this.scores = JSON.parse(JSON.stringify(scores)); // Deep copy
      } else {
        this.scores = this.createEmptyScores();
      }
      this.loaded = true;
    }),
  );

  private createEmptyScores(): GameScores {
    return {
      q1: { home: null, away: null },
      half: { home: null, away: null },
      q3: { home: null, away: null },
      final: { home: null, away: null },
    };
  }

  updateYear(year: string) {
    this.year$.next(year);
  }

  async saveScores() {
    try {
      await this.gameService.saveGlobalScores(this.year$.value, this.scores);
      this.snackBar.open('Scores saved successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error saving scores:', error);
      this.snackBar.open('Error saving scores. Check console.', 'Close', { duration: 3000 });
    }
  }
}
