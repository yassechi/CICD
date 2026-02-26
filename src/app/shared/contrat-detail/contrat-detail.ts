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
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet],
  templateUrl: './contrat-detail.html',
  styleUrls: ['./contrat-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sub = new Subscription();
  private readonly AuthService = inject(AuthService);

  contratId: number | null = null;
  contrat: Contrat | null = null;
  loading = false;
  role = signal<number | null>(null);

  tabs: Array<{ route: string; label: string; icon: string }> = [];

  ngOnInit(): void {
    this.role.set(this.AuthService.getCurrentUser()?.role!);

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
    const tabs = [
      { route: 'detail', label: 'Donnees du contrat', icon: 'pi pi-id-card' },
      { route: 'documents', label: 'Documents', icon: 'pi pi-file-pdf' },
      { route: 'entretien', label: 'Entretien', icon: 'pi pi-wrench' },
      { route: 'amortissement', label: 'Amortissement', icon: 'pi pi-chart-line' }];

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
          this.messageService.showError('Impossible de charger le contrat');
          this.router.navigate(['../'], { relativeTo: this.route });
        },
      }),
    );
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
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
