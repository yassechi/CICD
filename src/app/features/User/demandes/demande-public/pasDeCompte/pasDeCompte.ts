import { Organisation, OrganisationService } from '../../../../../core/services/organisation.service';
import { MessageService } from '../../../../../core/services/message.service';
import { AuthService } from '../../../../../core/services/auth.service';
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

  constructor() {
    const user = this.authService.getCurrentUser();
    this.isAuthenticated = !!user;

    this.loading.set(true);
    this.organisationService.getAll().subscribe({
      next: (orgs) => {
        this.organisations.set(orgs ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.showError('Impossible de detecter la compagnie');
      },
    });
  }

  onPrimaryAction(): void { this.goToCreateLamdaUser(); }

  goToCreateLamdaUser(): void {
    const qp: Record<string, string> = {};
    if (this.organisation) {
      qp['organisationId'] = String(this.organisation.id);
      qp['organisationName'] = this.organisation.name;
      if (this.organisation.logoUrl) qp['organisationLogoUrl'] = this.organisation.logoUrl;
    }
    this.router.navigate(['/create-lamda-user'], { queryParams: qp });
  }

  get organisationOptions(): Organisation[] {
    return this.organisations().slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  get supportMailto(): string {
    const subject = encodeURIComponent('Demande ajout de ma societe');
    const body = encodeURIComponent("Bonjour,\n\nMa societe n'apparait pas dans la liste. Pouvez-vous l'ajouter ?\n\nMerci.");
    return `mailto:${this.supportEmail}?subject=${subject}&body=${body}`;
  }
}
