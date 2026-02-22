import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TableModule, TagModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
    SelectModule, InputTextModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class AdminEmployesComponent {

  // --- DONNÉES ---
  users   = signal<User[]>([]);
  loading = signal(false);

  // Filtres
  searchTerm   = '';
  roleFilter:   UserRole | 'all'          = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  roleOptions = [
    { label: 'Tous',           value: 'all' },
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager',        value: UserRole.Manager },
    { label: 'Utilisateur',    value: UserRole.User },
  ];

  statusOptions = [
    { label: 'Tous',    value: 'all' },
    { label: 'Actif',   value: 'active' },
    { label: 'Inactif', value: 'inactive' },
  ];

  // --- SERVICES ---
  private readonly userService         = inject(UserService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService        = inject(ErrorService);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() { this.load(); }

  // --- CHARGEMENT ---
  load(): void {
    const role    = this.roleFilter   === 'all' ? undefined : this.roleFilter;
    const isActif = this.statusFilter === 'all' ? undefined : this.statusFilter === 'active';
    const search  = this.searchTerm.trim() || undefined;

    this.loading.set(true);
    this.userService
      .getList({ role, isActif, search })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (data) => this.users.set(data),
        error: ()     => this.errorService.showError('Impossible de charger les employés'),
      });
  }

  // --- NAVIGATION ---
  onCreate():             void { this.router.navigate(['/admin/employes/new']); }
  onView(user: User):     void { this.router.navigate(['/admin/employes', user.id]); }
  onEdit(user: User):     void { this.router.navigate(['/admin/employes', user.id, 'edit']); }

  // --- SUPPRESSION ---
  onDelete(user: User): void {
    this.confirmationService.confirm({
      message:     'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      header:      'Confirmation',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.userService.delete(user.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé' });
            this.load();
          },
          error: () => this.errorService.showError('Impossible de supprimer l\'utilisateur'),
        });
      },
    });
  }

  // --- UTILITAIRES ---
  getRoleLabel(role: UserRole):     string              { return this.userService.getRoleLabel(role); }
  getSeverity(isActif: boolean):    'success' | 'danger' { return isActif ? 'success' : 'danger'; }
  getStatusLabel(isActif: boolean): string              { return isActif ? 'Actif' : 'Inactif'; }
}
