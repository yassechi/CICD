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
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-demandes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class DemandesUtilisateurComponent {
  demandes = signal<AdminDemandeListItem[]>([]);
  loading = signal(false);
  unreadDiscussionIds = signal(new Set<number>());

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser: User | null = this.authService.getCurrentUser();

  constructor() {
    this.load();
    this.messageApiService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUnreadDiscussions());
  }

  load(): void {
    const userId = this.currentUser?.id;
    if (!userId) { this.demandes.set([]); return; }

    this.loading.set(true);
    this.demandeService.getList({ userId }).subscribe({
      next: (data) => { this.demandes.set(data ?? []); this.loadUnreadDiscussions(); this.loading.set(false); },
      error: () => { this.messageService.showError('Impossible de charger les demandes'); this.loading.set(false); },
    });
  }

  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) { this.unreadDiscussionIds.set(new Set()); return; }
    this.messageApiService.getUnreadDiscussions({ userId: user.id, role: user.role }).subscribe({
      next: (ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])),
    });
  }

  onCreate(): void { this.router.navigate(['/user/demandes/new']); }
  onView(d: AdminDemandeListItem): void { this.router.navigate(['/user/demandes', d.id]); }
  onEdit(d: AdminDemandeListItem): void { this.router.navigate(['/user/demandes', d.id, 'edit']); }

  onDelete(d: AdminDemandeListItem): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer cette demande ? ?',
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
