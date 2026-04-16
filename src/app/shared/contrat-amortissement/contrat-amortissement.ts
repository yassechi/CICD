import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  MoisAmortissementService,
  MoisAmortissement,
} from '../../core/services/mois-amortissement.service';
import { Amortissement, AmortissementService } from '../../core/services/amortissement.service';
import { MessageService } from '../../core/services/message.service';
import { ContratService } from '../../core/services/contrat.service';
import { I18nService } from '../../core/services/I18n.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contrat-amortissement',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TableModule, InputNumberModule, ButtonModule],
  templateUrl: './contrat-amortissement.html',
  styleUrls: ['./contrat-amortissement.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratAmortissementComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly moisService = inject(MoisAmortissementService);
  private readonly amortissementService = inject(AmortissementService);
  private readonly contratService = inject(ContratService);
  readonly i18n = inject(I18nService);
  private readonly sub = new Subscription();

  contratId: number | null = null;
  veloId: number | null = null;
  saving = false;

  moisEditable: MoisAmortissement[] = [];
  moisLoading = false;
  amortissement: Amortissement | null = null;

  ngOnInit(): void {
    const parent = this.route.parent ?? this.route;
    this.sub.add(
      parent.paramMap.subscribe((p) => {
        this.contratId = Number(p.get('id')) || null;
        if (!this.contratId) {
          this.reset();
          return;
        }
        this.loadMois(this.contratId);
        this.sub.add(
          this.contratService.getDetail(this.contratId).subscribe({
            next: (contrat) => {
              this.veloId = contrat.veloId ?? null;
              this.loadAmortissement(this.veloId);
            },
            error: () => {
              this.veloId = null;
              this.amortissement = null;

              //forcer Angular à rafraîchir l’écran
              this.cdr.markForCheck();
            },
          }),
        );
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get totalAmorti(): number {
    return this.moisEditable.reduce((s, m) => s + (m.montant ?? 0), 0);
  }
  get progression(): number {
    const a = this.amortissement;
    return !a || a.valeurInit === 0
      ? 0
      : Math.min(100, Math.round((this.totalAmorti / a.valeurInit) * 100));
  }

  private reset(): void {
    this.veloId = null;
    this.amortissement = null;
    this.moisEditable = [];
    this.moisLoading = false;
    this.cdr.markForCheck();
  }

  private loadMois(id: number): void {
    this.moisLoading = true;
    this.cdr.markForCheck();
    this.sub.add(
      this.moisService.getByContrat(id).subscribe({
        next: (data) => {
          this.moisEditable = (data ?? []).map((m) => ({ ...m }));
          this.moisLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.moisLoading = false;
          this.cdr.markForCheck();
          this.messageService.showError(this.i18n.get('amortissement.loadError'));
        },
      }),
    );
  }

  private loadAmortissement(veloId: number | null): void {
    if (!veloId) {
      this.amortissement = null;
      this.cdr.markForCheck();
      return;
    }
    this.sub.add(
      this.amortissementService.getByVelo(veloId).subscribe({
        next: (data) => {
          this.amortissement = data?.[0] ?? null;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
          this.messageService.showError(this.i18n.get('amortissement.loadError'));
        },
      }),
    );
  }

  onSave(): void {
    if (!this.moisEditable.length) return;
    this.saving = true;
    this.cdr.markForCheck();
    let completed = 0;
    let hasError = false;

    this.moisEditable.forEach((m) => {
      this.sub.add(
        this.moisService.update(m).subscribe({
          next: () => {
            completed++;
            if (completed === this.moisEditable.length && !hasError) {
              this.saving = false;
              this.cdr.markForCheck();
              this.messageService.showSuccess(this.i18n.get('amortissement.saveSuccess'));
            }
          },
          error: () => {
            hasError = true;
            this.saving = false;
            this.cdr.markForCheck();
            this.messageService.showError(this.i18n.get('amortissement.saveError'));
          },
        }),
      );
    });
  }

  formatCurrency(amount: number): string {
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
