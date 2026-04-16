import {
  Contrat,
  ContratEditUser,
  ContratEditVelo,
  ContratService,
  StatutContrat,
} from '../../../../core/services/contrat.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '../../../../core/services/message.service';
import { UserService } from '../../../../core/services/user.service';
import { VeloService } from '../../../../core/services/velo.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, computed, inject } from '@angular/core';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contrat-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    Button,
    TooltipModule,
    InputText,
    Select,
    DatePicker,
    InputNumber,
  ],
  templateUrl: './contrat-create.html',
  styleUrls: ['./contrat-create.scss'],
})
export class ContratCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly veloService = inject(VeloService);
  readonly i18n = inject(I18nService);

  users: ContratEditUser[] = [];
  beneficiaires: ContratEditUser[] = [];
  responsablesRh: ContratEditUser[] = [];
  velos: ContratEditVelo[] = [];
  loading = false;

  readonly contratForm = this.fb.group({
    ref: this.fb.nonNullable.control('', Validators.required),
    veloId: this.fb.control<number | null>(null, Validators.required),
    beneficiaireId: this.fb.nonNullable.control('', Validators.required),
    userRhId: this.fb.nonNullable.control('', Validators.required),
    dateDebut: this.fb.control<Date | null>(null, Validators.required),
    dateFin: this.fb.control<Date | null>(null, Validators.required),
    duree: this.fb.control<number | null>(null, Validators.required),
    loyerMensuelHT: this.fb.control<number | null>(null, Validators.required),
    statutContrat: this.fb.nonNullable.control(StatutContrat.EnCours, Validators.required),
  });

  readonly statutOptions = computed(() => [
    { label: this.i18n.t().contratStatus.enCours, value: StatutContrat.EnCours },
    { label: this.i18n.t().contratStatus.termine, value: StatutContrat.Termine },
    { label: this.i18n.t().contratStatus.resilie, value: StatutContrat.Resilie },
  ]);

  constructor() {
    this.loadCreateData();
  }

  onSubmit(): void {
    if (this.contratForm.invalid) {
      this.messageService.showWarn(this.i18n.get('contrats.fillRequired'));
      return;
    }

    const v = this.contratForm.getRawValue();
    if (
      !v.dateDebut ||
      !v.dateFin ||
      v.veloId === null ||
      v.duree === null ||
      v.loyerMensuelHT === null
    ) {
      this.messageService.showError(this.i18n.get('contrats.formIncomplete'));
      return;
    }

    const contrat: Contrat = {
      ref: v.ref,
      veloId: v.veloId,
      beneficiaireId: v.beneficiaireId,
      userRhId: v.userRhId,
      dateDebut: v.dateDebut.toISOString().split('T')[0],
      dateFin: v.dateFin.toISOString().split('T')[0],
      duree: v.duree,
      loyerMensuelHT: v.loyerMensuelHT,
      statutContrat: v.statutContrat,
      isActif: true,
    };

    this.contratService.create(contrat).subscribe({
      next: (response) => {
        this.messageService.showSuccess(this.i18n.get('contrats.createSuccess'));
        const newId = response?.id;
        if (newId) {
          setTimeout(() => (window.location.href = `/admin/contrats/${newId}`), 1000);
          return;
        }
        this.goBack();
      },
      error: (err) =>
        this.messageService.showError(
          err?.error?.message ?? err?.error?.Message ?? this.i18n.get('contrats.createError'),
        ),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/contrats']);
  }

  private loadCreateData(): void {
    this.loading = true;
    this.userService.getList({ isActif: true }).subscribe({
      next: (users) => {
        const usersList = (users ?? []) as ContratEditUser[];
        this.users = usersList;
        this.beneficiaires = usersList;
        this.responsablesRh = usersList;

        this.veloService.getAll().subscribe({
          next: (velos) => {
            this.velos = (velos ?? []) as ContratEditVelo[];
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.messageService.showError(this.i18n.get('contrats.loadDataError'));
          },
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.showError(this.i18n.get('contrats.loadDataError'));
      },
    });
  }
}
