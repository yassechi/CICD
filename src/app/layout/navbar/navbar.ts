import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

// PrimeNG
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

// Services
import { AuthService } from '../../core/services/auth.service';

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
  private readonly router      = inject(Router);

  readonly currentUser = toSignal(this.authService.currentUser, {
    initialValue: this.authService.getCurrentUser(),
  });

  userMenuItems: MenuItem[] = [
    {
      label: 'Paramètres',
      icon:  'pi pi-cog',
      command: () => {
        const role = this.currentUser()?.role;
        const path = role === 1 ? '/admin/parametres' : role === 2 ? '/manager/parametres' : '/user/parametres';
        this.router.navigate([path]);
      },
    },
    { separator: true },
    {
      label:   'Déconnexion',
      icon:    'pi pi-sign-out',
      command: () => this.authService.logout(),
    },
  ];

  onToggleSidebar(): void { this.toggleSidebar.emit(); }
}
