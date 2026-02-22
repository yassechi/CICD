import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

// Admin
import { AdminDashboardComponent } from './features/Admin/dashboard/dashboard';
import { AdminCompagniesComponent } from './features/Admin/compagnies/compagnies-list/compagnies-list';
import { AdminEmployesComponent } from './features/Admin/employes/employes-list/employes-list';
import { AdminDemandesComponent } from './features/Admin/demandes/demandes-list/demandes-list';
import { DemandeFormDialogComponent } from './features/Admin/demandes/demande-form/demande-form';
import { DemandeDetailComponent } from './features/Admin/demandes/demande-detail/demande-detail';
import { AdminContratsComponent } from './features/Admin/contrats/contrats-list/contrats-list';
import { AdminParametresComponent } from './features/Admin/parametres/parametres';
import { ContratDetailComponent } from './features/Admin/contrats/contrat-detail/contrat-page/contrat-page';
import { ContratDetailInfoComponent } from './features/Admin/contrats/contrat-detail/contrat-info/contrat-info';
import { ContratDocumentsComponent } from './features/Admin/contrats/contrat-detail/contrat-documents/contrat-documents';
import { ContratEntretienComponent } from './features/Admin/contrats/contrat-detail/contrat-entretien/contrat-entretien';
import { ContratAmortissementComponent } from './features/Admin/contrats/contrat-detail/contrat-amortissement/contrat-amortissement';
import { ContratEditComponent } from './features/Admin/contrats/contrat-edit/contrat-edit';
import { CompagnieFormComponent } from './features/Admin/compagnies/compagnie-form/compagnie-form';
import { CompagnieDetailComponent } from './features/Admin/compagnies/compagnie-detail/compagnie-detail';
import { EmployeFormDialogComponent } from './features/Admin/employes/employe-form/employe-form';
import { EmployeDetailComponent } from './features/Admin/employes/employe-detail/employe-detail';

// Manager
import { ManagerDashboardComponent } from './features/Manager/dashboard/dashboard';
import { ManagerDemandesComponent } from './features/Manager/demandes/demandes-list/demandes-list';
import { ManagerContratsComponent } from './features/Manager/contrats/contrats-list/contrats-list';
import { ManagerEmployesComponent } from './features/Manager/employes/employes-list/employes-list';
import { ManagerParametresComponent } from './features/Manager/parametres/parametres';

// User
import { TableauDeBordUtilisateurComponent } from './features/User/dashboard/dashboard';
import { ContratsUtilisateurComponent } from './features/User/contrats/contrats-list/contrats-list';
import { DemandesUtilisateurComponent } from './features/User/demandes/demandes-list/demandes-list';
import { ParametresUtilisateurComponent } from './features/User/parametres/parametres';
import { FaireDemandeComponent } from './features/User/demandes/demande-public/faire-demande/faire-demande';
import { ChoixParcoursUtilisateurComponent } from './features/User/choix-parcours/choix-parcours';
import { CatalogueVelosUtilisateurComponent } from './features/User/catalogue-velos/catalogue-velos';
import { CreateLamdaUserComponent } from './features/User/questionnaire-guide/create-lamda-user';
import { DemandeCatalogueComponent } from './features/User/demandes/demande-formulaire/demande-catalogue';
import { DemandeConfirmationComponent } from './features/User/demandes/demande-public/demande-confirmation/demande-confirmation';

export const routes: Routes = [
  { path: 'login',               component: LoginComponent },
  { path: 'register',            component: CreateLamdaUserComponent },
  { path: 'reset-password',      component: ResetPasswordComponent },
  { path: 'forgot-password',     component: ForgotPasswordComponent },
  { path: 'faire-demande',       component: FaireDemandeComponent },
  { path: 'demande-formulaire',  component: DemandeCatalogueComponent },
  { path: 'choix-parcours',      component: ChoixParcoursUtilisateurComponent },
  { path: 'questionnaire-guide', component: CreateLamdaUserComponent },
  { path: 'create-lamda-user',   component: CreateLamdaUserComponent },
  { path: 'catalogue-velos',     component: CatalogueVelosUtilisateurComponent },
  { path: 'demande-confirmation', component: DemandeConfirmationComponent },

  // Admin
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 1 },
    children: [
      { path: '',                   redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',          component: AdminDashboardComponent },
      { path: 'compagnies',         component: AdminCompagniesComponent },
      { path: 'compagnies/new',     component: CompagnieFormComponent },
      { path: 'compagnies/:id/edit', component: CompagnieFormComponent },
      { path: 'compagnies/:id',     component: CompagnieDetailComponent },
      { path: 'employes',           component: AdminEmployesComponent },
      { path: 'employes/new',       component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit',  component: EmployeFormDialogComponent },
      { path: 'employes/:id',       component: EmployeDetailComponent },
      { path: 'demandes',           component: AdminDemandesComponent },
      { path: 'demandes/new',       component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit',  component: DemandeFormDialogComponent },
      { path: 'demandes/:id',       component: DemandeDetailComponent },
      { path: 'contrats',           component: AdminContratsComponent },
      { path: 'contrats/new',       component: ContratEditComponent },
      { path: 'contrats/edit/:id',  component: ContratEditComponent },
      {
        path: 'contrats/:id',
        component: ContratDetailComponent,
        children: [
          { path: '',              redirectTo: 'detail', pathMatch: 'full' },
          { path: 'detail',        component: ContratDetailInfoComponent },
          { path: 'documents',     component: ContratDocumentsComponent },
          { path: 'entretien',     component: ContratEntretienComponent },
          { path: 'amortissement', component: ContratAmortissementComponent },
        ],
      },
      { path: 'parametres', component: AdminParametresComponent },
    ],
  },

  // Manager
  {
    path: 'manager',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 2 },
    children: [
      { path: '',                   redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',          component: ManagerDashboardComponent },
      { path: 'employes',           component: ManagerEmployesComponent },
      { path: 'employes/new',       component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit',  component: EmployeFormDialogComponent },
      { path: 'employes/:id',       component: EmployeDetailComponent },
      { path: 'demandes',           component: ManagerDemandesComponent },
      { path: 'demandes/new',       component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit',  component: DemandeFormDialogComponent },
      { path: 'demandes/:id',       component: DemandeDetailComponent },
      { path: 'contrats',           component: ManagerContratsComponent },
      { path: 'parametres',         component: ManagerParametresComponent },
    ],
  },

  // User
  {
    path: 'user',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 3 },
    children: [
      { path: '',                  redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',         component: TableauDeBordUtilisateurComponent },
      { path: 'contrats',          component: ContratsUtilisateurComponent },
      { path: 'demandes',          component: DemandesUtilisateurComponent },
      { path: 'demandes/new',      component: DemandeCatalogueComponent },
      { path: 'demandes/:id/edit', component: DemandeCatalogueComponent },
      { path: 'demandes/:id',      component: DemandeDetailComponent },
      { path: 'parametres',        component: ParametresUtilisateurComponent },
    ],
  },

  { path: '',   redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
