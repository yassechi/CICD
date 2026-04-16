import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/I18n.service';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class ManagerDashboardComponent {
  totalEmployes = signal(0);
  totalDemandes = signal(0);
  totalContrats = signal(0);
  demandesEnCours = signal(0);

  private readonly demandesStats = signal({
    enCours: 0,
    attente: 0,
    attenteCompagnie: 0,
    valide: 0,
  });
  private readonly contratsStats = signal({ enCours: 0, termine: 0 });

  readonly demandesChartData = computed(() => {
    const t = this.i18n.t();
    const stats = this.demandesStats();
    return {
      labels: [
        t.demandeStatus.encours,
        t.demandeStatus.attente,
        t.demandeStatus.attenteCompagnie,
        t.demandeStatus.valide,
      ],
      datasets: [
        {
          data: [stats.enCours, stats.attente, stats.attenteCompagnie, stats.valide],
          backgroundColor: ['#0F766E', '#F59E0B', '#F97316', '#84CC16'],
          hoverBackgroundColor: ['#0B5D56', '#D97706', '#EA580C', '#65A30D'],
        },
      ],
    };
  });

  readonly contratsChartData = computed(() => {
    const t = this.i18n.t();
    const stats = this.contratsStats();
    return {
      labels: [t.contratStatus.enCours, t.contratStatus.termine],
      datasets: [
        {
          data: [stats.enCours, stats.termine],
          backgroundColor: ['#0F766E', '#94A3B8'],
          hoverBackgroundColor: ['#0B5D56', '#64748B'],
        },
      ],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    layout: { padding: 8 },
    elements: { arc: { borderWidth: 2, borderColor: '#ffffff', hoverOffset: 8 } },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          color: '#334155',
          font: { family: 'Manrope', size: 12, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
        bodyFont: { family: 'Manrope', size: 12, weight: '600' },
        padding: 12,
        cornerRadius: 12,
      },
    },
  };

  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  readonly i18n = inject(I18nService);
  readonly currentUser = this.authService.getCurrentUser();

  constructor() {
    const user = this.currentUser;
    const orgId = user?.organisationId
      ? typeof user.organisationId === 'object'
        ? (user.organisationId as any).id
        : user.organisationId
      : null;
    if (!orgId) return;

    this.dashboardService.getManagerDashboard(orgId).subscribe({
      next: (data) => {
        this.totalEmployes.set(data.totalEmployes);
        this.totalDemandes.set(data.totalDemandes);
        this.totalContrats.set(data.totalContrats);
        this.demandesEnCours.set(data.demandesEnCours);

        this.demandesStats.set({
          enCours: data.demandesEnCours ?? 0,
          attente: data.demandesAttente ?? 0,
          attenteCompagnie: data.demandesAttenteCompagnie ?? 0,
          valide: data.demandesValide ?? 0,
        });

        this.contratsStats.set({
          enCours: data.contratsEnCours ?? 0,
          termine: data.contratsTermine ?? 0,
        });
      },
    });
  }
}
