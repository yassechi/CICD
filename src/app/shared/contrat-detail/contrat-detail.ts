import { AuthService } from './../../core/services/auth.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Contrat, ContratService, StatutContrat } from '../../core/services/contrat.service';
import { MessageService } from '../../core/services/message.service';
import { I18nService } from '../../core/services/I18n.service';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  providers: [ConfirmationService],
  templateUrl: './contrat-detail.html',
  styleUrls: ['./contrat-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();
  private readonly AuthService = inject(AuthService);

  contratId: number | null = null;
  contrat: Contrat | null = null;
  loading = false;
  role = signal<number | null>(null);

  tabs: Array<{ route: string; label: string; icon: string }> = [];

  ngOnInit(): void {
    this.role.set(this.AuthService.getCurrentUser()?.role ?? null);

    this.tabs = this.buildTabs();
    this.sub.add(
      this.route.paramMap.subscribe((p) => {
        const rawId = p.get('id');
        const parsed = rawId ? Number(rawId) : NaN;
        if (!rawId || Number.isNaN(parsed)) {
          this.contratId = null;
          this.contrat = null;
          this.loading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/admin/contrats']);
          return;
        }
        this.contratId = parsed;
        this.load();
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private buildTabs(): Array<{ route: string; label: string; icon: string }> {
    const t = this.i18n.t();
    const tabs = [
      { route: 'detail', label: t.contrats.tabDetail, icon: 'pi pi-id-card' },
      { route: 'documents', label: t.contrats.tabDocuments, icon: 'pi pi-file-pdf' },
      { route: 'entretien', label: t.contrats.tabEntretien, icon: 'pi pi-wrench' },
      { route: 'amortissement', label: t.contrats.tabAmortissement, icon: 'pi pi-chart-line' },
    ];

    if (this.role() === 1) return tabs;
    if (this.role() === 2) {
      return tabs.filter((tab) => tab.route !== 'amortissement');
    }
    return [];
  }

  private load(): void {
    if (!this.contratId) {
      this.contrat = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.cdr.markForCheck(); /////////////
    this.sub.add(
      this.contratService.getDetail(this.contratId).subscribe({
        next: (data) => {
          this.contrat = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.messageService.showError(this.i18n.get('contrats.loadOneError'));
          this.router.navigate(['../'], { relativeTo: this.route });
        },
      }),
    );
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onDelete(): void {
    const id = this.contratId;
    if (!id) return;
    const ref = this.contrat?.ref || String(id);
    this.confirmationService.confirm({
      message: this.i18n.format('contrats.deleteConfirm', { ref }),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () =>
        this.contratService.delete(id).subscribe({
          next: () => {
            this.messageService.showSuccess(
              this.i18n.get('contrats.deleteSuccess'),
              this.i18n.get('common.succes'),
            );
            this.goBack();
          },
          error: () => this.messageService.showError(this.i18n.get('contrats.deleteError')),
        }),
    });
  }
  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }
  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'danger' {
    return statut === StatutContrat.EnCours
      ? 'success'
      : statut === StatutContrat.Resilie
        ? 'danger'
        : 'secondary';
  }
}
