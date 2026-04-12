import { Contrat, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { VeloService } from '../../../../core/services/velo.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, effect, inject, signal } from '@angular/core';
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
  typeOptions = signal<Array<{ label: string; value: string | 'all' }>>([]);
  private rawTypes = signal<string[]>([]);

  typeFilter: string | 'all' = 'all';
  endFilter: 'all' | 'soon' = 'all';
  incidentFilter: 'all' | 'with' = 'all';
  searchTerm = '';

  get endOptions() {
    const t = this.i18n.t();
    return [
      { label: t.common.tous, value: 'all' },
      { label: t.contrats.endSoon, value: 'soon' },
    ];
  }
  get incidentOptions() {
    const t = this.i18n.t();
    return [
      { label: t.common.tous, value: 'all' },
      { label: t.contrats.avecIncidents, value: 'with' },
    ];
  }

  private readonly contratService = inject(ContratService);
  private readonly veloService = inject(VeloService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  constructor() {
    this.veloService.getTypes().subscribe({
      next: (types) => this.rawTypes.set(types ?? []),
      error: () => this.messageService.showError(this.i18n.get('contrats.loadTypesError')),
    });
    effect(() => {
      this.i18n.lang();
      const t = this.i18n.t();
      this.typeOptions.set([
        { label: t.common.tous, value: 'all' },
        ...this.rawTypes().map((v) => ({ label: v, value: v })),
      ]);
    }, { allowSignalWrites: true });
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
        error: () => this.messageService.showError(this.i18n.get('contrats.loadError')),
      });
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) {
      this.messageService.showError(this.i18n.get('contrats.invalid'));
      return;
    }
    this.router.navigate(['/admin/contrats', contrat.id]);
  }
  onCreateContrat(): void {
    this.router.navigate(['/admin/contrats/new']);
  }

  onTerminate(contrat: Contrat): void {
    if (!contrat.id) {
      this.messageService.showError(this.i18n.get('contrats.invalid'));
      return;
    }
    this.confirmationService.confirm({
      message: this.i18n.format('contrats.terminateConfirm', { ref: contrat.ref }),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () =>
        this.contratService.getOne(contrat.id!).subscribe({
          next: (full) =>
            this.contratService
              .update({ ...full, statutContrat: StatutContrat.Resilie })
              .subscribe({
                next: () => {
                  this.messageService.showSuccess(this.i18n.get('contrats.terminateSuccess'));
                  this.load();
                },
                error: () => this.messageService.showError(this.i18n.get('contrats.terminateError')),
              }),
          error: () => this.messageService.showError(this.i18n.get('contrats.loadOneError')),
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
        error: () => this.messageService.showError(this.i18n.get('contrats.exportError')),
      });
  }

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }
  formatDate(date: string): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Date(date).toLocaleDateString(locale);
  }
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
