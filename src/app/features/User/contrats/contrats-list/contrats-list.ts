import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Contrat, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { MessageService } from '../../../../core/services/message.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-contrats',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule],
  templateUrl: './contrats-list.html',
  styleUrls: ['./contrats-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratsUtilisateurComponent {
  private readonly contratService = inject(ContratService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  readonly currentUser = this.authService.currentUser;
  readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  readonly loading = signal(false);
  readonly userContrats = signal<Contrat[]>([]);

  private readonly contratsErrorShown = signal(false);
  private readonly contratsEffect = effect((onCleanup) => {
    const userId = this.currentUserId();
    if (!userId) { this.userContrats.set([]); this.loading.set(false); this.contratsErrorShown.set(false); return; }

    this.loading.set(true);
    const sub = this.contratService.getList({ userId }).subscribe({
      next: (data) => { this.userContrats.set(data ?? []); this.loading.set(false); this.contratsErrorShown.set(false); },
      error: () => {
        this.loading.set(false);
        if (!this.contratsErrorShown()) { this.messageService.showError('Impossible de charger les contrats'); this.contratsErrorShown.set(true); }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  getStatutLabel(statut: StatutContrat): string { return this.contratService.getStatutLabel(statut); }
  getStatutSeverity(statut: StatutContrat): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    return statut === StatutContrat.EnCours ? 'success' : statut === StatutContrat.Termine ? 'secondary' : statut === StatutContrat.Resilie ? 'danger' : 'secondary';
  }
  formatDate(date: string): string { return new Date(date).toLocaleDateString('fr-FR'); }
  formatCurrency(amount: number): string { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount); }
}
