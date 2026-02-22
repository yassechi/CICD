import { Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { catchError, filter, interval, merge, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

// Services
import { AuthService } from '../../core/services/auth.service';
import { MessageViewService } from '../../core/services/message-view.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, PanelMenuModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent {
  @Input() visible = true;

  menuItems              = signal<MenuItem[]>([]);
  private userRole       = 3;
  private unreadCount    = signal(0);
  private currentUser:   User | null = null;

  private readonly authService        = inject(AuthService);
  private readonly messageViewService = inject(MessageViewService);
  private readonly router             = inject(Router);
  private readonly destroyRef         = inject(DestroyRef);

  constructor() {
    // Réagit aux changements d'utilisateur
    this.authService.currentUser
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        this.userRole    = user?.role || 3;
        this.buildMenu();
        this.refreshBadge();
      });

    // Rafraîchit le badge toutes les 5s, au changement de page, et sur événement
    merge(
      interval(5000),
      this.messageViewService.refresh$,
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshBadge());
  }

  private buildMenu(): void {
    const badge = this.badgeProps();

    if (this.userRole === 1) {
      this.menuItems.set([
        { label: 'Dashboard',   icon: 'pi pi-home',     routerLink: ['/admin/dashboard'] },
        { label: 'Compagnies',  icon: 'pi pi-building', routerLink: ['/admin/compagnies'] },
        { label: 'Employés',    icon: 'pi pi-users',    routerLink: ['/admin/employes'] },
        { label: 'Contrats',    icon: 'pi pi-file',     routerLink: ['/admin/contrats'] },
        { label: 'Demandes',    icon: 'pi pi-inbox',    routerLink: ['/admin/demandes'],   ...badge },
        { label: 'Paramètres',  icon: 'pi pi-cog',      routerLink: ['/admin/parametres'] },
      ]);
    } else if (this.userRole === 2) {
      this.menuItems.set([
        { label: 'Dashboard',   icon: 'pi pi-home',  routerLink: ['/manager/dashboard'] },
        { label: 'Employés',    icon: 'pi pi-users', routerLink: ['/manager/employes'] },
        { label: 'Contrats',    icon: 'pi pi-file',  routerLink: ['/manager/contrats'] },
        { label: 'Demandes',    icon: 'pi pi-inbox', routerLink: ['/manager/demandes'],   ...badge },
        { label: 'Paramètres',  icon: 'pi pi-cog',   routerLink: ['/manager/parametres'] },
      ]);
    } else {
      this.menuItems.set([
        { label: 'Dashboard',      icon: 'pi pi-home',  routerLink: ['/user/dashboard'] },
        { label: 'Mes Contrats',   icon: 'pi pi-file',  routerLink: ['/user/contrats'] },
        { label: 'Mes Demandes',   icon: 'pi pi-inbox', routerLink: ['/user/demandes'],   ...badge },
        { label: 'Paramètres',     icon: 'pi pi-cog',   routerLink: ['/user/parametres'] },
      ]);
    }
  }

  private refreshBadge(): void {
    const user = this.currentUser;
    if (!user?.id) { this.unreadCount.set(0); this.buildMenu(); return; }

    this.messageViewService.getUnreadCount({
      userId: user.id, role: this.userRole, organisationId: this.resolveOrgId(user),
    }).pipe(catchError(() => of(0)), takeUntilDestroyed(this.destroyRef))
      .subscribe((n) => {
        this.unreadCount.set(Number.isFinite(n) ? Math.max(0, n) : 0);
        this.buildMenu();
      });
  }

  private badgeProps(): { badge?: string; badgeStyleClass?: string } {
    const n = this.unreadCount();
    return n > 0 ? { badge: String(n), badgeStyleClass: 'sidebar-badge' } : {};
  }

  private resolveOrgId(user: User): number | null {
    const org = user.organisationId;
    if (typeof org === 'number') return org;
    if (org && typeof org === 'object' && 'id' in org) return typeof org.id === 'number' ? org.id : null;
    return null;
  }
}
