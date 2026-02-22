import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-demande-confirmation',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './demande-confirmation.html',
  styleUrls: ['./demande-confirmation.scss'],
})
export class DemandeConfirmationComponent {

  // --- DONNÉES ---
  veloTitle: string      = '';
  veloPrice: number | null = null;
  demandeId: number | null = null;

  // --- SERVICES ---
  private readonly router = inject(Router);

  // --- INIT ---
  constructor() {
    const params  = inject(ActivatedRoute).snapshot.queryParamMap;
    this.veloTitle = params.get('veloTitle') ?? '';
    const price    = params.get('veloPrice');
    const demande  = params.get('demandeId');
    this.veloPrice = price   ? Number(price)   : null;
    this.demandeId = demande ? Number(demande) : null;
  }

  // --- NAVIGATION ---
  goToDemandes(): void { this.router.navigate(['/user/demandes']); }
  goToCatalogue(): void { this.router.navigate(['/catalogue-velos']); }

  // --- UTILITAIRES ---
  formatCurrency(amount?: number | null): string {
    if (amount == null || Number.isNaN(amount)) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
