import {
  AdminDemandeListItem,
  DemandeService,
  DemandeStatus,
} from '../../../../core/services/demande.service';
import { MessageApiService } from '../../../../core/services/message-api.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, effect, inject, signal } from '@angular/core';
import { VeloService } from '../../../../core/services/velo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User } from '../../../../core/models/user.model';
import { InputTextModule } from 'primeng/inputtext';
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
import { finalize } from 'rxjs';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    ConfirmDialogModule,
    TooltipModule,
    SelectModule,
    InputTextModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class AdminDemandesComponent {
  demandes = signal<AdminDemandeListItem[]>([]);
  loading = signal(false);
  unreadDiscussionIds = signal(new Set<number>());
  typeOptions = signal<Array<{ label: string; value: string | 'all' }>>([
    { label: 'Tous', value: 'all' },
  ]);

  statusFilter: DemandeStatus | 'all' = 'all';
  typeFilter: string | 'all' = 'all';
  searchTerm = '';
  readonly DemandeStatus = DemandeStatus;

  statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation', value: DemandeStatus.Finalisation },
    { label: 'Valide', value: DemandeStatus.Valide },
    { label: 'Refuse', value: DemandeStatus.Refuse },
  ];

  private readonly demandeService = inject(DemandeService);
  private readonly veloService = inject(VeloService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly router = inject(Router);
  private readonly currentUser = this.authService.getCurrentUser();

  constructor() {
    this.veloService
      .getTypes()
      .subscribe((types) =>
        this.typeOptions.set([
          { label: 'Tous', value: 'all' },
          ...types.map((v) => ({ label: v, value: v })),
        ]),
      );

    this.load();
    effect(() => {
      this.messageApiService.refreshSignal();
      this.loadUnreadDiscussions();
    });
  }

  load(): void {
    this.loading.set(true);
    this.demandeService
      .getList({
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
        type: this.typeFilter === 'all' ? undefined : this.typeFilter,
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => {
        this.demandes.set(data ?? []);
        this.loadUnreadDiscussions();
      });
  }

  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) {
      this.unreadDiscussionIds.set(new Set());
      return;
    }
    this.messageApiService
      .getUnreadDiscussions({
        userId: user.id,
        role: user.role,
        organisationId: user.organisationId as number | null,
      })
      .subscribe((ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])));
  }

  onCreate(): void {
    this.router.navigate(['/admin/demandes/new']);
  }
  onView(d: AdminDemandeListItem): void {
    this.router.navigate(['/admin/demandes', d.id]);
  }
  onEdit(d: AdminDemandeListItem): void {
    this.router.navigate(['/admin/demandes', d.id, 'edit']);
  }
  onValidate(d: AdminDemandeListItem): void {
    this.onStatusChange(d, DemandeStatus.Valide);
  }
  onReject(d: AdminDemandeListItem): void {
    this.onStatusChange(d, DemandeStatus.Refuse);
  }

  onStatusChange(d: AdminDemandeListItem, newStatus: DemandeStatus): void {
    this.demandeService.updateStatus(d.id!, newStatus).subscribe(() => {
      d.status = newStatus;
      this.messageService.showSuccess('Statut mis à jour', 'Succés');
    });
  }

  onDelete(d: AdminDemandeListItem): void {
    this.confirmationService.confirm({
      message: 'êtes-vous sur de vouloir supprimer cette demande ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () =>
        this.demandeService.delete(d.id!).subscribe(() => {
          this.messageService.showSuccess('Demande supprimée', 'Succès');
          this.load();
        }),
    });
  }

  hasUnreadMessages(d: AdminDemandeListItem): boolean {
    return d.discussionId != null && this.unreadDiscussionIds().has(d.discussionId);
  }
  getStatusLabel(status: DemandeStatus): string {
    return this.demandeService.getStatusLabel(status);
  }
  getStatusClass(status: DemandeStatus): string {
    return this.demandeService.getStatusClass(status);
  }
  getStatusSeverity(status: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(status);
  }
}
