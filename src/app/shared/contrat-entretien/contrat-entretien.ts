import { Intervention, InterventionService } from '../../core/services/intervention.service';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ContratService } from '../../core/services/contrat.service';
import { MessageService } from '../../core/services/message.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { map } from 'rxjs';

@Component({
  selector: 'app-contrat-entretien',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TableModule, InputTextModule, TooltipModule, DatePicker, InputNumber],
  templateUrl: './contrat-entretien.html',
  styleUrls: ['./contrat-entretien.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratEntretienComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contratService = inject(ContratService);
  private readonly interventionService = inject(InterventionService);
  private readonly messageService = inject(MessageService);

  readonly contratId = toSignal((this.route.parent ?? this.route).paramMap.pipe(map((p) => Number(p.get('id')) || null)), { initialValue: null });
  readonly veloId = signal<number | null>(null);
  readonly interventions = signal<Intervention[]>([]);
  private readonly reloadInterventions = signal(0);

  private readonly loadContratEffect = effect((onCleanup) => {
    const id = this.contratId();
    if (!id) { this.veloId.set(null); this.interventions.set([]); return; }
    const sub = this.contratService.getDetail(id).subscribe({
      next: (contrat) => this.veloId.set(contrat.veloId ?? null),
      error: () => { this.veloId.set(null); this.interventions.set([]); },
    });
    onCleanup(() => sub.unsubscribe());
  });

  private readonly loadInterventionsEffect = effect((onCleanup) => {
    const veloId = this.veloId();
    this.reloadInterventions();
    if (!veloId) { this.interventions.set([]); return; }
    const sub = this.interventionService.getByVelo(veloId).subscribe({
      next: (data) => this.interventions.set(data ?? []),
      error: (error) => { if (!this.isUnauthorized(error)) this.messageService.showError('Impossible de charger les interventions'); },
    });
    onCleanup(() => sub.unsubscribe());
  });

  editingIntervention = false;
  interventionFormMode: 'create' | 'edit' = 'create';
  currentIntervention: Partial<Intervention> = {};
  interventionDate: Date | null = null;

  onAddIntervention(): void {
    const veloId = this.veloId();
    if (!veloId) return;
    this.interventionFormMode = 'create';
    this.editingIntervention = true;
    this.interventionDate = new Date();
    this.currentIntervention = { typeIntervention: '', description: '', cout: 0, veloId, isActif: true };
  }

  onEditIntervention(intervention: Intervention): void {
    this.interventionFormMode = 'edit';
    this.editingIntervention = true;
    this.currentIntervention = { ...intervention };
    this.interventionDate = new Date(intervention.dateIntervention);
  }

  onCancelInterventionEdit(): void {
    this.editingIntervention = false;
    this.currentIntervention = {};
    this.interventionDate = null;
  }

  onSaveIntervention(): void {
    const veloId = this.veloId();
    if (!veloId || !this.interventionDate || !this.currentIntervention.typeIntervention || !this.currentIntervention.description) {
      this.messageService.showWarn('Veuillez remplir tous les champs obligatoires', 'Attention');
      return;
    }

    const intervention: Intervention = {
      id: this.currentIntervention.id || 0,
      typeIntervention: this.currentIntervention.typeIntervention,
      description: this.currentIntervention.description,
      dateIntervention: this.interventionDate.toISOString().split('T')[0],
      cout: this.currentIntervention.cout || 0,
      veloId,
      isActif: true,
    };

    (this.interventionFormMode === 'create' ? this.interventionService.create(intervention) : this.interventionService.update(intervention)).subscribe({
      next: () => {
        this.messageService.showSuccess(this.interventionFormMode === 'create' ? 'Intervention cr??e' : 'Intervention modifi?e', 'Succ?s');
        this.editingIntervention = false;
        this.reloadInterventions.update((value) => value + 1);
      },
      error: () => this.messageService.showError("Impossible de sauvegarder l'intervention"),
    });
  }

  onDeleteIntervention(intervention: Intervention): void {
    if (!confirm(`Voulez-vous vraiment supprimer "${intervention.typeIntervention}" ?`)) return;
    this.interventionService.delete(intervention.id).subscribe({
      next: () => { this.messageService.showSuccess('Intervention supprim?e', 'Succ?s'); this.reloadInterventions.update((value) => value + 1); },
      error: () => this.messageService.showError("Impossible de supprimer l'intervention"),
    });
  }

  formatDate(date: string): string { return new Date(date).toLocaleDateString('fr-FR'); }
  formatCurrency(amount: number): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }

  private isUnauthorized(error: unknown): boolean {
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err?.status ?? err?.cause?.status;
    return status === 401 || status === 403;
  }
}
