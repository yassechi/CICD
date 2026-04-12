import { Component, Input, effect, inject, signal } from '@angular/core';
import { MessageApiService } from '../../core/services/message-api.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/I18n.service';
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
  private readonly i18n = inject(I18nService);

  constructor() {
    effect(
      () => {
        const user = this.authService.currentUser();
        this.i18n.lang();
        // dans l'effect ca déclanche un refresh du component
        // et donc il refais le sideBar
        this.messageApiService.refreshSignal();
        this.setMenu(user);

        // a chaque relance le this.refreshBadge(user);
        this.refreshBadge(user);
      },
      { allowSignalWrites: true },
    );
  }

  private setMenu(user: User | null): void {
    const badge = this.unreadCount() > 0 ? { badge: String(this.unreadCount()), badgeStyleClass: 'sidebar-badge' } : {};
    const role = user?.role ?? 3;
    const aiQueryParams = this.buildAiQueryParams(user);
    const aiRoute =
      role === 2 ? ['/manager/questionnaire-guide'] : role === 3 ? ['/user/questionnaire-guide'] : ['/questionnaire-guide'];
    const t = this.i18n.t();
    const aiMenuItem = {
      label: t.nav.assistantIa,
      icon: 'pi pi-sparkles',
      routerLink: aiRoute,
      queryParams: aiQueryParams,
    };
    this.menuItems.set(
      role === 1
        ? [
            { label: t.nav.dashboard, icon: 'pi pi-home', routerLink: ['/admin/dashboard'] },
            { label: t.nav.compagnies, icon: 'pi pi-building', routerLink: ['/admin/compagnies'] },
            { label: t.nav.employes, icon: 'pi pi-users', routerLink: ['/admin/employes'] },
            { label: t.nav.contrats, icon: 'pi pi-file', routerLink: ['/admin/contrats'] },
            { label: t.nav.demandes, icon: 'pi pi-inbox', routerLink: ['/admin/demandes'], ...badge },
            { label: t.nav.parametres, icon: 'pi pi-cog', routerLink: ['/admin/parametres'] }]
        : role === 2
        ? [
            { label: t.nav.dashboard, icon: 'pi pi-home', routerLink: ['/manager/dashboard'] },
            { label: t.nav.employes, icon: 'pi pi-users', routerLink: ['/manager/employes'] },
            { label: t.nav.contrats, icon: 'pi pi-file', routerLink: ['/manager/contrats'] },
            { label: t.nav.demandes, icon: 'pi pi-inbox', routerLink: ['/manager/demandes'], ...badge },
            aiMenuItem,
            { label: t.nav.parametres, icon: 'pi pi-cog', routerLink: ['/manager/parametres'] }]
        : [
            { label: t.nav.dashboard, icon: 'pi pi-home', routerLink: ['/user/dashboard'] },
            { label: t.nav.mesContrats, icon: 'pi pi-file', routerLink: ['/user/contrats'] },
            { label: t.nav.mesDemandes, icon: 'pi pi-inbox', routerLink: ['/user/demandes'], ...badge },
            aiMenuItem,
            { label: t.nav.parametres, icon: 'pi pi-cog', routerLink: ['/user/parametres'] }],
    );
  }

  private buildAiQueryParams(user: User | null): Record<string, string> {
    if (!user) return { entry: 'sidebar' };
    const params: Record<string, string> = { entry: 'sidebar' };
    if (user.firstName) params['firstName'] = user.firstName;
    if (user.lastName) params['lastName'] = user.lastName;
    if (typeof user.organisationId === 'number') {
      params['organisationId'] = String(user.organisationId);
      return params;
    }
    const org = user.organisationId;
    if (org?.id) params['organisationId'] = String(org.id);
    if (org?.name) params['organisationName'] = org.name;
    return params;
  }

  private refreshBadge(user: User | null): void {
    this.setMenu(user);
    if (!user?.id) {
      this.unreadCount.set(0);
      return;
    }
    const organisationId =
      typeof user.organisationId === 'number'
        ? user.organisationId
        : user.organisationId?.id ?? null;

    this.messageApiService
      .getUnreadCount({ userId: user.id, role: user.role, organisationId })
      .subscribe((n) => {
        this.unreadCount.set(Number(n) || 0);
        this.setMenu(user);
      });
  }
}
