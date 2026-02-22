import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContratService,
  AdminContratListItem,
  StatutContrat,
} from '../../../../core/services/contrat.service';
import { AuthService } from '../../../../core/services/auth.service';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-user-contrats',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [PrimeMessageService],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsUtilisateurComponent {
  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);

  readonly currentUser = toSignal(this.authService.currentUser, {
    initialValue: this.authService.getCurrentUser(),
  });
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  readonly loading = signal(false);
  readonly userContrats = signal<AdminContratListItem[]>([]);

  private readonly contratsErrorShown = signal(false);
  private readonly contratsEffect = effect((onCleanup) => {
    const userId = this.currentUserId();
    if (!userId) {
      this.userContrats.set([]);
      this.loading.set(false);
      this.contratsErrorShown.set(false);
      return;
    }

    this.loading.set(true);
    const sub = this.contratService.getList({ userId }).subscribe({
      next: (data) => {
        this.userContrats.set(data ?? []);
        this.loading.set(false);
        this.contratsErrorShown.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.contratsErrorShown()) {
          this.errorService.showError('Impossible de charger les contrats');
          this.contratsErrorShown.set(true);
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  getStatutLabel(statut: StatutContrat): string {
    return this.contratService.getStatutLabel(statut);
  }

  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (statut) {
      case StatutContrat.EnCours:
        return 'success';
      case StatutContrat.Termine:
        return 'secondary';
      case StatutContrat.Resilie:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}

