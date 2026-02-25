import { Contrat, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manager-contrats',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, TagModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
})
export class ManagerContratsComponent {
  contrats = signal<Contrat[]>([]);
  loading = signal(false);

  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  private readonly orgId: number | null = (() => {
    const user = this.authService.getCurrentUser();
    if (!user?.organisationId) return null;
    return typeof user.organisationId === 'object' ? (user.organisationId as any).id : user.organisationId;
  })();

  constructor() {
    if (!this.orgId) { this.contrats.set([]); return; }
    this.loading.set(true);
    this.contratService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => { this.contrats.set(data ?? []); this.loading.set(false); },
      error: () => { this.messageService.showError('Impossible de charger les contrats'); this.loading.set(false); },
    });
  }

  onDelete(contrat: Contrat): void {
    if (!contrat.id) { this.messageService.showError('Contrat invalide'); return; }
    this.confirmationService.confirm({
      message: `?tes-vous s?r de vouloir supprimer le contrat "${contrat.ref}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.contratService.delete(contrat.id!).subscribe({
        next: () => { this.messageService.showSuccess('Contrat supprim?', 'Succ?s'); this.load(); },
        error: () => this.messageService.showError('Impossible de supprimer le contrat'),
      }),
    });
  }

  onViewDetail(contrat: Contrat): void {
    if (!contrat.id) { this.messageService.showError('Contrat invalide'); return; }
    this.router.navigate(['/manager/contrats', contrat.id]);
  }

  load(): void {
    if (!this.orgId) { this.contrats.set([]); return; }
    this.loading.set(true);
    this.contratService.getList({ organisationId: this.orgId }).subscribe({
      next: (data) => { this.contrats.set(data ?? []); this.loading.set(false); },
      error: () => { this.messageService.showError('Impossible de charger les contrats'); this.loading.set(false); },
    });
  }

  getStatutLabel(s: StatutContrat): string { return this.contratService.getStatutLabel(s); }
  getStatutSeverity(s: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return s === StatutContrat.EnCours ? 'success' : s === StatutContrat.Termine ? 'secondary' : s === StatutContrat.Resilie ? 'danger' : 'secondary';
  }
  formatDate(date: string): string { return new Date(date).toLocaleDateString('fr-FR'); }
  formatCurrency(amount: number): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }
}
