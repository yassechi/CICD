import {
  Organisation,
  OrganisationService,
} from '../../../../../core/services/organisation.service';
import { MessageService } from '../../../../../core/services/message.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { I18nService } from '../../../../../core/services/I18n.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-faire-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
  templateUrl: './pasDeCompte.html',
  styleUrls: ['./pasDeCompte.scss'],
})
export class FaireDemandeComponent {
  loading = signal(false);
  organisations = signal<Organisation[]>([]);
  organisation: Organisation | null = null;
  isAuthenticated = false;
  readonly supportEmail = 'contact@mojovelo.be';

  private readonly authService = inject(AuthService);
  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  constructor() {
    const user = this.authService.getCurrentUser();
    this.isAuthenticated = !!user;

    this.loading.set(true);
    this.organisationService.getAll().subscribe({
      next: (orgs) => {
        const items = orgs ?? [];
        this.organisations.set(items);
        this.loadLogos(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.showError(this.i18n.get('publicDemande.loadError'));
      },
    });
  }

  onPrimaryAction(): void {
    this.goToCreateLamdaUser();
  }

  goToCreateLamdaUser(): void {
    const qp: Record<string, string> = {};
    if (this.organisation) {
      qp['organisationId'] = String(this.organisation.id);
      qp['organisationName'] = this.organisation.name;
    }
    this.router.navigate(['/create-lamda-user'], { queryParams: qp });
  }

  private loadLogos(organisations: Organisation[]): void {
    organisations.forEach((org) => {
      this.organisationService.getActiveLogo(org.id).subscribe({
        next: (logo) => {
          const url = this.organisationService.buildLogoDataUrl(logo);
          const current = this.organisations();
          const target = current.find((item) => item.id === org.id);
          if (!target) return;
          target.logoUrl = url ?? undefined;
          this.organisations.set([...current]);
        },
        error: () => {},
      });
    });
  }

  get organisationOptions(): Organisation[] {
    return this.organisations()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get supportMailto(): string {
    const subject = encodeURIComponent(this.i18n.get('publicDemande.supportSubject'));
    const body = encodeURIComponent(this.i18n.get('publicDemande.supportBody'));
    return `mailto:${this.supportEmail}?subject=${subject}&body=${body}`;
  }
}
