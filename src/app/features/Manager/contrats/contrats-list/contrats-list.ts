import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService as PrimeMessageService, ConfirmationService } from 'primeng/api';

// Services
import { AdminContratListItem, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-manager-contrats',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule],
  providers: [PrimeMessageService, ConfirmationService],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
})
export class ManagerContratsComponent {

  // --- DONNÉES ---
  contrats = signal<AdminContratListItem[]>([]);
  loading  = signal(false);

  // --- SERVICES ---
  private readonly contratService      = inject(ContratService);
  private readonly authService         = inject(AuthService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly errorService        = inject(ErrorService);

  private readonly orgId: number | null = (() => {
    const user = this.authService.getCurrentUser();
    if (!user?.organisationId) return null;
    return typeof user.organisationId === 'object' ? (user.organisationId as any).id : user.organisationId;
  })();

  // --- INIT ---
  constructor() { this.load(); }

  // --- CHARGEMENT ---
  load(): void {
    if (!this.orgId) { this.contrats.set([]); return; }

    this.loading.set(true);
    this.contratService.getList({ organisationId: this.orgId }).subscribe({
      next:  (data) => { this.contrats.set(data); this.loading.set(false); },
      error: ()     => { this.errorService.showError('Impossible de charger les contrats'); this.loading.set(false); },
    });
  }

  // --- ACTIONS ---
  onDelete(contrat: AdminContratListItem): void {
    this.confirmationService.confirm({
      message:     `Êtes-vous sûr de vouloir supprimer le contrat "${contrat.ref}" ?`,
      header:      'Confirmation',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.contratService.delete(contrat.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Contrat supprimé' });
            this.load();
          },
          error: () => this.errorService.showError('Impossible de supprimer le contrat'),
        });
      },
    });
  }

  // --- UTILITAIRES ---
  getStatutLabel(s: StatutContrat): string { return this.contratService.getStatutLabel(s); }

  getStatutSeverity(s: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (s) {
      case StatutContrat.EnCours:  return 'success';
      case StatutContrat.Termine:  return 'secondary';
      case StatutContrat.Resilie:  return 'danger';
      default:                     return 'secondary';
    }
  }

  formatDate(date: string):     string { return new Date(date).toLocaleDateString('fr-FR'); }
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
