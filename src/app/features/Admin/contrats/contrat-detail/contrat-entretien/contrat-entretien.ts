import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { Intervention, InterventionService } from '../../../../../core/services/intervention.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { ContratDetailStore } from '../contrat-detail.store';

@Component({
  selector: 'app-contrat-entretien',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TableModule, InputTextModule, TooltipModule, DatePicker, InputNumber],
  templateUrl: './contrat-entretien.html',
  styleUrls: ['./contrat-entretien.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratEntretienComponent {

  // --- SERVICES ---
  private readonly interventionService = inject(InterventionService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly errorService        = inject(ErrorService);
  private readonly store               = inject(ContratDetailStore);

  // --- DONNÉES ---
  readonly veloId = computed(() => this.store.veloId());

  readonly interventions = signal<Intervention[]>([]);
  private readonly reloadInterventions = signal(0);

  private readonly loadInterventionsEffect = effect((onCleanup) => {
    const veloId = this.veloId();
    this.reloadInterventions();
    if (!veloId) {
      this.interventions.set([]);
      return;
    }

    const sub = this.interventionService.getByVelo(veloId).subscribe({
      next: (data) => {
        this.interventions.set(data ?? []);
      },
      error: (error) => {
        if (!this.isUnauthorized(error)) {
          this.errorService.showError('Impossible de charger les interventions');
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  // Ã‰tat du formulaire inline d'ajout/Ã©dition
  editingIntervention                        = false;
  interventionFormMode: 'create' | 'edit'    = 'create';
  currentIntervention: Partial<Intervention> = {};
  interventionDate: Date | null              = null;

  // --- FORMULAIRE INLINE ---
  onAddIntervention(): void {
    const veloId = this.veloId();
    if (!veloId) return;

    this.interventionFormMode   = 'create';
    this.editingIntervention    = true;
    this.interventionDate       = new Date();
    this.currentIntervention    = { typeIntervention: '', description: '', cout: 0, veloId, isActif: true };
  }

  onEditIntervention(intervention: Intervention): void {
    this.interventionFormMode = 'edit';
    this.editingIntervention  = true;
    this.currentIntervention  = { ...intervention };
    this.interventionDate     = new Date(intervention.dateIntervention);
  }

  onCancelInterventionEdit(): void {
    this.editingIntervention = false;
    this.currentIntervention = {};
    this.interventionDate    = null;
  }

  onSaveIntervention(): void {
    const veloId = this.veloId();
    if (!veloId || !this.interventionDate || !this.currentIntervention.typeIntervention || !this.currentIntervention.description) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    const intervention: Intervention = {
      id:               this.currentIntervention.id || 0,
      typeIntervention: this.currentIntervention.typeIntervention,
      description:      this.currentIntervention.description,
      dateIntervention: this.interventionDate.toISOString().split('T')[0],
      cout:             this.currentIntervention.cout || 0,
      veloId,
      isActif:          true,
    };

    const operation = this.interventionFormMode === 'create'
      ? this.interventionService.create(intervention)
      : this.interventionService.update(intervention);

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: this.interventionFormMode === 'create' ? 'Intervention créée' : 'Intervention modifiée' });
        this.editingIntervention = false;
        this.reloadInterventions.update((value) => value + 1);
      },
      error: () => this.errorService.showError("Impossible de sauvegarder l'intervention"),
    });
  }

  onDeleteIntervention(intervention: Intervention): void {
    if (!confirm(`Voulez-vous vraiment supprimer "${intervention.typeIntervention}" ?`)) return;

    this.interventionService.delete(intervention.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Intervention supprimée' });
        this.reloadInterventions.update((value) => value + 1);
      },
      error: () => this.errorService.showError("Impossible de supprimer l'intervention"),
    });
  }

  // --- UTILITAIRES ---
  formatDate(date: string):     string { return new Date(date).toLocaleDateString('fr-FR'); }
  formatCurrency(amount: number): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }

  private isUnauthorized(error: unknown): boolean {
    const err    = error as { status?: number; cause?: { status?: number } };
    const status = err?.status ?? err?.cause?.status;
    return status === 401 || status === 403;
  }
}
