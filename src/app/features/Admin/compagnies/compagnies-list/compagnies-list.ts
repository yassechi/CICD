import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Component, computed, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-compagnies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule],
  providers: [ConfirmationService],
  templateUrl: './compagnies-list.html',
  styleUrls: ['./compagnies-list.scss'],
})
export class AdminCompagniesComponent {
  organisations = signal<Organisation[]>([]);
  loading = signal(false);
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private readonly organisationService = inject(OrganisationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly statusOptions = computed(() => [
    { label: this.i18n.t().common.tous, value: 'all' },
    { label: this.i18n.t().common.actif, value: 'active' },
    { label: this.i18n.t().common.inactif, value: 'inactive' },
  ]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.organisationService
      .getList({
        isActif: this.statusFilter === 'all' ? undefined : this.statusFilter === 'active',
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const organisations = data ?? [];
          this.organisations.set(organisations);
          this.loadLogos(organisations);
        },
        error: () => this.messageService.showError(this.i18n.get('compagnies.loadError')),
      });
  }

  private loadLogos(organisations: Organisation[]): void {
    organisations.forEach((org) => {
      this.organisationService.getActiveLogo(org.id).subscribe({
        next: (logo) => {
          const url = this.organisationService.buildLogoDataUrl(logo);
          const current = this.organisations();
          const target = current.find((item) => item.id === org.id);
          if (!target) return;
          target.logoUrl = url ?? undefined;
          this.organisations.set([...current]);
        },
        error: () => {},
      });
    });
  }

  onCreate(): void {
    this.router.navigate(['/admin/compagnies/new']);
  }
  onView(org: Organisation): void {
    this.router.navigate(['/admin/compagnies', org.id]);
  }

  onReactivate(org: Organisation): void {
    this.confirmationService.confirm({
      message: this.i18n.get('compagnies.reactivateConfirm'),
      header: this.i18n.get('common.confirmer'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.get('common.oui'),
      rejectLabel: this.i18n.get('common.non'),
      accept: () =>
        this.organisationService.update({ ...org, isActif: true }).subscribe({
          next: () => {
            this.messageService.showSuccess(
              this.i18n.get('compagnies.reactivateSuccess'),
              this.i18n.get('common.succes'),
            );
            this.load();
          },
          error: () => this.messageService.showError(this.i18n.get('compagnies.reactivateError')),
        }),
    });
  }
}
