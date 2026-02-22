import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

// Services
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-compagnie-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './compagnie-detail.html',
  styleUrls: ['./compagnie-detail.scss'],
})
export class CompagnieDetailComponent {

  // --- DONNÉES ---
  organisation = signal<Organisation | null>(null);
  organisationId = signal<number | null>(null);

  // --- SERVICES ---
  private readonly organisationService = inject(OrganisationService);
  private readonly errorService        = inject(ErrorService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() {
    // Récupère l'id dans l'URL et charge la compagnie
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.goBack(); return; }

    this.organisationId.set(id);
    this.load(id);
  }

  // --- CHARGEMENT ---
  load(id: number): void {
    this.organisationService.getOne(id).subscribe({
      next:  (data) => this.organisation.set(data),
      error: ()     => {
        this.errorService.showError('Impossible de charger la compagnie');
        this.goBack();
      },
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate(['/admin/compagnies']); }
  goEdit(): void { this.router.navigate(['/admin/compagnies', this.organisationId(), 'edit']); }
}
