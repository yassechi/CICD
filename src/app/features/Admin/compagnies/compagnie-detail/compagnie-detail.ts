import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { MessageService } from '../../../../core/services/message.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-compagnie-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './compagnie-detail.html',
  styleUrls: ['./compagnie-detail.scss'],
})
export class CompagnieDetailComponent {
  organisation = signal<Organisation | null>(null);
  organisationId: number | null;

  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    this.organisationId = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (!this.organisationId) {
      this.goBack();
      return;
    }
    this.organisationService.getOne(this.organisationId).subscribe({
      next: (data) => {
        this.organisation.set(data);
        this.loadLogo(this.organisationId!);
      },
      error: () => {
        this.messageService.showError('Impossible de charger la compagnie');
        this.goBack();
      },
    });
  }

  private loadLogo(organisationId: number): void {
    this.organisationService.getActiveLogo(organisationId).subscribe({
      next: (logo) => {
        const current = this.organisation();
        if (!current) return;
        const url = this.organisationService.buildLogoDataUrl(logo);
        this.organisation.set({ ...current, logoUrl: url ?? undefined });
      },
      error: () => {},
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/compagnies']);
  }
  goEdit(): void {
    this.router.navigate(['/admin/compagnies', this.organisationId, 'edit']);
  }
}
