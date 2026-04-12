import {
  AdminDemandeListItem,
  DemandeService,
  DemandeStatus,
} from '../../../../core/services/demande.service';
import { MessageApiService } from '../../../../core/services/message-api.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, effect, inject, signal } from '@angular/core';
import { VeloService } from '../../../../core/services/velo.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
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
    TagModule,
    TableModule,
    TooltipModule,
    SelectModule,
    InputTextModule,
  ],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class AdminDemandesComponent {
  demandes = signal<AdminDemandeListItem[]>([]);
  loading = signal(false);
  unreadDiscussionIds = signal(new Set<number>());
  typeOptions = signal<Array<{ label: string; value: string | 'all' }>>([]);
  private rawTypes = signal<string[]>([]);

  statusFilter: DemandeStatus | 'all' = 'all';
  typeFilter: string | 'all' = 'all';
  searchTerm = '';
  readonly DemandeStatus = DemandeStatus;

  get statusOptions() {
    const t = this.i18n.t();
    return [
      { label: t.common.tous, value: 'all' },
      { label: t.demandeStatus.encours, value: DemandeStatus.Encours },
      { label: t.demandeStatus.attenteCompagnie, value: DemandeStatus.AttenteComagnie },
      { label: t.demandeStatus.finalisation, value: DemandeStatus.Finalisation },
      { label: t.demandeStatus.valide, value: DemandeStatus.Valide },
      { label: t.demandeStatus.refuse, value: DemandeStatus.Refuse },
    ];
  }

  private readonly demandeService = inject(DemandeService);
  private readonly veloService = inject(VeloService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly router = inject(Router);
  private readonly currentUser = this.authService.getCurrentUser();
  readonly i18n = inject(I18nService);

  constructor() {
    this.veloService.getTypes().subscribe((types) => this.rawTypes.set(types ?? []));

    this.load();
    effect(() => {
      this.i18n.lang();
      const t = this.i18n.t();
      this.typeOptions.set([
        { label: t.common.tous, value: 'all' },
        ...this.rawTypes().map((v) => ({ label: v, value: v })),
      ]);
      this.messageApiService.refreshSignal();
      this.loadUnreadDiscussions();
    }, { allowSignalWrites: true });
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
