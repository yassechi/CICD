import { AdminDemandeListItem, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { MessageApiService } from '../../../../core/services/message-api.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User } from '../../../../core/models/user.model';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule, SelectModule],
  providers: [ConfirmationService],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class ManagerDemandesComponent {
  demandes = signal<AdminDemandeListItem[]>([]);
  loading = signal(false);
  unreadDiscussionIds = signal(new Set<number>());

  statusOptions = [
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation', value: DemandeStatus.Finalisation },
    { label: 'Valid?', value: DemandeStatus.Valide },
    { label: 'Refus?', value: DemandeStatus.Refuse }];

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser: User | null = this.authService.getCurrentUser();
  private readonly orgId: number | null = this.currentUser?.organisationId
    ? (typeof this.currentUser.organisationId === 'object' ? (this.currentUser.organisationId as any).id : this.currentUser.organisationId)
    : null;

  constructor() {
    if (!this.orgId) { this.demandes.set([]); return; }
    this.load();
    this.messageApiService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadDiscussions());
  }

  load(): void {
    if (!this.orgId) { this.demandes.set([]); return; }
    this.loading.set(true);
    this.demandeService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => { this.demandes.set(data ?? []); this.loadUnreadDiscussions(); this.loading.set(false); },
      error: () => { this.messageService.showError('Impossible de charger les demandes'); this.loading.set(false); },
    });
  }

  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) { this.unreadDiscussionIds.set(new Set()); return; }
    this.messageApiService.getUnreadDiscussions({ userId: user.id, role: user.role, organisationId: this.orgId }).subscribe({
      next: (ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])),
    });
  }

  onCreate(): void { this.router.navigate(['/manager/demandes/new']); }
  onView(d: AdminDemandeListItem): void { this.router.navigate(['/manager/demandes', d.id]); }
  onEdit(d: AdminDemandeListItem): void { this.router.navigate(['/manager/demandes', d.id, 'edit']); }

  onStatusChange(d: AdminDemandeListItem, status: DemandeStatus): void {
    this.demandeService.updateStatus(d.id!, status).subscribe({
      next: () => { this.demandes.update((list) => list.map((item) => item.id === d.id ? { ...item, status } : item)); this.messageService.showSuccess('Statut mis ? jour', 'Succ?s'); },
      error: () => this.messageService.showError('Impossible de mettre ? jour le statut'),
    });
  }

  onDelete(d: AdminDemandeListItem): void {
    this.confirmationService.confirm({
      message: '?tes-vous s?r de vouloir supprimer cette demande ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.demandeService.delete(d.id!).subscribe({
        next: () => { this.messageService.showSuccess('Demande supprim?e', 'Succ?s'); this.load(); },
        error: () => this.messageService.showError('Impossible de supprimer la demande'),
      }),
    });
  }

  hasUnreadMessages(d: AdminDemandeListItem): boolean { return !!d.discussionId && this.unreadDiscussionIds().has(d.discussionId); }
  getStatusLabel(s: DemandeStatus): string { return this.demandeService.getStatusLabel(s); }
  getStatusSeverity(s: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' { return this.demandeService.getStatusSeverity(s); }
  getStatusClass(s: DemandeStatus): string { return this.demandeService.getStatusClass(s); }
}
