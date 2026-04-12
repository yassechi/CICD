import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-compagnie-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ConfirmDialogModule, TagModule],
  providers: [ConfirmationService],
  templateUrl: './compagnie-detail.html',
  styleUrls: ['./compagnie-detail.scss'],
})
export class CompagnieDetailComponent {
  organisation = signal<Organisation | null>(null);
  organisationId: number | null;

  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

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
        this.messageService.showError(this.i18n.get('compagnies.loadOneError'));
        this.goBack();
      },
    });
  }

  private loadLogo(organisationId: number): void {
    this.organisationService.getActiveLogo(organisationId).subscribe((logo) => {
      const current = this.organisation();
      if (current) {
        this.organisation.set({
          ...current,
          logoUrl: this.organisationService.buildLogoDataUrl(logo) ?? undefined,
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/compagnies']);
  }
  goEdit(): void {
    this.router.navigate(['/admin/compagnies', this.organisationId, 'edit']);
  }
  onDelete(): void {
    const id = this.organisationId;
    if (!id) return;
    const name = this.organisation()?.name || this.i18n.t().common.inconnu;
    this.confirmationService.confirm({
      message: this.i18n.format('compagnies.deleteConfirm', { name }),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () =>
        this.organisationService.delete(id).subscribe({
          next: () => {
            this.messageService.showSuccess(
              this.i18n.get('compagnies.deleteSuccess'),
              this.i18n.get('common.succes'),
            );
            this.goBack();
          },
          error: () => this.messageService.showError(this.i18n.get('compagnies.deleteError')),
        }),
    });
  }
}
