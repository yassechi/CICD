import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, inject, signal } from '@angular/core';
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
  selector: 'app-employes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule, SelectModule, InputTextModule],
  providers: [ConfirmationService],
  templateUrl: './employes-list.html',
  styleUrls: ['./employes-list.scss'],
})
export class AdminEmployesComponent {
  users = signal<User[]>([]);
  loading = signal(false);

  searchTerm = '';
  roleFilter: UserRole | 'all' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  roleOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager', value: UserRole.Manager },
    { label: 'Utilisateur', value: UserRole.User }];

  statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Actif', value: 'active' },
    { label: 'Inactif', value: 'inactive' }];

  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.userService.getList({
      role: this.roleFilter === 'all' ? undefined : this.roleFilter,
      isActif: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
      search: this.searchTerm.trim() || undefined,
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (data) => this.users.set(data ?? []),
      error: () => this.messageService.showError('Impossible de charger les employ?s'),
    });
  }

  onCreate(): void { this.router.navigate(['/admin/employes/new']); }
  onView(user: User): void { this.router.navigate(['/admin/employes', user.id]); }
  onEdit(user: User): void { this.router.navigate(['/admin/employes', user.id, 'edit']); }

  onDelete(user: User): void {
    this.confirmationService.confirm({
      message: '?tes-vous s?r de vouloir supprimer cet utilisateur ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.userService.delete(user.id!).subscribe({
        next: () => { this.messageService.showSuccess('Utilisateur supprim?', 'Succ?s'); this.load(); },
        error: () => this.messageService.showError("Impossible de supprimer l'utilisateur"),
      }),
    });
  }

  getRoleLabel(role: UserRole): string { return this.userService.getRoleLabel(role); }
  getSeverity(isActif: boolean): 'success' | 'danger' { return isActif ? 'success' : 'danger'; }
  getStatusLabel(isActif: boolean): string { return isActif ? 'Actif' : 'Inactif'; }
}
