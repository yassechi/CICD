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
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TableModule, TagModule,
    DialogModule, PasswordModule, SelectModule, InputTextModule],
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

  reactivateDialogOpen = false;
  reactivateSubmitting = false;
  reactivateSubmitted = false;
  reactivatePassword = '';
  reactivateConfirm = '';
  reactivateUser: User | null = null;

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

  openReactivate(user: User): void {
    this.reactivateUser = user;
    this.reactivatePassword = '';
    this.reactivateConfirm = '';
    this.reactivateSubmitted = false;
    this.reactivateDialogOpen = true;
  }

  closeReactivate(): void {
    this.reactivateDialogOpen = false;
    this.reactivateSubmitting = false;
  }

  confirmReactivate(): void {
    this.reactivateSubmitted = true;
    const passwordError = this.getReactivatePasswordError();
    const confirmError = this.getReactivateConfirmError();
    if (passwordError || confirmError) return;
    const user = this.reactivateUser;
    if (!user?.id) {
      this.messageService.showError(this.i18n.get('employes.reactivateError'));
      return;
    }
    this.reactivateSubmitting = true;
    const pwd = this.reactivatePassword.trim();
    const confirm = this.reactivateConfirm.trim();
    this.userService.getOne(user.id).subscribe({
      next: (full) => {
        const organisationId = this.resolveOrganisationId(full.organisationId ?? user.organisationId);
        if (organisationId == null) {
          this.messageService.showError(this.i18n.get('employes.reactivateError'));
          this.reactivateSubmitting = false;
          return;
        }
        this.userService.update({
          id: full.id ?? user.id,
          userName: full.userName ?? user.userName,
          firstName: full.firstName ?? user.firstName,
          lastName: full.lastName ?? user.lastName,
          email: full.email ?? user.email,
          phoneNumber: full.phoneNumber ?? user.phoneNumber,
          role: (full.role ?? user.role) as UserRole,
          tailleCm: full.tailleCm ?? user.tailleCm ?? 177,
          organisationId,
          isActif: true,
          password: pwd,
          confirmPassword: confirm,
        }).subscribe({
          next: () => {
            this.messageService.showSuccess(
              this.i18n.get('employes.reactivateSuccess'),
              this.i18n.get('common.succes'),
            );
            this.reactivateDialogOpen = false;
            this.reactivateSubmitting = false;
            this.load();
          },
          error: (error) => {
            this.reactivateSubmitting = false;
            this.messageService.showError(
              this.getApiErrorMessage(error, this.i18n.get('employes.reactivateError')),
              this.i18n.get('common.erreur'),
            );
          },
        });
      },
      error: (error) => {
        this.reactivateSubmitting = false;
        this.messageService.showError(
          this.getApiErrorMessage(error, this.i18n.get('employes.reactivateError')),
          this.i18n.get('common.erreur'),
        );
      },
    });
  }

  getRoleLabel(role: UserRole): string {
    return role === UserRole.Admin
      ? this.i18n.t().employes.admin
      : role === UserRole.Manager
        ? this.i18n.t().employes.manager
        : role === UserRole.User
          ? this.i18n.t().employes.utilisateur
          : this.i18n.t().common.inconnu;
  }
  isInactive(user: User): boolean { return !this.isActiveValue(user.isActif); }
  getSeverity(isActif: unknown): 'success' | 'danger' {
    return this.isActiveValue(isActif) ? 'success' : 'danger';
  }
  getStatusLabel(isActif: unknown): string {
    return this.isActiveValue(isActif) ? this.i18n.t().common.actif : this.i18n.t().common.inactif;
  }

  private isActiveValue(value: unknown): boolean {
    if (value === true || value === 1) return true;
    if (value === false || value === 0 || value == null) return false;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'actif') return true;
      if (normalized === 'false' || normalized === '0' || normalized === 'inactif') return false;
    }
    return Boolean(value);
  }

  private resolveOrganisationId(value: unknown): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof value === 'object' && 'id' in (value as any)) {
      const id = (value as any).id;
      return typeof id === 'number' ? id : typeof id === 'string' ? Number(id) : null;
    }
    return null;
  }

  getReactivatePasswordError(): string | null {
    if (!this.reactivateSubmitted) return null;
    const pwd = this.reactivatePassword.trim();
    if (!pwd) return this.i18n.t().employes.passwordRequired;
    if (pwd.length < 8) return this.i18n.t().employes.passwordMin;
    return null;
  }

  getReactivateConfirmError(): string | null {
    if (!this.reactivateSubmitted) return null;
    const pwd = this.reactivatePassword.trim();
    const confirm = this.reactivateConfirm.trim();
    if (!confirm) return this.i18n.t().employes.confirmRequired;
    if (pwd !== confirm) return this.i18n.t().employes.passwordMismatch;
    return null;
  }

  private getApiErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    const payload = error?.error ?? error;
    if (typeof payload === 'string') return payload;
    if (Array.isArray(payload)) return payload.filter(Boolean).join(' | ') || fallback;
    if (payload?.errors && typeof payload.errors === 'object') {
      const messages = Object.values(payload.errors)
        .flatMap((val) => (Array.isArray(val) ? val : [val]))
        .filter(Boolean);
      if (messages.length) return messages.join(' | ');
    }
    if (payload?.message) return payload.message;
    return fallback;
  }
}
