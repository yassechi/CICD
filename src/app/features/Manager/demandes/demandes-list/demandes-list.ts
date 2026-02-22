import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import { AdminDemandeListItem, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageViewService } from '../../../../core/services/message-view.service';
import { ErrorService } from '../../../../core/services/error.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-manager-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TableModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule, SelectModule],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class ManagerDemandesComponent {

  // --- DONNÉES ---
  demandes            = signal<AdminDemandeListItem[]>([]);
  loading             = signal(false);
  unreadDiscussionIds = signal(new Set<number>());

  statusOptions = [
    { label: 'En cours',          value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation',      value: DemandeStatus.Finalisation },
    { label: 'Validé',            value: DemandeStatus.Valide },
    { label: 'Refusé',            value: DemandeStatus.Refuse },
  ];

  // --- SERVICES ---
  private readonly demandeService     = inject(DemandeService);
  private readonly authService        = inject(AuthService);
  private readonly messageViewService = inject(MessageViewService);
  private readonly messageService     = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService       = inject(ErrorService);
  private readonly router             = inject(Router);
  private readonly destroyRef         = inject(DestroyRef);

  private readonly currentUser: User | null = this.authService.getCurrentUser();
  private readonly orgId: number | null     = this.currentUser?.organisationId
    ? (typeof this.currentUser.organisationId === 'object' ? (this.currentUser.organisationId as any).id : this.currentUser.organisationId)
    : null;

  // --- INIT ---
  constructor() {
    this.load();
    // Recharge les messages non lus quand un message est vu
    this.messageViewService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadDiscussions());
  }

  // --- CHARGEMENT ---
  load(): void {
    if (!this.orgId) { this.demandes.set([]); return; }

    this.loading.set(true);
    this.demandeService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => {
        this.demandes.set(data);
        this.loadUnreadDiscussions();
        this.loading.set(false);
      },
      error: () => {
        this.errorService.showError('Impossible de charger les demandes');
        this.loading.set(false);
      },
    });
  }

  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) { this.unreadDiscussionIds.set(new Set()); return; }

    this.messageViewService.getUnreadDiscussions({ userId: user.id, role: user.role, organisationId: this.orgId }).subscribe({
      next: (ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])),
    });
  }

  // --- ACTIONS ---
  onCreate():                            void { this.router.navigate(['/manager/demandes/new']); }
  onView(d: AdminDemandeListItem):       void { this.router.navigate(['/manager/demandes', d.id]); }
  onEdit(d: AdminDemandeListItem):       void { this.router.navigate(['/manager/demandes', d.id, 'edit']); }

  onStatusChange(d: AdminDemandeListItem, status: DemandeStatus): void {
    this.demandeService.updateStatus(d.id!, status).subscribe({
      next: () => {
        this.demandes.update((list) => list.map((item) => item.id === d.id ? { ...item, status } : item));
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

  // --- UTILITAIRES ---
  hasUnreadMessages(d: AdminDemandeListItem): boolean { return !!d.discussionId && this.unreadDiscussionIds().has(d.discussionId); }
  getStatusLabel(s: DemandeStatus):    string { return this.demandeService.getStatusLabel(s); }
  getStatusSeverity(s: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' { return this.demandeService.getStatusSeverity(s); }
  getStatusClass(s: DemandeStatus):    string { return this.demandeService.getStatusClass(s); }
}
