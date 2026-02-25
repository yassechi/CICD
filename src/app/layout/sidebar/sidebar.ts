import { Component, DestroyRef, Input, effect, inject, signal } from '@angular/core';
import { MessageApiService } from '../../core/services/message-api.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, interval, merge, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PanelMenuModule } from 'primeng/panelmenu';
import { User } from '../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, PanelMenuModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent {
  @Input() visible = true;

  menuItems = signal<MenuItem[]>([]);
  private unreadCount = signal(0);

  private readonly authService = inject(AuthService);
  private readonly messageApiService = inject(MessageApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(
      () => {
        const user = this.authService.currentUser();
        this.setMenu(user);
        this.refreshBadge(user);
      },
      { allowSignalWrites: true },
    );

    merge(
      interval(5000),
      this.messageApiService.refresh$,
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshBadge(this.authService.currentUser()));
  }

  private setMenu(user: User | null): void {
    const badge = this.unreadCount() > 0 ? { badge: String(this.unreadCount()), badgeStyleClass: 'sidebar-badge' } : {};
    const role = user?.role ?? 3;
    this.menuItems.set(
      role === 1
        ? [
            { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/admin/dashboard'] },
            { label: 'Compagnies', icon: 'pi pi-building', routerLink: ['/admin/compagnies'] },
            { label: 'Employés', icon: 'pi pi-users', routerLink: ['/admin/employes'] },
            { label: 'Contrats', icon: 'pi pi-file', routerLink: ['/admin/contrats'] },
            { label: 'Demandes', icon: 'pi pi-inbox', routerLink: ['/admin/demandes'], ...badge },
            { label: 'Paramètres', icon: 'pi pi-cog', routerLink: ['/admin/parametres'] }]
        : role === 2
        ? [
            { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/manager/dashboard'] },
            { label: 'Employés', icon: 'pi pi-users', routerLink: ['/manager/employes'] },
            { label: 'Contrats', icon: 'pi pi-file', routerLink: ['/manager/contrats'] },
            { label: 'Demandes', icon: 'pi pi-inbox', routerLink: ['/manager/demandes'], ...badge },
            { label: 'Paramètres', icon: 'pi pi-cog', routerLink: ['/manager/parametres'] }]
        : [
            { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/user/dashboard'] },
            { label: 'Mes Contrats', icon: 'pi pi-file', routerLink: ['/user/contrats'] },
            { label: 'Mes Demandes', icon: 'pi pi-inbox', routerLink: ['/user/demandes'], ...badge },
            { label: 'Paramètres', icon: 'pi pi-cog', routerLink: ['/user/parametres'] }],
    );
  }

  private refreshBadge(user: User | null): void {
    if (!user?.id) { this.unreadCount.set(0); this.setMenu(user); return; }
    const org = user.organisationId;
    const organisationId = typeof org === 'number' ? org : org && typeof org === 'object' && 'id' in org ? (typeof org.id === 'number' ? org.id : null) : null;

    this.messageApiService.getUnreadCount({ userId: user.id, role: user.role, organisationId })
      .pipe(catchError(() => of(0)), takeUntilDestroyed(this.destroyRef))
      .subscribe((n) => { this.unreadCount.set(Number.isFinite(n) ? Math.max(0, n) : 0); this.setMenu(user); });
  }
}
