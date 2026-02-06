import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  switchMap,
  map,
  combineLatest,
  of,
  tap,
  firstValueFrom,
  Observable,
  startWith,
} from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import {
  GameService,
  Game,
  Square,
  UserProfile,
  GameScores,
  GameConfigData,
} from '../../services/game';
import { AuthService } from '../../services/auth';
import { GridComponent } from '../grid/grid';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

interface PlayerStats {
  uid: string;
  name: string;
  squaresCount: number;
  owed: number;
  allPaid: boolean;
}

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    GridComponent,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './game-detail.html',
  styleUrls: ['./game-detail.scss'],
})
export class GameDetailComponent {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  startingGame = false;

  gameId$ = this.route.paramMap.pipe(map((params) => params.get('id')!));

  // Score Inputs (Model)
  scoreInputs: GameScores = {
    q1: { home: null, away: null },
    half: { home: null, away: null },
    q3: { home: null, away: null },
    final: { home: null, away: null },
  };
  private scoresManuallyEdited = false;

  game$ = this.gameId$.pipe(
    switchMap((id) => this.gameService.getGame(id) as Observable<Game | null>),
    tap((game) => {
      if (game && game.scores && !this.scoresManuallyEdited) {
        this.scoreInputs = JSON.parse(JSON.stringify(game.scores));
      }
    }),
    startWith(undefined),
  );

  squares$ = this.gameId$.pipe(
    switchMap((id) => this.gameService.getSquares(id) as Observable<Square[]>),
  );

  filledSquaresCount$ = this.squares$.pipe(map((squares) => squares.length));

  user$ = this.authService.user$;

  usersMap$ = this.squares$.pipe(
    map((squares) => [...new Set(squares.map((s) => s.owner_id).filter((id) => !!id))]),
    switchMap((uids) => {
      if (uids.length === 0) return of(new Map<string, UserProfile>());
      return (this.gameService.getUsers(uids) as Observable<UserProfile[]>).pipe(
        map((users) => {
          const map = new Map<string, UserProfile>();
          users.forEach((u) => map.set(u.uid, u));
          return map;
        }),
      );
    }),
  );

  // Dashboard Stats
  myStats$ = combineLatest([this.squares$, this.user$, this.game$]).pipe(
    map(([squares, user, game]) => {
      if (!user || !game) return { count: 0, owed: 0, unpaidAmount: 0 };
      const mySquares = squares.filter((s) => s.owner_id === user.uid);
      const price = game.config?.price || 0;
      const unpaidSquares = mySquares.filter((s) => !s.is_paid);

      return {
        count: mySquares.length,
        owed: mySquares.length * price,
        unpaidAmount: unpaidSquares.length * price,
      };
    }),
  );

  isAdmin$ = combineLatest([this.game$, this.user$]).pipe(
    map(([game, user]) => game && user && game.admin_id === user.uid),
  );

  players$ = combineLatest([this.squares$, this.game$, this.usersMap$]).pipe(
    map(([squares, game, usersMap]) => {
      if (!squares || !game) return [];

      const playersMap = new Map<string, PlayerStats>();

      squares.forEach((s) => {
        if (!playersMap.has(s.owner_id) && s.owner_id) {
          const userProfile = usersMap.get(s.owner_id);
          playersMap.set(s.owner_id, {
            uid: s.owner_id,
            name: userProfile?.displayName || s.owner_name || 'Unknown',
            squaresCount: 0,
            owed: 0,
            allPaid: true,
          });
        }

        const player = playersMap.get(s.owner_id!);
        if (player) {
          const isOwner = s.owner_id === game.admin_id;
          player.squaresCount++;
          player.owed += game.config?.price || 0;
          if (!isOwner && !s.is_paid) {
            player.allPaid = false;
          }
        }
      });

      return Array.from(playersMap.values());
    }),
  );

  hasUnpaidPlayers$ = this.players$.pipe(map((players) => players.some((p) => !p.allPaid)));

