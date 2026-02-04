import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, filter } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { User } from 'firebase/auth';
import { GameService } from '../../services/game';
import { AuthService } from '../../services/auth';
import { GAMES_SCHEDULE } from '../../config/games';

const payoutSumValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const q1 = control.get('q1')?.value || 0;
  const half = control.get('half')?.value || 0;
  const q3 = control.get('q3')?.value || 0;
  const final = control.get('final')?.value || 0;
  return q1 + half + q3 + final === 100 ? null : { sumNot100: true };
};

@Component({
  selector: 'app-game-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatStepperModule,
    MatIconModule,
  ],
  templateUrl: './game-wizard.html',
  styleUrls: ['./game-wizard.scss'],
})
export class GameWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gameService = inject(GameService);
  private authService = inject(AuthService);
  private router = inject(Router);

  payoutOptions = [
    {
      label: '"Standard" Flat Split (25-25-25-25)',
      value: 'standard',
      q1: 25,
      half: 25,
      q3: 25,
      final: 25,
    },
    {
      label: '"Final Score" Bonus (20-20-20-40)',
      value: 'final_bonus',
      q1: 20,
      half: 20,
      q3: 20,
      final: 40,
    },
    {
      label: '"Halftime & Final" Focus (12.5-25-12.5-50)',
      value: 'halftime_final',
      q1: 12.5,
      half: 25,
      q3: 12.5,
      final: 50,
    },
    {
      label: '"Jackpot" Split (10-10-10-70)',
      value: 'jackpot',
      q1: 10,
      half: 10,
      q3: 10,
      final: 70,
    },
    { label: 'Custom', value: 'custom' },
  ];

  gameForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    price: [1, [Validators.required, Validators.min(0)]],
    teams: this.fb.group({
      home: ['', Validators.required],
      homeColor: [''],
      away: ['', Validators.required],
      awayColor: [''],
    }),
    payouts: this.fb.group(
      {
        splitType: ['standard'],
        q1: [25, Validators.required],
        half: [25, Validators.required],
        q3: [25, Validators.required],
        final: [25, Validators.required],
      },
      { validators: [payoutSumValidator] },
    ),
    rules: this.fb.group({
      track_payments: [true],
      unclaimed_rule: ['REQUIRE_FULL', Validators.required],
      max_squares: [null, [Validators.min(1)]],
      venmoUsername: [''],
    }),
  });

  user$ = this.authService.user$;

  get totalPot() {
    return (this.gameForm.get('price')?.value || 0) * 100;
  }

  get payoutSum(): number {
    const payouts = this.gameForm.get('payouts')?.value || {};
    return (payouts.q1 || 0) + (payouts.half || 0) + (payouts.q3 || 0) + (payouts.final || 0);
  }

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    const game = GAMES_SCHEDULE.find((g) => new Date(g.date).getFullYear() === currentYear);

    if (game) {
      this.gameForm.patchValue({
        teams: {
          home: game.homeTeam,
          homeColor: game.homeColor || '#333333',
          away: game.awayTeam,
          awayColor: game.awayColor || '#333333',
        },
      });
    }

    this.authService.user$.subscribe((user) => {
      if (user && game) {
        const firstName = user.displayName?.split(' ')[0] || 'My';
        const suggestedName = `${firstName}'s ${game.name || 'Big Game'} Squares`;

        if (!this.gameForm.get('name')?.value) {
          this.gameForm.patchValue({
            name: suggestedName,
          });
        }
      }
    });
  }

  updatePayouts(type: string) {
    const option = this.payoutOptions.find((o) => o.value === type);
    if (option && type !== 'custom') {
      this.gameForm.get('payouts')?.patchValue({
        q1: option.q1,
        half: option.half,
        q3: option.q3,
        final: option.final,
      });
    }
  }

  onManualPayoutChange() {
    this.gameForm.get('payouts.splitType')?.setValue('custom', { emitEvent: false });
  }

  async createGame() {
    if (this.gameForm.valid) {
      const user = await this.getCurrentUser();
      if (!user) {
        await this.authService.login();
        return;
      }

      const formValue = this.gameForm.value;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { splitType, ...payoutsData } = formValue.payouts;

      const gameData = {
        admin_id: user.uid,
        name: formValue.name,
        status: 'DRAFT',
        config: {
          price: formValue.price,
          payouts: payoutsData,
          rules: formValue.rules,
          teams: formValue.teams,
        },
        scores: {
          q1: { home: null, away: null },
          half: { home: null, away: null },
          q3: { home: null, away: null },
          final: { home: null, away: null },
        },
      };

      try {
        const gameId = await this.gameService.createGame(gameData);
        this.router.navigate(['/game', gameId]);
      } catch (error) {
        console.error('Error creating game:', error);
      }
    }
  }

  private getCurrentUser(): Promise<User | null> {
    return firstValueFrom(
      this.authService.user$.pipe(filter((u): u is User | null => u !== undefined)),
    );
  }
}
