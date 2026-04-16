import { OrganisationService } from '../../../core/services/organisation.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/I18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-choix-parcours',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './choix-parcours.html',
  styleUrls: ['./choix-parcours.scss'],
})
export class ChoixParcoursUtilisateurComponent {
  firstName = '';
  lastName = '';
  organisationName = '';
  organisationLogoUrl: string | null = null;
  organisationId: number | null = null;

  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParams;
  private readonly organisationService = inject(OrganisationService);
  private readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);

  constructor() {
    this.firstName = this.params['firstName'] || '';
    this.lastName = this.params['lastName'] || '';
    this.organisationName = this.params['organisationName'] || '';
    this.organisationId = this.params['organisationId']
      ? Number(this.params['organisationId'])
      : null;
    if (this.organisationId) {
      this.organisationService.getActiveLogo(this.organisationId).subscribe({
        next: (logo) => {
          this.organisationLogoUrl = this.organisationService.buildLogoDataUrl(logo);
        },
        error: () => {},
      });
    }
  }

  goToQuestionnaire(): void {
    this.router.navigate(this.getQuestionnaireRoute(), { queryParams: this.queryParams() });
  }
  goToCatalogue(): void {
    this.router.navigate(this.getCatalogueRoute(), { queryParams: this.queryParams() });
  }

  private getQuestionnaireRoute(): string[] {
    const role = this.authService.getCurrentUser()?.role ?? null;
    if (role === UserRole.User) return ['/user/questionnaire-guide'];
    if (role === UserRole.Manager) return ['/manager/questionnaire-guide'];
    return ['/questionnaire-guide'];
  }

  private getCatalogueRoute(): string[] {
    const role = this.authService.getCurrentUser()?.role ?? null;
    if (role === UserRole.User) return ['/user/demandes/new'];
    if (role === UserRole.Manager) return ['/manager/demandes/new'];
    if (role === UserRole.Admin) return ['/admin/demandes/new'];
    return ['/catalogue-velos'];
  }

  private queryParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.firstName) p['firstName'] = this.firstName;
    if (this.lastName) p['lastName'] = this.lastName;
    if (this.organisationName) p['organisationName'] = this.organisationName;
    if (this.organisationId) p['organisationId'] = String(this.organisationId);
    return p;
  }
}
