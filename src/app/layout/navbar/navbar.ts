// navbar.ts
import { Component, EventEmitter, Output, effect, inject, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
// import { I18nService } from '../../core/i18n/i18n.service';
import { ToolbarModule } from 'primeng/toolbar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Menu, MenuModule } from 'primeng/menu';
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
  @ViewChild('menu') private menu?: Menu;

  readonly userMenuItems = signal<MenuItem[]>([]);

  constructor() {
    effect(
      () => {
        const t = this.i18n.t();
        this.userMenuItems.set([
          {
            label: t.parametres.title,
            icon: 'pi pi-cog',
            command: () => this.goToSettings(),
          },
          { separator: true },
          {
            label: t.auth.logout,
            icon: 'pi pi-sign-out',
            command: () => this.onLogout(),
          },
        ]);
      },
      { allowSignalWrites: true },
    );
  }

  private goToSettings(): void {
    const role = this.currentUser()?.role;
    const path =
      role === 1 ? '/admin/parametres' : role === 2 ? '/manager/parametres' : '/user/parametres';
    this.menu?.hide();
    this.router.navigateByUrl(path);
  }

  private onLogout(): void {
    this.menu?.hide();
    this.authService.logout();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
