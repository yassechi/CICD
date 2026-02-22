import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

import { DemandeDetail, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { VeloCatalogService, VeloItem } from '../../../../core/services/velo-catalog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';

import { DemandeDiscussionComponent } from '../../../../shared/components/demande-discussion/demande-discussion';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, ToastModule, DemandeDiscussionComponent],
  providers: [PrimeMessageService],
  templateUrl: './demande-detail.html',
  styleUrls: ['./demande-detail.scss'],
})
export class DemandeDetailComponent {

  demande   = signal<DemandeDetail | null>(null);
  demandeId = signal<number | null>(null);
  velo      = signal<VeloItem | null>(null);
  loading   = signal(false);

  readonly DemandeStatus = DemandeStatus;

  private readonly demandeService     = inject(DemandeService);
  private readonly veloCatalogService = inject(VeloCatalogService);
  private readonly authService        = inject(AuthService);
  private readonly errorService       = inject(ErrorService);
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly messageService     = inject(PrimeMessageService);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.goBack(); return; }

    this.demandeId.set(id);
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.demandeService.getDetail(id).subscribe({
      next: (demande) => {
        const user = this.authService.getCurrentUser();
        if (user?.role === 3) {
          const userId    = this.normalizeId(user.id);
          const demandeId = this.normalizeId(demande.idUser);
          if (!userId || !demandeId || userId !== demandeId) {
            this.errorService.showError("Vous ne pouvez pas accéder à la demande d'un autre utilisateur");
            this.loading.set(false);
            this.goBack();
            return;
          }
        }
        this.demande.set(demande);
        this.loading.set(false);
        this.loadVeloImage(demande.veloCmsId ?? null);
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  private loadVeloImage(cmsId: number | null): void {
    if (!cmsId) { this.velo.set(null); return; }
    this.veloCatalogService.getVeloById(cmsId).subscribe({
      next:  (velo) => this.velo.set(velo),
      error: ()     => this.velo.set(null),
    });
  }

  onValidate(): void {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 3) { this.onDecision(DemandeStatus.AttenteComagnie); return; }
    if (role === 2) { this.onDecision(DemandeStatus.Finalisation);    return; }
    this.onDecision(DemandeStatus.Valide);
  }

  onDecision(decision: DemandeStatus): void {
    const id = this.demande()?.id;
    if (!id) return;

    this.demandeService.updateStatus(id, decision).subscribe({
      next: () => {
        this.demande.update((d) => d ? { ...d, status: decision } : d);
        const labels: Record<DemandeStatus, string> = {
          [DemandeStatus.Finalisation]:    'Demande en finalisation',
          [DemandeStatus.Valide]:          'Demande validée',
          [DemandeStatus.AttenteComagnie]: 'Demande en attente compagnie',
          [DemandeStatus.Refuse]:          'Demande refusée',
          [DemandeStatus.Encours]:         'Demande en cours',
        };
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: labels[decision] });
      },
      error: () => this.errorService.showError('Impossible de mettre à jour la demande'),
    });
  }

  isValidateDisabled(): boolean {
    const d    = this.demande();
    const role = this.authService.getCurrentUser()?.role;
    if (!d) return true;
    if (role === 3) return d.status !== DemandeStatus.Encours;
    if (role === 2) return d.status !== DemandeStatus.AttenteComagnie;
    return d.status !== DemandeStatus.Finalisation;
  }

  goBack(): void { this.router.navigate([this.basePath()]); }
  goEdit(): void { this.router.navigate([`${this.basePath()}/${this.demandeId()}/edit`]); }

  private basePath(): string {
    const url = this.router.url;
    if (url.startsWith('/manager/')) return '/manager/demandes';
    if (url.startsWith('/user/'))    return '/user/demandes';
    return '/admin/demandes';
  }

  getVeloImage(velo: VeloItem | null): string | null {
    return velo?._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
  }

  get isUserView(): boolean { return this.router.url.startsWith('/user/'); }

  getStatusLabel(s: DemandeStatus):    string { return this.demandeService.getStatusLabel(s); }
  getStatusClass(s: DemandeStatus):    string { return this.demandeService.getStatusClass(s); }
  getStatusSeverity(s: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(s);
  }

  formatCurrency(amount?: number | null): string {
    if (amount == null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  private normalizeId(value?: string): string {
    return (value ?? '').trim().replace(/[{}]/g, '').toLowerCase();
  }
}
