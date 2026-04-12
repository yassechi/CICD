import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-employes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class ManagerEmployesComponent {
  employes = signal<User[]>([]);
  loading = signal(false);

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  private readonly orgId: number | null = (() => {
    const user = this.authService.getCurrentUser();
    if (!user?.organisationId) return null;
    return typeof user.organisationId === 'object' ? (user.organisationId as any).id : user.organisationId;
  })();

  constructor() { this.load(); }

  load(): void {
    if (!this.orgId) { this.employes.set([]); return; }
    this.loading.set(true);
    this.userService.getByOrganisation(this.orgId, UserRole.User).subscribe({
      next: (data) => { this.employes.set(data ?? []); this.loading.set(false); },
      error: () => { this.messageService.showError(this.i18n.get('employes.loadError')); this.loading.set(false); },
    });
  }

  onCreate(): void { this.router.navigate(['/manager/employes/new']); }
  onView(u: User): void { this.router.navigate(['/manager/employes', u.id]); }

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
  getOrganisationName(u: User): string {
    return u.organisationId && typeof u.organisationId === 'object' ? (u.organisationId as any).name || this.i18n.t().common.inconnu : this.i18n.t().common.inconnu;
  }
}
