import { Intervention, InterventionService } from '../../core/services/intervention.service';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ContratService } from '../../core/services/contrat.service';
import { MessageService } from '../../core/services/message.service';
import { I18nService } from '../../core/services/I18n.service';
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
  readonly i18n = inject(I18nService);

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
      error: (error) => { if (!this.isUnauthorized(error)) this.messageService.showError(this.i18n.get('contrats.loadInterventionsError')); },
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
      this.messageService.showWarn(this.i18n.get('contrats.fillRequired'));
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
        this.messageService.showSuccess(
          this.interventionFormMode === 'create'
            ? this.i18n.get('contrats.interventionCreated')
            : this.i18n.get('contrats.interventionUpdated'),
        );
        this.editingIntervention = false;
        this.reloadInterventions.update((value) => value + 1);
      },
      error: () => this.messageService.showError(this.i18n.get('contrats.saveInterventionError')),
    });
  }

  onDeleteIntervention(intervention: Intervention): void {
    if (!confirm(this.i18n.format('contrats.deleteInterventionConfirm', { type: intervention.typeIntervention }))) return;
    this.interventionService.delete(intervention.id).subscribe({
      next: () => {
        this.messageService.showSuccess(this.i18n.get('contrats.interventionDeleted'));
        this.reloadInterventions.update((value) => value + 1);
      },
      error: () => this.messageService.showError(this.i18n.get('contrats.deleteInterventionError')),
    });
  }

  formatDate(date: string): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Date(date).toLocaleDateString(locale);
  }
  formatCurrency(amount: number): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  }

  private isUnauthorized(error: unknown): boolean {
    const err = error as { status?: number; cause?: { status?: number } };
    const status = err?.status ?? err?.cause?.status;
    return status === 401 || status === 403;
  }
}
