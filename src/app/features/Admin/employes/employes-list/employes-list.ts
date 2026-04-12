import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, computed, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
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
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TableModule, TagModule, SelectModule, InputTextModule],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class AdminEmployesComponent {
  users = signal<User[]>([]);
  loading = signal(false);

  searchTerm = '';
  roleFilter: UserRole | 'all' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly roleOptions = computed(() => [
    { label: this.i18n.t().common.tous, value: 'all' },
    { label: this.i18n.t().employes.admin, value: UserRole.Admin },
    { label: this.i18n.t().employes.manager, value: UserRole.Manager },
    { label: this.i18n.t().employes.utilisateur, value: UserRole.User },
  ]);

  readonly statusOptions = computed(() => [
    { label: this.i18n.t().common.tous, value: 'all' },
    { label: this.i18n.t().common.actif, value: 'active' },
    { label: this.i18n.t().common.inactif, value: 'inactive' },
  ]);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.userService
      .getList({
        role: this.roleFilter === 'all' ? undefined : this.roleFilter,
        isActif: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.users.set(data ?? []),
        error: () => this.messageService.showError(this.i18n.get('employes.loadError')),
      });
  }

  onCreate(): void { this.router.navigate(['/admin/employes/new']); }
  onView(user: User): void { this.router.navigate(['/admin/employes', user.id]); }

  getRoleLabel(role: UserRole): string {
    return role === UserRole.Admin
      ? this.i18n.t().employes.admin
      : role === UserRole.Manager
        ? this.i18n.t().employes.manager
        : role === UserRole.User
          ? this.i18n.t().employes.utilisateur
          : this.i18n.t().common.inconnu;
  }
  getSeverity(isActif: boolean): 'success' | 'danger' { return isActif ? 'success' : 'danger'; }
  getStatusLabel(isActif: boolean): string { return isActif ? this.i18n.t().common.actif : this.i18n.t().common.inactif; }
}
