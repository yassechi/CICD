import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-demande-confirmation',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './demande-confirmation.html',
  styleUrls: ['./demande-confirmation.scss'],
})
export class DemandeConfirmationComponent {
  veloTitle = '';
  veloPrice: number | null = null;
  demandeId: number | null = null;

  private readonly router = inject(Router);

  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    this.veloTitle = params.get('veloTitle') ?? '';
    const price = params.get('veloPrice');
    const demande = params.get('demandeId');
    this.veloPrice = price ? Number(price) : null;
    this.demandeId = demande ? Number(demande) : null;
  }

  goToDemandes(): void { this.router.navigate(['/user/demandes']); }
  goToCatalogue(): void { this.router.navigate(['/catalogue-velos']); }

  formatCurrency(amount?: number | null): string {
    return amount == null || Number.isNaN(amount) ? '-' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
