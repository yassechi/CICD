import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { AdminDemandeListItem, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { VeloService } from '../../../../core/services/velo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { MessageViewService } from '../../../../core/services/message-view.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TagModule, TableModule,
    ConfirmDialogModule, ToastModule, TooltipModule,
    SelectModule, InputTextModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class AdminDemandesComponent {

  // --- DONNÉES ---
  demandes             = signal<AdminDemandeListItem[]>([]);
  loading              = signal(false);
  unreadDiscussionIds  = signal(new Set<number>());
  typeOptions          = signal<Array<{ label: string; value: string | 'all' }>>([{ label: 'Tous', value: 'all' }]);

  // Filtres liés aux inputs HTML
  statusFilter: DemandeStatus | 'all' = 'all';
  typeFilter: string | 'all'          = 'all';
  searchTerm                          = '';

  readonly DemandeStatus = DemandeStatus;

  statusOptions = [
    { label: 'Tous',              value: 'all' },
    { label: 'En cours',          value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation',      value: DemandeStatus.Finalisation },
    { label: 'Valide',            value: DemandeStatus.Valide },
    { label: 'Refuse',            value: DemandeStatus.Refuse },
  ];

  // --- SERVICES ---
  private readonly demandeService     = inject(DemandeService);
  private readonly veloService        = inject(VeloService);
  private readonly messageService     = inject(PrimeMessageService);
  private readonly confirmationService= inject(ConfirmationService);
  private readonly errorService       = inject(ErrorService);
  private readonly authService        = inject(AuthService);
  private readonly messageViewService = inject(MessageViewService);
  private readonly router             = inject(Router);
  private readonly destroyRef         = inject(DestroyRef);
  private readonly currentUser        = this.authService.getCurrentUser();

  // --- INIT ---
  constructor() {
    this.loadTypeOptions();
    this.load();

    // Écoute les nouveaux messages en temps réel
    this.messageViewService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadDiscussions());
  }

  // --- CHARGEMENT ---
  load(): void {
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    const type   = this.typeFilter   === 'all' ? undefined : this.typeFilter;
    const search = this.searchTerm.trim() || undefined;

    this.loading.set(true);
    this.demandeService
      .getList({ status, type, search })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.demandes.set(data);
          this.loadUnreadDiscussions();
        },
        error: () => this.errorService.showError('Impossible de charger les demandes'),
      });
  }

  // Charge les types de vélos pour le filtre (une seule fois)
  loadTypeOptions(): void {
    this.veloService.getTypes().subscribe({
      next: (types) => this.typeOptions.set([
        { label: 'Tous', value: 'all' },
        ...types.map((v) => ({ label: v, value: v })),
      ]),
      error: () => this.errorService.showError('Impossible de charger les types de velo'),
    });
  }

  // Charge les discussions non lues pour afficher l'indicateur
  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) { this.unreadDiscussionIds.set(new Set()); return; }

    this.messageViewService.getUnreadDiscussions({
      userId: user.id,
      role: user.role,
      organisationId: this.resolveOrganisationId(user),
    }).subscribe({
      next: (ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])),
    });
  }

  // Récupère l'id de l'organisation de l'utilisateur
  private resolveOrganisationId(user: User): number | null {
    const org = user.organisationId;
    if (typeof org === 'number') return org;
    if (org && typeof org === 'object' && 'id' in org) return typeof org.id === 'number' ? org.id : null;
    return null;
  }

  // --- ACTIONS ---
  onCreate():                          void { this.router.navigate(['/admin/demandes/new']); }
  onView(d: AdminDemandeListItem):     void { this.router.navigate(['/admin/demandes', d.id]); }
  onEdit(d: AdminDemandeListItem):     void { this.router.navigate(['/admin/demandes', d.id, 'edit']); }
  onValidate(d: AdminDemandeListItem): void { this.onStatusChange(d, DemandeStatus.Valide); }
  onReject(d: AdminDemandeListItem):   void { this.onStatusChange(d, DemandeStatus.Refuse); }

  onStatusChange(d: AdminDemandeListItem, newStatus: DemandeStatus): void {
    this.demandeService.updateStatus(d.id!, newStatus).subscribe({
      next: () => {
        d.status = newStatus;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Statut mis à jour' });
      },
      error: () => this.errorService.showError('Impossible de mettre à jour le statut'),
    });
  }

  onDelete(d: AdminDemandeListItem): void {
    this.confirmationService.confirm({
      message:     'Êtes-vous sûr de vouloir supprimer cette demande ?',
      header:      'Confirmation',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.demandeService.delete(d.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Demande supprimée' });
            this.load();
          },
          error: () => this.errorService.showError('Impossible de supprimer la demande'),
        });
      },
    });
  }

  // Export CSV
  exportDemandes(): void {
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    const type   = this.typeFilter   === 'all' ? undefined : this.typeFilter;
    const search = this.searchTerm.trim() || undefined;

    this.demandeService.exportCsv({ status, type, search }).subscribe({
      next: (blob) => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.setAttribute('download', 'demandes-export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: () => this.errorService.showError("Impossible d'exporter les demandes"),
    });
  }

  // --- UTILITAIRES ---
  hasUnreadMessages(d: AdminDemandeListItem): boolean {
    return !!d.discussionId && this.unreadDiscussionIds().has(d.discussionId);
  }

  getStatusLabel(status: DemandeStatus):    string { return this.demandeService.getStatusLabel(status); }
  getStatusClass(status: DemandeStatus):    string { return this.demandeService.getStatusClass(status); }
  getStatusSeverity(status: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }

  formatCurrency(amount: number | null): string {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
