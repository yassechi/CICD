import { DemandeService, DemandeStatus } from '../../../core/services/demande.service';
import { ContratService, StatutContrat } from '../../../core/services/contrat.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class AdminDashboardComponent {
  stats = signal({ pendingDemandes: 0, activeContrats: 0, budgetTotal: 0 });
  activityFeed = signal<Array<{ title: string; detail: string; time: string }>>([]);
  veloTypeChartData = signal<any>(null);
  demandeStatusChartData = signal<any>(null);
  contratStatusChartData = signal<any>(null);

  readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { family: 'Space Grotesk', size: 13, weight: '700' },
        bodyFont: { family: 'Manrope', size: 12, weight: '600' },
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B', font: { family: 'Manrope' } } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { family: 'Manrope', weight: '600' } } },
    },
  };

  readonly donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#475569', font: { family: 'Manrope', weight: '600' } },
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

  private readonly dashboardService = inject(DashboardService);
  private readonly demandeService = inject(DemandeService);
  private readonly contratService = inject(ContratService);

  constructor() {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        this.stats.set({
          pendingDemandes: data.pendingDemandes,
          activeContrats: data.activeContrats,
          budgetTotal: data.budgetTotal,
        });
        this.activityFeed.set(data.activityFeed ?? []);
        const counts = data.veloTypeCounts ?? [];
        this.veloTypeChartData.set({
          labels: counts.map((c: any) => c.label),
          datasets: [{ data: counts.map((c: any) => c.value), backgroundColor: '#0F766E', borderRadius: 8, barThickness: 18 }],
        });
      },
    });

    this.demandeService.getAll().subscribe({
      next: (demandes) => {
        const statuses = [DemandeStatus.Encours, DemandeStatus.AttenteComagnie, DemandeStatus.Finalisation, DemandeStatus.Valide, DemandeStatus.Refuse];
        this.demandeStatusChartData.set({
          labels: statuses.map((s) => this.demandeService.getStatusLabel(s)),
          datasets: [{ data: statuses.map((s) => demandes.filter((d) => d.status === s).length), backgroundColor: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'], borderColor: '#ffffff', borderWidth: 2 }],
        });
      },
    });

    this.contratService.getAll().subscribe({
      next: (contrats) => {
        const statuses = [StatutContrat.EnCours, StatutContrat.Termine, StatutContrat.Resilie];
        this.contratStatusChartData.set({
          labels: statuses.map((s) => this.contratService.getStatutLabel(s)),
          datasets: [{ data: statuses.map((s) => contrats.filter((c) => c.statutContrat === s).length), backgroundColor: ['#bbf7d0', '#4ade80', '#16a34a'], borderColor: '#ffffff', borderWidth: 2 }],
        });
      },
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
