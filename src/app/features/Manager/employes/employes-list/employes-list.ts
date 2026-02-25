import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-employes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class ManagerEmployesComponent {
  employes = signal<User[]>([]);
  loading = signal(false);

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

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
      error: () => { this.messageService.showError('Impossible de charger les employ?s'); this.loading.set(false); },
    });
  }

  onCreate(): void { this.router.navigate(['/manager/employes/new']); }
  onView(u: User): void { this.router.navigate(['/manager/employes', u.id]); }
  onEdit(u: User): void { this.router.navigate(['/manager/employes', u.id, 'edit']); }

  onDelete(u: User): void {
    this.confirmationService.confirm({
      message: `?tes-vous s?r de vouloir supprimer l'employ? "${u.firstName} ${u.lastName}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.userService.delete(u.id!).subscribe({
        next: () => { this.messageService.showSuccess('Employ? supprim?', 'Succ?s'); this.load(); },
        error: () => this.messageService.showError("Impossible de supprimer l'employ?"),
      }),
    });
  }

  getRoleLabel(role: UserRole): string {
    return role === UserRole.Admin ? 'Administrateur' : role === UserRole.Manager ? 'Manager' : role === UserRole.User ? 'Utilisateur' : 'Inconnu';
  }
  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return role === UserRole.Admin ? 'danger' : role === UserRole.Manager ? 'warn' : role === UserRole.User ? 'info' : 'secondary';
  }
  getOrganisationName(u: User): string {
    return u.organisationId && typeof u.organisationId === 'object' ? (u.organisationId as any).name || 'N/A' : 'N/A';
  }
}
