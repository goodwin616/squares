import { Routes } from '@angular/router';
import { GameWizardComponent } from './components/game-wizard/game-wizard';
import { GameDetailComponent } from './components/game-detail/game-detail';
import { DashboardComponent } from './components/dashboard/dashboard';
import { SuperAdminComponent } from './components/admin/super-admin/super-admin';
import { superAdminGuard } from './guards/super-admin';
import { FAQComponent } from './components/faq/faq';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'create', component: GameWizardComponent },
  { path: 'game/:id', component: GameDetailComponent },
  { path: 'admin/super', component: SuperAdminComponent, canActivate: [superAdminGuard] },
  { path: 'faq', component: FAQComponent },
];
