import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ErrorService } from '../../../../../core/services/error.service';
import { MoisAmortissementService, MoisAmortissement } from '../../../../../core/services/mois-amortissement.service';
import { Amortissement, AmortissementService } from '../../../../../core/services/amortissement.service';
import { ContratDetailStore } from '../contrat-detail.store';

@Component({
  selector: 'app-contrat-amortissement',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TableModule, InputNumberModule, ButtonModule, ToastModule],
  providers: [PrimeMessageService],
  templateUrl: './contrat-amortissement.html',
  styleUrls: ['./contrat-amortissement.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratAmortissementComponent {
  private readonly store = inject(ContratDetailStore);
  private readonly errorService = inject(ErrorService);
  private readonly moisService = inject(MoisAmortissementService);
  private readonly amortissementService = inject(AmortissementService);
  private readonly messageService = inject(PrimeMessageService);

  readonly contratId = computed(() => this.store.contratId());
  readonly veloId = computed(() => this.store.veloId());
  readonly saving = signal(false);

  // Copie locale modifiable des mois
  readonly moisEditable = signal<MoisAmortissement[]>([]);

  readonly moisLoading = signal(false);
  readonly amortissement = signal<Amortissement | null>(null);

  readonly totalAmorti = computed(() =>
    this.moisEditable().reduce((sum, m) => sum + (m.montant ?? 0), 0)
  );

  readonly progression = computed(() => {
    const amort = this.amortissement();
    if (!amort || amort.valeurInit === 0) return 0;
    return Math.min(100, Math.round((this.totalAmorti() / amort.valeurInit) * 100));
  });

  private readonly loadMoisEffect = effect((onCleanup) => {
    const id = this.contratId();
    if (!id) {
      this.moisEditable.set([]);
      this.moisLoading.set(false);
      return;
    }

    this.moisLoading.set(true);
    const sub = this.moisService.getByContrat(id).subscribe({
      next: (data) => {
        this.moisEditable.set((data ?? []).map(m => ({ ...m })));
        this.moisLoading.set(false);
      },
      error: () => {
        this.moisLoading.set(false);
        this.errorService.showError("Impossible de charger l'amortissement");
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  private readonly loadAmortissementEffect = effect((onCleanup) => {
    const veloId = this.veloId();
    if (!veloId) {
      this.amortissement.set(null);
      return;
    }

    const sub = this.amortissementService.getByVelo(veloId).subscribe({
      next: (data) => {
        this.amortissement.set(data?.[0] ?? null);
      },
      error: () => {
        this.errorService.showError("Impossible de charger l'amortissement");
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  updateMontant(index: number, newValue: number): void {
    const current = [...this.moisEditable()];
    current[index] = { ...current[index], montant: newValue };
    this.moisEditable.set(current);
  }

  onSave(): void {
    this.saving.set(true);
    const mois = this.moisEditable();
    let completed = 0;
    let hasError = false;

    mois.forEach((m) => {
      this.moisService.update(m).subscribe({
        next: () => {
          completed++;
          if (completed === mois.length && !hasError) {
            this.saving.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Amortissement enregistré',
            });
          }
        },
        error: () => {
          hasError = true;
          this.saving.set(false);
          this.errorService.showError("Impossible d'enregistrer l'amortissement");
        },
      });
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
