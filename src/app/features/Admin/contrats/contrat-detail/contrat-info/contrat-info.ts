import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Store
import { ContratDetailStore } from '../contrat-detail.store';

@Component({
  selector: 'app-contrat-detail-info',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './contrat-info.html',
  styleUrls: ['./contrat-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratDetailInfoComponent {

  // --- SERVICES ---
  private readonly router = inject(Router);
  private readonly store  = inject(ContratDetailStore);

  // --- DONNÉES ---
  // Lit le contrat depuis le store partagé avec contrat-page
  readonly contrat = computed(() => this.store.contrat());

  // --- NAVIGATION ---
  onEditContrat(): void {
    const id = this.contrat()?.id;
    if (id) this.router.navigate(['/admin/contrats/edit', id]);
  }

  // --- UTILITAIRES ---
  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '-';
  }

  formatCurrency(amount?: number): string {
    if (amount == null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
