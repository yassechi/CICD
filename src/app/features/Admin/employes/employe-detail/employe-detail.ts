import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-employe-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './employe-detail.html',
  styleUrls: ['./employe-detail.scss'],
})
export class EmployeDetailComponent {
  user = signal<User | null>(null);
  userId = signal<string | null>(null);

  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }
    this.userId.set(id);
    this.userService.getOne(id).subscribe({
      next: (data) => this.user.set(data),
      error: () => { this.messageService.showError("Impossible de charger l'employ?"); this.goBack(); },
    });
  }

  goBack(): void { this.router.navigate([this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes']); }
  goEdit(): void { this.router.navigate([`${this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes'}/${this.userId()}/edit`]); }

  getRoleLabel(role: UserRole): string { return this.userService.getRoleLabel(role); }
  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return role === UserRole.Admin ? 'danger' : role === UserRole.Manager ? 'warn' : role === UserRole.User ? 'info' : 'secondary';
  }
  getOrganisationName(user: User): string {
    const org = user.organisationId;
    return org && typeof org === 'object' ? org.name || 'N/A' : typeof org === 'number' ? String(org) : 'N/A';
  }
}
