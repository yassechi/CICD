import {
  AdminDemandeListItem,
  DemandeService,
  DemandeStatus,
} from '../../../../core/services/demande.service';
import { MessageApiService } from '../../../../core/services/message-api.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-demandes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule],
  templateUrl: './demandes-list.html',
  styleUrls: ['./demandes-list.scss'],
})
export class ManagerDemandesComponent {
  demandes = signal<AdminDemandeListItem[]>([]);
  loading = signal(false);
  unreadDiscussionIds = signal(new Set<number>());

  private readonly demandeService = inject(DemandeService);
  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  private readonly currentUser: User | null = this.authService.getCurrentUser();
  private readonly orgId: number | null = this.currentUser?.organisationId
    ? typeof this.currentUser.organisationId === 'object'
      ? (this.currentUser.organisationId as any).id
      : this.currentUser.organisationId
    : null;

  constructor() {
    if (!this.orgId) {
      this.demandes.set([]);
      return;
    }
    this.load();
    effect(() => {
      this.messageApiService.refreshSignal();
      this.loadUnreadDiscussions();
    });
  }

  load(): void {
    if (!this.orgId) {
      this.demandes.set([]);
      return;
    }
    this.loading.set(true);
    this.demandeService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => {
        this.demandes.set(data ?? []);
        this.loadUnreadDiscussions();
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError(this.i18n.get('demandes.loadDemandeError'));
        this.loading.set(false);
      },
    });
  }

  private loadUnreadDiscussions(): void {
    const user = this.currentUser;
    if (!user?.id) {
      this.unreadDiscussionIds.set(new Set());
      return;
    }
    this.messageApiService
      .getUnreadDiscussions({ userId: user.id, role: user.role, organisationId: this.orgId })
      .subscribe({
        next: (ids) => this.unreadDiscussionIds.set(new Set(ids ?? [])),
      });
  }

  onCreate(): void {
    this.router.navigate(['/manager/demandes/new']);
  }
  onView(d: AdminDemandeListItem): void {
    this.router.navigate(['/manager/demandes', d.id]);
  }

  hasUnreadMessages(d: AdminDemandeListItem): boolean {
    return !!d.discussionId && this.unreadDiscussionIds().has(d.discussionId);
  }
  getStatusLabel(s: DemandeStatus): string {
    return this.demandeService.getStatusLabel(s);
  }
  getStatusSeverity(s: DemandeStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return this.demandeService.getStatusSeverity(s);
  }
  getStatusClass(s: DemandeStatus): string {
    return this.demandeService.getStatusClass(s);
  }
}
