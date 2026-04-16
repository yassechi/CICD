import {
  DemandeDetail,
  DemandeService,
  DemandeStatus,
} from '../../../../core/services/demande.service';
import { DemandeDiscussionComponent } from '../../../../shared/demande-discussion/demande-discussion';
import { VeloCatalogService, VeloItem } from '../../../../core/services/velo-catalog.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ConfirmDialogModule,
    TagModule,
    DemandeDiscussionComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './demande-detail.html',
  styleUrls: ['./demande-detail.scss'],
})
export class DemandeDetailComponent {
  demande = signal<DemandeDetail | null>(null);
  demandeId = signal<number | null>(null);
  velo = signal<VeloItem | null>(null);
  loading = signal(false);
  readonly DemandeStatus = DemandeStatus;

  private readonly demandeService = inject(DemandeService);
  private readonly veloCatalogService = inject(VeloCatalogService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  constructor() {
    this.route.paramMap.subscribe((p) => {
      const id = Number(p.get('id'));
      if (!id) {
        this.goBack();
        return;
      }
      this.demandeId.set(id);
      this.loading.set(true);
      this.demandeService.getDetail(id).subscribe({
        next: (demande) => {
          const user = this.authService.getCurrentUser();
          if (user?.role === 3) {
            const userId = this.normalizeId(user.id);
            const demandeId = this.normalizeId(demande.idUser);
            if (!userId || !demandeId || userId !== demandeId) {
              this.messageService.showError(this.i18n.get('demandes.accessDenied'));
              this.loading.set(false);
              this.goBack();
              return;
            }
          }
          this.demande.set(demande);
          this.loading.set(false);
          const cmsId = demande.veloCmsId ?? null;
          if (!cmsId) {
            this.velo.set(null);
            return;
          }
          this.veloCatalogService.getVeloById(cmsId).subscribe({
            next: (velo) => this.velo.set(velo),
            error: () => this.velo.set(null),
          });
        },
        error: () => {
          this.messageService.showError(this.i18n.get('demandes.loadDemandeError'));
          this.loading.set(false);
          this.goBack();
        },
      });
    });
  }

  onValidate(): void {
    const role = this.authService.getCurrentUser()?.role;
    this.onDecision(
      role === 3
        ? DemandeStatus.AttenteComagnie
        : role === 2
          ? DemandeStatus.Finalisation
          : DemandeStatus.Valide,
    );
  }

  onDecision(decision: DemandeStatus): void {
    const id = this.demande()?.id;
    if (!id) return;
    this.demandeService.updateStatus(id, decision).subscribe({
      next: () => {
        this.demande.update((d) => (d ? { ...d, status: decision } : d));
        this.messageService.showSuccess(
          this.i18n.format('demandes.statusChanged', { status: this.getStatusLabel(decision) }),
          this.i18n.get('common.succes'),
        );
      },
      error: () => this.messageService.showError(this.i18n.get('demandes.statusUpdateError')),
    });
  }

  onDelete(): void {
    const id = this.demandeId();
    if (!id) return;
    this.confirmationService.confirm({
      message: this.i18n.get('demandes.deleteConfirm'),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () =>
        this.demandeService.delete(id).subscribe({
          next: () => {
            this.messageService.showSuccess(
              this.i18n.get('demandes.deleteSuccess'),
              this.i18n.get('common.succes'),
            );
            this.goBack();
          },
          error: () => this.messageService.showError(this.i18n.get('demandes.deleteError')),
        }),
    });
  }

  isValidateDisabled(): boolean {
    const d = this.demande();
    const role = this.authService.getCurrentUser()?.role;
    if (!d) return true;
    return role === UserRole.User
      ? d.status !== DemandeStatus.Encours
      : role === UserRole.Manager
        ? d.status !== DemandeStatus.AttenteComagnie
        : d.status !== DemandeStatus.Finalisation;
  }

  goBack(): void {
    this.router.navigate([this.basePath()]);
  }
  goEdit(): void {
    this.router.navigate([`${this.basePath()}/${this.demandeId()}/edit`]);
  }

  private basePath(): string {
    const url = this.router.url;
    return url.startsWith('/manager/')
      ? '/manager/demandes'
      : url.startsWith('/user/')
        ? '/user/demandes'
        : '/admin/demandes';
  }

  getVeloImage(velo: VeloItem | null): string | null {
    console.log(velo?.yoast_head_json?.['og_image'].url);
    console.log(velo);
    return velo?.yoast_head_json?.['og_image'][0].url ?? null;
  }
  get isUserView(): boolean {
    return this.router.url.startsWith('/user/');
  }
  getStatusLabel(s: DemandeStatus): string {
    return this.demandeService.getStatusLabel(s);
  }
  getStatusClass(s: DemandeStatus): string {
    return this.demandeService.getStatusClass(s);
  }
  getStatusSeverity(s: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(s);
  }
  formatCurrency(amount?: number | null): string {
    if (amount == null) return '-';
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  }
  private normalizeId(value?: string): string {
    return (value ?? '').trim().replace(/[{}]/g, '').toLowerCase();
  }
}
