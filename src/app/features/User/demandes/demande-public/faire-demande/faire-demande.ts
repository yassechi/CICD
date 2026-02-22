import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

// Services
import { AuthService } from '../../../../../core/services/auth.service';
import { Organisation, OrganisationService } from '../../../../../core/services/organisation.service';
import { ErrorService } from '../../../../../core/services/error.service';

@Component({
  selector: 'app-faire-demande',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
  templateUrl: './faire-demande.html',
  styleUrls: ['./faire-demande.scss'],
})
export class FaireDemandeComponent {

  // --- DONNÉES ---
  loading         = signal(false);
  organisations   = signal<Organisation[]>([]);
  organisation:   Organisation | null = null;
  isAuthenticated = false;
  currentUserEmail = '';
  readonly supportEmail = 'contact@mojovelo.be';

  // --- SERVICES ---
  private readonly authService         = inject(AuthService);
  private readonly organisationService = inject(OrganisationService);
  private readonly errorService        = inject(ErrorService);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() {
    const user           = this.authService.getCurrentUser();
    this.isAuthenticated = !!user;
    this.currentUserEmail = user?.email ?? '';
    this.loadOrganisations();
  }

  // --- CHARGEMENT ---
  private loadOrganisations(): void {
    this.loading.set(true);
    this.organisationService.getAll().subscribe({
      next: (orgs) => {
        this.organisations.set(orgs);
        if (this.isAuthenticated && this.currentUserEmail) {
          this.organisationService.resolveByEmailOrDomain(this.currentUserEmail).subscribe({
            next:  (resolved) => {
              if (resolved) this.organisation = orgs.find((o) => o.id === resolved.id) ?? resolved;
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorService.showError('Impossible de détecter la compagnie');
      },
    });
  }

  // --- ACTIONS ---
  onPrimaryAction():   void { this.goToCreateLamdaUser(); }
  goToMesDemandes():   void { this.router.navigate(['/user/demandes']); }

  goToCreateLamdaUser(): void {
    const qp: Record<string, string> = {};
    if (this.organisation) {
      qp['organisationId']   = String(this.organisation.id);
      qp['organisationName'] = this.organisation.name;
      if (this.organisation.logoUrl) qp['organisationLogoUrl'] = this.organisation.logoUrl;
    }
    this.router.navigate(['/create-lamda-user'], { queryParams: qp });
  }

  // --- UTILITAIRES ---
  get organisationOptions(): Organisation[] {
    return this.organisations().slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  get supportMailto(): string {
    const subject = encodeURIComponent('Demande ajout de ma société');
    const body    = encodeURIComponent('Bonjour,\n\nMa société n\'apparait pas dans la liste. Pouvez-vous l\'ajouter ?\n\nMerci.');
    return `mailto:${this.supportEmail}?subject=${subject}&body=${body}`;
  }
}
