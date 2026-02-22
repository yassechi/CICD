import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import {
  AdminContratListItem,
  ContratService,
  StatutContrat,
} from '../../../../core/services/contrat.service';
import { VeloService } from '../../../../core/services/velo.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-contrats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule,
    ProgressBarModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
})
export class AdminContratsComponent {
  // --- DONNÉES ---
  contrats = signal<AdminContratListItem[]>([]);
  loading = signal(false);
  typeOptions = signal<Array<{ label: string; value: string | 'all' }>>([
    { label: 'Tous', value: 'all' },
  ]);

  // Filtres
  typeFilter: string | 'all' = 'all';
  endFilter: 'all' | 'soon' = 'all';
  incidentFilter: 'all' | 'with' = 'all';
  searchTerm = '';

  endOptions = [
    { label: 'Tous', value: 'all' },
    { label: '< 3 mois', value: 'soon' },
  ];
  incidentOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Avec incidents', value: 'with' },
  ];

  // --- SERVICES ---
  private readonly contratService = inject(ContratService);
  private readonly veloService = inject(VeloService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  // --- INIT ---
  constructor() {
    this.loadTypeOptions();
    this.load();
  }

  // --- CHARGEMENT ---
  load(): void {
    const type = this.typeFilter === 'all' ? undefined : this.typeFilter;
    const endingSoon = this.endFilter === 'soon' ? true : undefined;
    const withIncidents = this.incidentFilter === 'with' ? true : undefined;
    const search = this.searchTerm.trim() || undefined;

    this.loading.set(true);
    this.contratService
      .getList({ type, endingSoon, withIncidents, search })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.contrats.set(data),
        error: () => this.errorService.showError('Impossible de charger les contrats'),
      });
  }

  // Charge les types de vélos pour le filtre (une seule fois)
  loadTypeOptions(): void {
    this.veloService.getTypes().subscribe({
      next: (types) =>
        this.typeOptions.set([
          { label: 'Tous', value: 'all' },
          ...types.map((v) => ({ label: v, value: v })),
        ]),
      error: () => this.errorService.showError('Impossible de charger les types de velo'),
    });
  }

  // --- NAVIGATION ---
  onViewDetail(contrat: AdminContratListItem): void {
    this.router.navigate(['/admin/contrats', contrat.id]);
  }
  onCreateContrat(): void {
    this.router.navigate(['/admin/contrats/new']);
  }

  // --- RÉSILIATION ---
  onTerminate(contrat: AdminContratListItem): void {
    this.confirmationService.confirm({
      message: `Résilier le contrat ${contrat.ref} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        // Charge le contrat complet puis met à jour le statut
        this.contratService.getOne(contrat.id).subscribe({
          next: (full) => {
            this.contratService
              .update({ ...full, statutContrat: StatutContrat.Resilie })
              .subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Contrat résilié',
                  });
                  this.load();
                },
                error: () => this.errorService.showError('Impossible de résilier le contrat'),
              });
          },
          error: () => this.errorService.showError('Impossible de charger le contrat'),
        });
      },
    });
  }

  // --- EXPORT ---
  exportContrats(): void {
    const type = this.typeFilter === 'all' ? undefined : this.typeFilter;
    const endingSoon = this.endFilter === 'soon' ? true : undefined;
    const withIncidents = this.incidentFilter === 'with' ? true : undefined;
    const search = this.searchTerm.trim() || undefined;

    this.contratService.exportCsv({ type, endingSoon, withIncidents, search }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'contrats-export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: () => this.errorService.showError("Impossible d'exporter les contrats"),
    });
  }

  // --- UTILITAIRES ---
  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
