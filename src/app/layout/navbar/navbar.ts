import { Component, EventEmitter, Output, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ToolbarModule } from 'primeng/toolbar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule, AvatarModule, MenuModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  userMenuItems: MenuItem[] = [
    {
      label: 'Paramètres',
      icon: 'pi pi-cog',
      command: () => this.router.navigate([this.currentUser()?.role === 1 ? '/admin/parametres' : this.currentUser()?.role === 2 ? '/manager/parametres' : '/user/parametres']),
    },
    { separator: true },
    { label: 'Déconnexion', icon: 'pi pi-sign-out', command: () => this.authService.logout() }];

  onToggleSidebar(): void { this.toggleSidebar.emit(); }
}
