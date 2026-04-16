import { DemandeConfirmationComponent } from './features/User/demandes/demande-public/demande-confirmation/demande-confirmation';
import { CreateLamdaUserComponent } from './features/User/demandes/demande-public/create-public-user/create-public-user';
import { QuestionnaireGuideComponent } from './features/User/questionnaire-guide/questionnaire-guide';
import { CompagnieDetailComponent } from './features/Admin/compagnies/compagnie-detail/compagnie-detail';
import { FaireDemandeComponent } from './features/User/demandes/demande-public/pasDeCompte/pasDeCompte';
import { AdminCompagniesComponent } from './features/Admin/compagnies/compagnies-list/compagnies-list';
import { ContratAmortissementComponent } from './shared/contrat-amortissement/contrat-amortissement';
import { DemandesUtilisateurComponent } from './features/User/demandes/demandes-list/demandes-list';
import { ContratsUtilisateurComponent } from './features/User/contrats/contrats-list/contrats-list';
import { CompagnieFormComponent } from './features/Admin/compagnies/compagnie-form/compagnie-form';
import { ManagerEmployesComponent } from './features/Manager/employes/employes-list/employes-list';
import { ManagerDemandesComponent } from './features/Manager/demandes/demandes-list/demandes-list';
import { ManagerContratsComponent } from './features/Manager/contrats/contrats-list/contrats-list';
import { ChoixParcoursUtilisateurComponent } from './features/User/choix-parcours/choix-parcours';
import { EmployeFormDialogComponent } from './features/Admin/employes/employe-form/employe-form';
import { EmployeDetailComponent } from './features/Admin/employes/employe-detail/employe-detail';
import { DemandeFormDialogComponent } from './features/Admin/demandes/demande-form/demande-form';
import { DemandeDetailComponent } from './features/Admin/demandes/demande-detail/demande-detail';
import { AdminContratsComponent } from './features/Admin/contrats/contrats-list/contrats-list';
import { ContratCreateComponent } from './features/Admin/contrats/contrat-create/contrat-create';
import { AdminEmployesComponent } from './features/Admin/employes/employes-list/employes-list';
import { AdminDemandesComponent } from './features/Admin/demandes/demandes-list/demandes-list';
import { ContratEditComponent } from './features/Admin/contrats/contrat-edit/contrat-edit';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { DemandeCatalogueComponent } from './shared/demande-catalogue/demande-catalogue';
import { ContratDocumentsComponent } from './shared/contrat-documents/contrat-documents';
import { ContratEntretienComponent } from './shared/contrat-entretien/contrat-entretien';
import { TableauDeBordUtilisateurComponent } from './features/User/dashboard/dashboard';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';
import { ManagerDashboardComponent } from './features/Manager/dashboard/dashboard';
import { ContratDetailComponent } from './shared/contrat-detail/contrat-detail';
import { ContratDetailInfoComponent } from './shared/contrat-info/contrat-info';
import { AdminDashboardComponent } from './features/Admin/dashboard/dashboard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { ParametresComponent } from './shared/parametres/parametres';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: CreateLamdaUserComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'faire-demande', component: FaireDemandeComponent },
  { path: 'demande-formulaire', component: DemandeCatalogueComponent },
  { path: 'choix-parcours', component: ChoixParcoursUtilisateurComponent },
  { path: 'questionnaire-guide', component: QuestionnaireGuideComponent },
  { path: 'create-lamda-user', component: CreateLamdaUserComponent },
  { path: 'catalogue-velos', component: DemandeCatalogueComponent },
  { path: 'demande-confirmation', component: DemandeConfirmationComponent },

  // Admin
  {
    path: 'admin',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 1 },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'compagnies', component: AdminCompagniesComponent },
      { path: 'compagnies/new', component: CompagnieFormComponent },
      { path: 'compagnies/:id/edit', component: CompagnieFormComponent },
      { path: 'compagnies/:id', component: CompagnieDetailComponent },
      { path: 'employes', component: AdminEmployesComponent },
      { path: 'employes/new', component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit', component: EmployeFormDialogComponent },
      { path: 'employes/:id', component: EmployeDetailComponent },
      { path: 'demandes', component: AdminDemandesComponent },
      { path: 'demandes/new', component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit', component: DemandeFormDialogComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'contrats', component: AdminContratsComponent },
      { path: 'contrats/detail', component: ContratCreateComponent },
      { path: 'contrats/new', component: ContratCreateComponent },
      { path: 'contrats/edit/:id', component: ContratEditComponent },
      {
        path: 'contrats/:id',
        component: ContratDetailComponent,
        children: [
          { path: '', redirectTo: 'detail', pathMatch: 'full' },
          { path: 'detail', component: ContratDetailInfoComponent },
          { path: 'documents', component: ContratDocumentsComponent },
          { path: 'entretien', component: ContratEntretienComponent },
          { path: 'amortissement', component: ContratAmortissementComponent },
        ],
      },
      { path: 'parametres', component: ParametresComponent },
    ],
  },

  // Manager
  {
    path: 'manager',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 2 },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ManagerDashboardComponent },
      { path: 'employes', component: ManagerEmployesComponent },
      { path: 'employes/new', component: EmployeFormDialogComponent },
      { path: 'employes/:id/edit', component: EmployeFormDialogComponent },
      { path: 'employes/:id', component: EmployeDetailComponent },
      { path: 'demandes', component: ManagerDemandesComponent },
      { path: 'demandes/new', component: DemandeFormDialogComponent },
      { path: 'demandes/:id/edit', component: DemandeFormDialogComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'contrats', component: ManagerContratsComponent },
      { path: 'questionnaire-guide', component: QuestionnaireGuideComponent },
      {
        path: 'contrats/:id',
        component: ContratDetailComponent,
        children: [
          { path: '', redirectTo: 'detail', pathMatch: 'full' },
          { path: 'detail', component: ContratDetailInfoComponent },
          { path: 'documents', component: ContratDocumentsComponent },
          { path: 'entretien', component: ContratEntretienComponent },
        ],
      },
      { path: 'parametres', component: ParametresComponent },
    ],
  },

  // User
  {
    path: 'user',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { role: 3 },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TableauDeBordUtilisateurComponent },
      { path: 'contrats', component: ContratsUtilisateurComponent },
      { path: 'demandes', component: DemandesUtilisateurComponent },
      { path: 'demandes/new', component: DemandeCatalogueComponent },
      { path: 'demandes/:id/edit', component: DemandeCatalogueComponent },
      { path: 'demandes/:id', component: DemandeDetailComponent },
      { path: 'questionnaire-guide', component: QuestionnaireGuideComponent },
      { path: 'parametres', component: ParametresComponent },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
