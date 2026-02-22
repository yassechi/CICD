import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { VeloCatalogService, VeloItem } from '../../../core/services/velo-catalog.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreateDemandeWithVeloPayload, DemandeService } from '../../../core/services/demande.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-user-catalogue-velos',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './catalogue-velos.html',
  styleUrls: ['./catalogue-velos.scss'],
})
export class CatalogueVelosUtilisateurComponent {

  loading         = signal(false);
  creatingDemande = signal(false);
  velos           = signal<VeloItem[]>([]);
  selectedVeloId  = signal<number | null>(null);

  private readonly router             = inject(Router);
  private readonly veloCatalogService = inject(VeloCatalogService);
  private readonly authService        = inject(AuthService);
  private readonly demandeService     = inject(DemandeService);
  private readonly errorService       = inject(ErrorService);

  constructor() {
    this.loadVelos();
  }

  private loadVelos(): void {
    this.loading.set(true);
    this.veloCatalogService.getBrands().subscribe({
      next:  () => {},
      error: () => {},
    });
    this.veloCatalogService.getVelos().subscribe({
      next: (velos) => {
        this.velos.set(velos);
        this.loading.set(false);
      },
      error: () => {
        this.velos.set([]);
        this.loading.set(false);
        this.errorService.showError('Impossible de charger le catalogue vélos');
      },
    });
  }

  selectVelo(velo: VeloItem): void {
    this.selectedVeloId.set(velo.id);
  }

  createDemande(): void {
    const velo = this.selectedVelo();
    if (!velo) {
      this.errorService.showError('Veuillez sélectionner un vélo');
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.errorService.showError('Veuillez vous connecter pour créer une demande');
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user?.id) { this.errorService.showError('Utilisateur non authentifié'); return; }

    const payload: CreateDemandeWithVeloPayload = {
      idUser: user.id,
      mojoId: user.id,
      velo: {
        cmsId:     velo.id,
        marque:    'Marque inconnue',
        modele:    velo.title?.rendered ?? 'Modèle inconnu',
        type:      velo.acf?.type ?? null,
        prixAchat: this.getVeloPrice(velo) ?? 0,
      },
    };

    this.creatingDemande.set(true);
    this.demandeService.createWithVelo(payload).pipe(finalize(() => this.creatingDemande.set(false))).subscribe({
      next: (res) => {
        const demandeId = res.demandeId ?? res.id ?? null;
        const qp: Record<string, string> = { veloTitle: velo.title?.rendered ?? '' };
        const price = this.getVeloPrice(velo);
        if (price != null)   qp['veloPrice']  = String(price);
        if (demandeId  != null)   qp['demandeId']  = String(demandeId);
        this.router.navigate(['/demande-confirmation'], { queryParams: qp });
      },
      error: (err) => {
        const msg = err?.error?.message || (err instanceof Error ? err.message : 'Impossible de créer la demande');
        this.errorService.showError(msg);
      },
    });
  }

  selectedVelo(): VeloItem | null {
    const id = this.selectedVeloId();
    return id ? this.velos().find((v) => v.id === id) ?? null : null;
  }

  isSelected(velo: VeloItem): boolean { return this.selectedVeloId() === velo.id; }

  getVeloImage(velo: VeloItem): string | null {
    return velo._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
  }

  getVeloPrice(velo: VeloItem): number | null {
    return velo.acf?.prix ?? velo.acf?.prix_par_mois ?? null;
  }

  getVeloTitle(velo: VeloItem): string {
    return velo.title?.rendered ?? `#${velo.id}`;
  }

  formatCurrency(amount?: number | null): string {
    if (amount == null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
