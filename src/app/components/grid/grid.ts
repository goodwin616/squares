import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, Game, Square, UserProfile } from '../../services/game';
import { AuthService } from '../../services/auth';
import { GridNamePipe } from '../../pipes/grid-name';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, BehaviorSubject, switchMap, map, of, shareReplay, combineLatest } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    GridNamePipe,
  ],
  templateUrl: './grid.html',
  styleUrls: ['./grid.scss'],
})
export class GridComponent implements OnChanges {
  @Input() game: Game | null = null;
  @Input() squares: Square[] = [];

  private gameService = inject(GameService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog); // For payment dialog later
  private snackBar = inject(MatSnackBar);

  private squares$ = new BehaviorSubject<Square[]>([]);

  squaresMap = new Map<number, Square>();
  uniqueNames: string[] = [];
  currentUser: User | null | undefined = null;
  rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  cols = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  isSorted = false;

  usersMap$: Observable<Map<string, UserProfile>> = combineLatest([
    this.squares$,
    this.authService.user$,
  ]).pipe(
    map(([squares]) => [...new Set(squares.map((s) => s.owner_id).filter((id) => !!id))]),
    switchMap((uids) => {
      if (uids.length === 0) return of(new Map<string, UserProfile>());
      return this.gameService.getUsers(uids).pipe(
        map((users) => {
          const map = new Map<string, UserProfile>();
          users.forEach((u) => map.set(u.uid, u));
          return map;
        }),
      );
    }),
    shareReplay(1),
  );

  constructor() {
    this.authService.user$.subscribe((u) => (this.currentUser = u));

    // Update uniqueNames when usersMap$ changes
    this.usersMap$.subscribe((map) => {
      this.uniqueNames = Array.from(map.values())
        .map((u) => u.displayName)
        .filter((n) => !!n);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['squares'] && this.squares) {
      this.squaresMap.clear();
      this.squares.forEach((s) => this.squaresMap.set(parseInt(s.id), s));
      this.squares$.next(this.squares);
    }
  }

  get displayRows(): number[] {
    if (!this.isSorted || !this.game?.grid_numbers?.row) return this.rows;
    const rowNums = this.game.grid_numbers.row;
    // Return indices sorted by their assigned number value (0-9)
    return [...this.rows].sort((a, b) => (rowNums[a] ?? 0) - (rowNums[b] ?? 0));
  }

  get displayCols(): number[] {
    if (!this.isSorted || !this.game?.grid_numbers?.col) return this.cols;
    const colNums = this.game.grid_numbers.col;
    // Return indices sorted by their assigned number value (0-9)
    return [...this.cols].sort((a, b) => (colNums[a] ?? 0) - (colNums[b] ?? 0));
  }

  toggleSort() {
    this.isSorted = !this.isSorted;
  }

  getHeaderNumber(index: number, type: 'row' | 'col'): string | number {
    if (this.game?.status === 'DRAFT' || !this.game?.grid_numbers) return '?';

    if (type === 'col') {
      return this.game.grid_numbers.col[index] ?? '?';
    } else {
      return this.game.grid_numbers.row[index] ?? '?';
    }
  }

  getSquare(r: number, c: number) {
    const id = r * 10 + c;
    return this.squaresMap.get(id);
  }

  getOwnerName(sq: Square | undefined, usersMap: Map<string, UserProfile>): string {
    if (!sq) return '';
    return usersMap.get(sq.owner_id)?.displayName || sq.owner_name || '...';
  }

  getPeriodColor(period: string): string {
    const colors: Record<string, string> = {
      q1: '#2196f3',
      half: '#4caf50',
      q3: '#ff9800',
      final: '#e91e63',
    };
    return colors[period] || '#000';
  }

  getPrizes(r: number, c: number): string[] {
    if (!this.game?.scores || !this.game.grid_numbers || this.game.status === 'DRAFT') return [];

    const rowNum = this.game.grid_numbers.row[r];
    const colNum = this.game.grid_numbers.col[c];
    const wonPeriods: string[] = [];

    ['q1', 'half', 'q3', 'final'].forEach((p) => {
      const score = this.game!.scores![p];
      if (
        score &&
        score.home !== null &&
        score.away !== null &&
        score.home % 10 === colNum &&
        score.away % 10 === rowNum
      ) {
        wonPeriods.push(p);
      }
    });

    return wonPeriods;
  }

  isWinner(r: number, c: number): boolean {
    return this.getPrizes(r, c).length > 0;
  }

  async onSquareClick(r: number, c: number) {
    const id = r * 10 + c;
    const sq = this.getSquare(r, c);

    // Game Locked check
    if (this.game?.status !== 'DRAFT') return;

    if (!sq) {
      // Claim
      if (!this.currentUser) {
        await this.authService.login();
        return;
      }

      if (!this.game) return;

      // Max Squares Check
      const maxSquares = this.game.config?.rules?.max_squares;
      const currentUser = this.currentUser;
      if (maxSquares && maxSquares > 0 && currentUser) {
        const mySquareCount = this.squares.filter((s) => s.owner_id === currentUser.uid).length;
        if (mySquareCount >= maxSquares) {
          this.snackBar.open(
            `You have reached the maximum limit of ${maxSquares} squares per player.`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            },
          );
          return;
        }
      }

      await this.gameService.claimSquare(this.game.id, id, this.currentUser);
    } else if (sq.owner_id === this.currentUser?.uid) {
      // Release check: prevent if marked as paid
      if (sq.is_paid) {
        this.snackBar.open(
          'This square has been marked as paid for and cannot be unset.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
        );
        return;
      }
      await this.gameService.releaseSquare(this.game!.id, id);
    }
  }
}
