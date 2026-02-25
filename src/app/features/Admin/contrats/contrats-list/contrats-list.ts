import { Contrat, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { VeloService } from '../../../../core/services/velo.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-contrats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule],
  providers: [ConfirmationService],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
})
export class AdminContratsComponent {
  contrats = signal<Contrat[]>([]);
  loading = signal(false);
  typeOptions = signal<Array<{ label: string; value: string | 'all' }>>([
    { label: 'Tous', value: 'all' }]);

  typeFilter: string | 'all' = 'all';
  endFilter: 'all' | 'soon' = 'all';
  incidentFilter: 'all' | 'with' = 'all';
  searchTerm = '';

  endOptions = [
    { label: 'Tous', value: 'all' },
    { label: '< 3 mois', value: 'soon' }];
  incidentOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Avec incidents', value: 'with' }];

  private readonly contratService = inject(ContratService);
  private readonly veloService = inject(VeloService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  constructor() {
    this.veloService.getTypes().subscribe({
      next: (types) =>
        this.typeOptions.set([
          { label: 'Tous', value: 'all' },
          ...types.map((v) => ({ label: v, value: v }))]),
      error: () => this.messageService.showError('Impossible de charger les types de velo'),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.contratService
      .getList({
        type: this.typeFilter === 'all' ? undefined : this.typeFilter,
        endingSoon: this.endFilter === 'soon' ? true : undefined,
        withIncidents: this.incidentFilter === 'with' ? true : undefined,
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.contrats.set(data ?? []),
        error: () => this.messageService.showError('Impossible de charger les contrats'),
      });
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) {
      this.messageService.showError('Contrat invalide');
      return;
    }
    this.router.navigate(['/admin/contrats', contrat.id]);
  }
  onCreateContrat(): void {
    this.router.navigate(['/admin/contrats/new']);
  }

  onTerminate(contrat: Contrat): void {
    if (!contrat.id) {
      this.messageService.showError('Contrat invalide');
      return;
    }
    this.confirmationService.confirm({
      message: `R?silier le contrat ${contrat.ref} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () =>
        this.contratService.getOne(contrat.id!).subscribe({
          next: (full) =>
            this.contratService
              .update({ ...full, statutContrat: StatutContrat.Resilie })
              .subscribe({
                next: () => {
                  this.messageService.showSuccess('Contrat r?sili?', 'Succ?s');
                  this.load();
                },
                error: () => this.messageService.showError('Impossible de r?silier le contrat'),
              }),
          error: () => this.messageService.showError('Impossible de charger le contrat'),
        }),
    });
  }

  exportContrats(): void {
    this.contratService
      .exportCsv({
        type: this.typeFilter === 'all' ? undefined : this.typeFilter,
        endingSoon: this.endFilter === 'soon' ? true : undefined,
        withIncidents: this.incidentFilter === 'with' ? true : undefined,
        search: this.searchTerm.trim() || undefined,
      })
      .subscribe({
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
        error: () => this.messageService.showError("Impossible d'exporter les contrats"),
      });
  }

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