  showAdminControls$ = combineLatest([this.isAdmin$, this.game$, this.hasUnpaidPlayers$]).pipe(
    map(([isAdmin, game, hasUnpaid]) => {
      if (!isAdmin || !game) return false;
      // Show if in draft
      if (game.status === 'DRAFT') return true;
      // Show if anyone hasn't paid
      if (hasUnpaid) return true;
      // Show if it's a manual game (needs score entry)
      return !game.big_game_id;
    }),
  );

  winners$ = combineLatest([this.game$, this.squares$, this.usersMap$]).pipe(
    map(([game, squares, usersMap]) => {
      if (!game) return [];

      const colors: Record<string, string> = {
        q1: '#2196f3',
        half: '#4caf50',
        q3: '#ff9800',
        final: '#e91e63',
      };

      const periods = ['q1', 'half', 'q3', 'final'];

      if (game.status === 'DRAFT' || !game.grid_numbers || !game.scores) {
        return periods.map((p) => {
          const payoutPct = game.config?.payouts?.[p] || 0;
          const totalPot = (game.config?.price || 0) * 100;
          const basePayout = (totalPot * payoutPct) / 100;
          return {
            period: p,
            label: p === 'half' ? 'Halftime' : p.toUpperCase(),
            score: null,
            payoutAmount: basePayout,
            basePayout,
            winner: null,
            isReallocated: false,
            isSplitToPrevious: false,
            color: colors[p],
          };
        });
      }

      let currentCarryOver = 0;
      let carryOverAppliedToPending = false;

      const winners = periods.map((p) => {
        const score = game.scores![p];
        const payoutPct = game.config?.payouts?.[p] || 0;
        const totalPot = (game.config?.price || 0) * 100;
        const basePayout = (totalPot * payoutPct) / 100;

        let payoutAmount = basePayout;
        let winner = null;
        let isReallocated = false;

        const isSettled = score && score.home !== null && score.away !== null;

        if (isSettled) {
          payoutAmount += currentCarryOver;
          const colNum = score!.home! % 10;
          const rowNum = score!.away! % 10;

          const rIndex = game.grid_numbers!.row.indexOf(rowNum);
          const cIndex = game.grid_numbers!.col.indexOf(colNum);

          const squareId = rIndex * 10 + cIndex;
          const winningSquare = squares.find((s) => parseInt(s.id) === squareId);

          if (winningSquare) {
            const userProfile = usersMap.get(winningSquare.owner_id);
            winner = {
              name: userProfile?.displayName || winningSquare.owner_name || 'Unknown',
              uid: winningSquare.owner_id,
            };
            currentCarryOver = 0;
          } else {
            // House wins
            if (game.config?.rules?.unclaimed_rule === 'RETURN_TO_POOL' && p !== 'final') {
              isReallocated = true;
              currentCarryOver = payoutAmount;
              payoutAmount = 0;
            } else {
              currentCarryOver = 0;
            }
          }
        } else {
          // Pending period: only apply carry-over to the VERY NEXT period
          if (!carryOverAppliedToPending) {
            payoutAmount += currentCarryOver;
            carryOverAppliedToPending = true;
          }
        }

        return {
          period: p,
          label: p === 'half' ? 'Halftime' : p.toUpperCase(),
          score: isSettled ? score : null,
          payoutAmount,
          basePayout,
          winner,
          isReallocated,
          isSplitToPrevious: false,
          color: colors[p],
        };
      });

      // Special Case: Final period is house, split among previous human winners
      const finalW = winners[3];
      if (finalW?.score && !finalW.winner) {
        const humanWinnerPeriods = winners.slice(0, 3).filter((w) => !!w.winner);
        const totalWeights = humanWinnerPeriods.reduce((sum, w) => sum + w.basePayout, 0);

        if (totalWeights > 0) {
          const amountToSplit = finalW.payoutAmount;
          humanWinnerPeriods.forEach((w) => {
            w.payoutAmount += (w.basePayout / totalWeights) * amountToSplit;
          });
          finalW.payoutAmount = 0;
          finalW.isSplitToPrevious = true;
        }
      }

      return winners;
    }),
  );

