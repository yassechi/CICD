import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// Services
import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-employe-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './employe-detail.html',
  styleUrls: ['./employe-detail.scss'],
})
export class EmployeDetailComponent {

  // --- DONNÉES ---
  user   = signal<User | null>(null);
  userId = signal<string | null>(null);

  // --- SERVICES ---
  private readonly userService  = inject(UserService);
  private readonly errorService = inject(ErrorService);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);

  // --- INIT ---
  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }

    this.userId.set(id);
    this.load(id);
  }

  // --- CHARGEMENT ---
  load(id: string): void {
    this.userService.getOne(id).subscribe({
      next:  (data) => this.user.set(data),
      error: ()     => {
        this.errorService.showError("Impossible de charger l'employé");
        this.goBack();
      },
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate([this.basePath()]); }
  goEdit(): void { this.router.navigate([`${this.basePath()}/${this.userId()}/edit`]); }

  // Détecte si on est dans admin ou manager
  private basePath(): string {
    return this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes';
  }

  // --- UTILITAIRES ---
  getRoleLabel(role: UserRole): string { return this.userService.getRoleLabel(role); }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case UserRole.Admin:   return 'danger';
      case UserRole.Manager: return 'warn';
      case UserRole.User:    return 'info';
      default:               return 'secondary';
    }
  }

  getOrganisationName(user: User): string {
    const org = user.organisationId;
    if (org && typeof org === 'object') return org.name || 'N/A';
    if (typeof org === 'number')        return String(org);
    return 'N/A';
  }
}
