import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-manager-employes',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class ManagerEmployesComponent {

  // --- DONNÉES ---
  employes = signal<User[]>([]);
  loading  = signal(false);

  // --- SERVICES ---
  private readonly userService         = inject(UserService);
  private readonly authService         = inject(AuthService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService        = inject(ErrorService);
  private readonly router              = inject(Router);

  private readonly orgId: number | null = (() => {
    const user = this.authService.getCurrentUser();
    if (!user?.organisationId) return null;
    return typeof user.organisationId === 'object' ? (user.organisationId as any).id : user.organisationId;
  })();

  // --- INIT ---
  constructor() { this.load(); }

  // --- CHARGEMENT ---
  load(): void {
    if (!this.orgId) { this.employes.set([]); return; }

    this.loading.set(true);
    this.userService.getByOrganisation(this.orgId, UserRole.User).subscribe({
      next:  (data) => { this.employes.set(data); this.loading.set(false); },
      error: ()     => { this.errorService.showError('Impossible de charger les employés'); this.loading.set(false); },
    });
  }

  // --- ACTIONS ---
  onCreate():           void { this.router.navigate(['/manager/employes/new']); }
  onView(u: User):      void { this.router.navigate(['/manager/employes', u.id]); }
  onEdit(u: User):      void { this.router.navigate(['/manager/employes', u.id, 'edit']); }

  onDelete(u: User): void {
    this.confirmationService.confirm({
      message:     `Êtes-vous sûr de vouloir supprimer l'employé "${u.firstName} ${u.lastName}" ?`,
      header:      'Confirmation',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.userService.delete(u.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Employé supprimé' });
            this.load();
          },
          error: () => this.errorService.showError('Impossible de supprimer l\'employé'),
        });
      },
    });
  }

  // --- UTILITAIRES ---
  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:   return 'Administrateur';
      case UserRole.Manager: return 'Manager';
      case UserRole.User:    return 'Utilisateur';
      default:               return 'Inconnu';
    }
  }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case UserRole.Admin:   return 'danger';
      case UserRole.Manager: return 'warn';
      case UserRole.User:    return 'info';
      default:               return 'secondary';
    }
  }

  getOrganisationName(u: User): string {
    return u.organisationId && typeof u.organisationId === 'object' ? (u.organisationId as any).name || 'N/A' : 'N/A';
  }
}