  totalWon$ = combineLatest([this.winners$, this.user$]).pipe(
    map(([winners, user]) => {
      if (!user || !winners.length) return 0;
      return winners
        .filter((w) => w.winner?.uid === user.uid)
        .reduce((sum, w) => sum + w.payoutAmount, 0);
    }),
  );

  onScoreEdit() {
    this.scoresManuallyEdited = true;
  }

  async startGame(gameId: string) {
    const squares = await firstValueFrom(this.squares$);
    const game = await firstValueFrom(this.game$);

    if (game && squares.length < 100) {
      if (game.config?.rules?.unclaimed_rule === 'REQUIRE_FULL') {
        this.snackBar.open('Cannot start: Grid must be full per game rules.', 'Close', {
          duration: 5000,
        });
        return;
      }

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Start Game with Unfilled Squares?',
          message:
            'There are still unfilled squares. Starting the game now will lock the grid and assign numbers. Unfilled squares cannot be assigned after the game starts. This action is irreversible.',
          confirmText: 'Start Game',
          confirmColor: 'warn',
        },
      });

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result) return;
    }

    try {
      this.startingGame = true;
      await this.gameService.startGame(gameId);
      this.snackBar.open('Game Started!', 'Close', { duration: 3000 });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      this.snackBar.open('Error: ' + message, 'Close', { duration: 5000 });
    } finally {
      this.startingGame = false;
    }
  }

  async saveScores(game: Game) {
    await this.gameService.updateScores(game.id, this.scoreInputs);
    this.scoresManuallyEdited = false; // Reset to allow sync from server
    this.snackBar.open('Scores Updated', 'Close', { duration: 2000 });
  }

  async togglePlayerPaid(gameId: string, player: PlayerStats, isPaid: boolean) {
    try {
      await this.gameService.togglePlayerPaidStatus(gameId, player.uid, isPaid);
      this.snackBar.open(`Updated payment status for ${player.name}`, 'Close', { duration: 2000 });
    } catch (e: unknown) {
      console.error(e);
      this.snackBar.open('Error updating payment', 'Close', { duration: 3000 });
    }
  }

  async updateUnclaimedRule(game: Game, rule: string) {
    try {
      // Create a shallow copy of config and update rules
      const newConfig = { ...game.config } as GameConfigData;
      newConfig.rules = { ...newConfig.rules, unclaimed_rule: rule };

      await this.gameService.updateGameConfig(game.id, newConfig);
      this.snackBar.open('Rule Updated', 'Close', { duration: 2000 });
    } catch (e: unknown) {
      console.error(e);
      this.snackBar.open('Error updating rule', 'Close', { duration: 3000 });
    }
  }

  async updateMaxSquares(game: Game, max: string) {
    try {
      const val = parseInt(max);
      const newConfig = { ...game.config } as GameConfigData;
      newConfig.rules = {
        ...newConfig.rules,
        max_squares: isNaN(val) || val < 1 ? null : val,
      };

      await this.gameService.updateGameConfig(game.id, newConfig);
      this.snackBar.open('Limit Updated', 'Close', { duration: 2000 });
    } catch (e: unknown) {
      console.error(e);
      this.snackBar.open('Error updating limit', 'Close', { duration: 3000 });
    }
  }

  get isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  getVenmoLink(username: string, amount: number, payerName: string): string {
    const note = `🏈 Squares - ${payerName}`;
    const txn = 'pay';

    if (this.isMobile) {
      return `venmo://paycharge?txn=${txn}&recipients=${username}&amount=${amount}&note=${encodeURIComponent(note)}`;
    }
    return `https://account.venmo.com/payment-link?amount=${amount}&note=${encodeURIComponent(note)}&recipients=${username}&txn=${txn}`;
  }

  copyLink() {
    navigator.clipboard.writeText(window.location.href);
    this.snackBar.open('Link Copied!', 'Close', { duration: 2000 });
  }
}
