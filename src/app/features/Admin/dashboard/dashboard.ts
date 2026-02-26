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
  stats = signal({ pendingDemandes: 0, activeContrats: 0, expiringContrats: 0 });
  activityFeed = signal<Array<{ title: string; detail: string; time: string }>>([]);
  demandeStatusChartData = signal<any>(null);
  contratStatusChartData = signal<any>(null);

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
          expiringContrats: data.expiringContrats,
        });
        this.activityFeed.set(data.activityFeed ?? []);
      },
    });

    this.demandeService.getList().subscribe({
      next: (demandes) => {
        const items = this.toArray<any>(demandes);
        const statuses = [
          DemandeStatus.Encours,
          DemandeStatus.AttenteComagnie,
          DemandeStatus.Finalisation,
          DemandeStatus.Valide,
          DemandeStatus.Refuse];
        this.demandeStatusChartData.set(
          this.buildDonut(
            statuses,
            (s) => this.demandeService.getStatusLabel(s),
            (s) => items.filter((d) => d.status === s).length,
            ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
          ),
        );
      },
    });

    this.contratService.getList().subscribe({
      next: (contrats) => {
        const items = this.toArray<any>(contrats);
        const statuses = [StatutContrat.EnCours, StatutContrat.Termine, StatutContrat.Resilie];
        this.contratStatusChartData.set(
          this.buildDonut(
            statuses,
            (s) => this.contratService.getStatutLabel(s),
            (s) => items.filter((c) => c.statutContrat === s).length,
            ['#bbf7d0', '#4ade80', '#16a34a'],
          ),
        );
      },
    });
  }

  private toArray<T>(data: any): T[] {
    return Array.isArray(data) ? data : data?.items ?? [];
  }

  private buildDonut<T>(
    statuses: T[],
    label: (s: T) => string,
    count: (s: T) => number,
    colors: string[],
  ): any {
    return {
      labels: statuses.map(label),
      datasets: [
        {
          data: statuses.map(count),
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
    };
  }
}
