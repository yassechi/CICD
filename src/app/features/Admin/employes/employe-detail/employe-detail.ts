import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, ConfirmDialogModule, TagModule, DialogModule, PasswordModule],
  providers: [ConfirmationService],
  templateUrl: './employe-detail.html',
  styleUrls: ['./employe-detail.scss'],
})
export class EmployeDetailComponent {
  user = signal<User | null>(null);
  userId = signal<string | null>(null);

  reactivateDialogOpen = false;
  reactivateSubmitting = false;
  reactivateSubmitted = false;
  reactivatePassword = '';
  reactivateConfirm = '';

  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }
    this.userId.set(id);
    this.userService.getOne(id).subscribe({
      next: (data) => this.user.set(data),
      error: () => { this.messageService.showError(this.i18n.get('employes.loadOneError')); this.goBack(); },
    });
  }

  goBack(): void { this.router.navigate([this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes']); }
  goEdit(): void { this.router.navigate([`${this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes'}/${this.userId()}/edit`]); }
  onDelete(): void {
    const id = this.userId();
    if (!id) return;
    const name = this.user()?.userName || this.user()?.email || this.user()?.firstName || '';
    const message = name
      ? this.i18n.format('employes.deleteConfirmName', { name })
      : this.i18n.get('employes.deleteConfirm');
    this.confirmationService.confirm({
      message,
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () => this.userService.delete(id).subscribe({
        next: () => {
          this.messageService.showSuccess(
            this.i18n.get('employes.deleteSuccess'),
            this.i18n.get('common.succes'),
          );
          this.goBack();
        },
        error: () => this.messageService.showError(this.i18n.get('employes.deleteError')),
      }),
    });
  }

  openReactivateDialog(): void {
    this.reactivatePassword = '';
    this.reactivateConfirm = '';
    this.reactivateSubmitted = false;
    this.reactivateDialogOpen = true;
  }

  closeReactivateDialog(): void {
    this.reactivateDialogOpen = false;
    this.reactivateSubmitting = false;
  }

  confirmReactivate(): void {
    this.reactivateSubmitted = true;
    const passwordError = this.getReactivatePasswordError();
    const confirmError = this.getReactivateConfirmError();
    if (passwordError || confirmError) return;
    this.onReactivate();
  }

  private onReactivate(): void {
    const u = this.user();
    const id = this.userId();
    if (!u || !id) return;
    const organisationId = this.resolveOrganisationId(u.organisationId);
    if (organisationId == null) {
      this.messageService.showError(this.i18n.get('employes.reactivateError'));
      return;
    }
    this.reactivateSubmitting = true;
    this.userService.update({
      id,
      userName: u.userName,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role,
      tailleCm: u.tailleCm ?? 177,
      organisationId,
      isActif: true,
      password: this.reactivatePassword.trim(),
      confirmPassword: this.reactivateConfirm.trim(),
    }).subscribe({
      next: () => {
        this.messageService.showSuccess(
          this.i18n.get('employes.reactivateSuccess'),
          this.i18n.get('common.succes'),
        );
        this.user.set({ ...u, isActif: true });
        this.reactivateDialogOpen = false;
        this.reactivateSubmitting = false;
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
  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return role === UserRole.Admin ? 'danger' : role === UserRole.Manager ? 'warn' : role === UserRole.User ? 'info' : 'secondary';
  }
  getOrganisationName(user: User): string {
    const org = user.organisationId;
    return org && typeof org === 'object' ? org.name || this.i18n.t().common.inconnu : typeof org === 'number' ? String(org) : this.i18n.t().common.inconnu;
  }

  isActive(user: User | null | undefined): boolean {
    return this.isActiveValue(user?.isActif);
  }
  isInactive(user: User | null | undefined): boolean {
    return !this.isActiveValue(user?.isActif);
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
