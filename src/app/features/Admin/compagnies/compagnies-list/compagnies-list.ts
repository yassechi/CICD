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
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-compagnies',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, TableModule, TagModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
    SelectModule, InputTextModule,
  ],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './compagnies-list.html',
  styleUrls: ['./compagnies-list.scss'],
})
export class AdminCompagniesComponent {

  // --- DONNÉES ---
  organisations = signal<Organisation[]>([]);
  loading       = signal(false);
  searchTerm    = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  statusOptions = [
    { label: 'Tous',    value: 'all' },
    { label: 'Actif',   value: 'active' },
    { label: 'Inactif', value: 'inactive' },
  ];

  // --- SERVICES ---
  private readonly organisationService = inject(OrganisationService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService        = inject(ErrorService);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() { this.load(); }

  // --- CHARGEMENT ---
  load(): void {
    const isActif = this.statusFilter === 'all' ? undefined : this.statusFilter === 'active';
    const search  = this.searchTerm.trim() || undefined;

    this.loading.set(true);
    this.organisationService
      .getList({ isActif, search })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (data) => this.organisations.set(data),
        error: ()     => this.errorService.showError('Impossible de charger les organisations'),
      });
  }

  // --- NAVIGATION ---
  onCreate():                void { this.router.navigate(['/admin/compagnies/new']); }
  onView(org: Organisation): void { this.router.navigate(['/admin/compagnies', org.id]); }
  onEdit(org: Organisation): void { this.router.navigate(['/admin/compagnies', org.id, 'edit']); }

  // --- SUPPRESSION ---
  onDelete(org: Organisation): void {
    this.confirmationService.confirm({
      message:     `Êtes-vous sûr de vouloir supprimer "${org.name}" ?`,
      header:      'Confirmation',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.organisationService.delete(org.id).subscribe({
          next:  () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Compagnie supprimée' });
            this.load();
          },
          error: () => this.errorService.showError('Impossible de supprimer la compagnie'),
        });
      },
    });
  }
}
