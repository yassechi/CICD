import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { ContratDetail, ContratService, StatutContrat } from '../../../../../core/services/contrat.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { ContratDetailStore } from '../contrat-detail.store';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TooltipModule, ToastModule, TabsModule, RouterOutlet],
  providers: [PrimeMessageService, ContratDetailStore],
  templateUrl: './contrat-page.html',
  styleUrls: ['./contrat-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailComponent {

  // --- SERVICES ---
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly errorService  = inject(ErrorService);
  private readonly contratStore  = inject(ContratDetailStore);

  // --- DONNÉES ---
  // Récupère l'id depuis l'URL et le convertit en number
  readonly contratId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || null)),
    { initialValue: null },
  );

  readonly contrat = signal<ContratDetail | null>(null);
  readonly loading = signal(false);

  // Onglets de la page
  readonly tabs = [
    { route: 'detail',        label: 'Données du contrat', icon: 'pi pi-id-card' },
    { route: 'documents',     label: 'Documents',          icon: 'pi pi-file-pdf' },
    { route: 'entretien',     label: 'Entretien',          icon: 'pi pi-wrench' },
    { route: 'amortissement', label: 'Amortissement',      icon: 'pi pi-chart-line' },
  ];

  // Détecte l'onglet actif selon l'URL courante
  readonly activeTab = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.route.snapshot.firstChild?.routeConfig?.path ?? 'detail'),
      startWith(this.route.snapshot.firstChild?.routeConfig?.path ?? 'detail'),
    ),
    { initialValue: 'detail' },
  );

  private readonly errorShown = signal(false);
  private readonly loadEffect = effect((onCleanup) => {
    const id = this.contratId();
    if (!id) {
      this.contrat.set(null);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const sub = this.contratService.getDetail(id).subscribe({
      next: (data) => {
        this.contrat.set(data);
        this.loading.set(false);
        this.errorShown.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.errorShown()) {
          this.errorService.showError('Impossible de charger le contrat');
          this.errorShown.set(true);
          this.router.navigate(['/admin/contrats']);
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  // Synchronise le contrat dans le store pour les composants enfants
  private readonly storeEffect = effect(() => {
    this.contratStore.setContrat(this.contrat());
  });

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate(['/admin/contrats']); }

  onTabChange(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.router.navigate([value], { relativeTo: this.route });
    }
  }

  // --- UTILITAIRES ---
  getStatutLabel(statut: StatutContrat): string { return this.contratService.getStatutLabel(statut); }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:  return 'success';
      case StatutContrat.Resilie:  return 'danger';
      default:                     return 'secondary';
    }
  }
}
