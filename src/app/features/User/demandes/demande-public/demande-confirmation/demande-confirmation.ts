import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../../../core/services/I18n.service';
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
  readonly i18n = inject(I18nService);

  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParamMap;
    this.veloTitle = params.get('veloTitle') ?? '';
    const price = params.get('veloPrice');
    const demande = params.get('demandeId');
    this.veloPrice = price ? Number(price) : null;
    this.demandeId = demande ? Number(demande) : null;
  }

  goToDemandes(): void {
    this.router.navigate(['/user/demandes']);
  }
  goToCatalogue(): void {
    this.router.navigate(['/catalogue-velos']);
  }

  formatCurrency(amount?: number | null): string {
    if (amount == null || Number.isNaN(amount)) return '-';
    const locale = this.i18n.lang() === 'nl' ? 'nl-BE' : 'fr-BE';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
