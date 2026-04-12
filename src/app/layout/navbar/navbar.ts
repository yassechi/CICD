// navbar.ts
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
// import { I18nService } from '../../core/i18n/i18n.service';
import { ToolbarModule } from 'primeng/toolbar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { I18nService } from '../../core/services/I18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ToolbarModule, ButtonModule, AvatarModule, MenuModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  get userMenuItems(): MenuItem[] {
    const t = this.i18n.t();
    return [
      {
        label: t.parametres.title,
        icon: 'pi pi-cog',
        command: () => {
          const role = this.currentUser()?.role;
          const path = role === 1 ? '/admin/parametres'
            : role === 2 ? '/manager/parametres'
            : '/user/parametres';
          this.router.navigate([path]);
        },
      },
      { separator: true },
      {
        label: t.auth.logout,
        icon: 'pi pi-sign-out',
        command: () => this.authService.logout()
      },
    ];
  }

  onToggleSidebar(): void { this.toggleSidebar.emit(); }
}
