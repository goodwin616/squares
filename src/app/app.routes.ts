import { Routes } from '@angular/router';
import { GameWizardComponent } from './components/game-wizard/game-wizard';
import { GameDetailComponent } from './components/game-detail/game-detail';
import { DashboardComponent } from './components/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'create', component: GameWizardComponent },
  { path: 'game/:id', component: GameDetailComponent },
];
