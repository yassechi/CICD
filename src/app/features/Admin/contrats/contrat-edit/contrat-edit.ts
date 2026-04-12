import {
  Contrat,
  ContratEditData,
  ContratService,
  StatutContrat,
} from '../../../../core/services/contrat.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '../../../../core/services/message.service';
import { UserService } from '../../../../core/services/user.service';
import { VeloService } from '../../../../core/services/velo.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, computed, inject } from '@angular/core';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-contrat-edit',
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
    InputNumber],
  templateUrl: './contrat-edit.html',
  styleUrls: ['./contrat-edit.scss'],
})
export class ContratEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly veloService = inject(VeloService);
  readonly i18n = inject(I18nService);

  contratId: number | null = null;
  isEdit = false;
  users: ContratEditData['users'] = [];
  beneficiaires: ContratEditData['users'] = [];
  responsablesRh: ContratEditData['users'] = [];
  velos: ContratEditData['velos'] = [];
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
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this.contratId = id;
    this.isEdit = !!id;

    if (this.isEdit && id) {
      this.loadEditData(id);
    } else {
      this.loadCreateData();
    }
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
      id: this.contratId ?? undefined,
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

    if (this.isEdit) {
      this.contratService.update(contrat).subscribe({
        next: () => {
          this.messageService.showSuccess(this.i18n.get('contrats.updateSuccess'));
          setTimeout(() => (window.location.href = `/admin/contrats/${this.contratId}`), 1000);
        },
        error: () => this.messageService.showError(this.i18n.get('contrats.updateError')),
      });
      return;
    }

    this.contratService.create(contrat).subscribe({
      next: (response) => {
        this.messageService.showSuccess(this.i18n.get('contrats.createSuccess'));
        const newId = response?.id;
        if (newId) {
          setTimeout(() => (window.location.href = `/admin/contrats/${newId}`), 1000);
        } else {
          this.goBack();
        }
      },
      error: () => this.messageService.showError(this.i18n.get('contrats.createError')),
    });
  }

  goBack(): void {
    if (this.isEdit && this.contratId) {
      this.router.navigate(['/admin/contrats', this.contratId]);
      return;
    }
    this.router.navigate(['/admin/contrats']);
  }

  private loadEditData(id: number): void {
    this.loading = true;
    this.contratService.getEditData(id).subscribe({
      next: (data) => {
        this.users = (data.users ?? []);
        this.beneficiaires = this.users;
        this.responsablesRh = this.users;
        this.velos = (data.velos ?? []);
        if (data.contrat) {
          this.contratForm.patchValue({
            ...data.contrat,
            dateDebut: new Date(data.contrat.dateDebut),
            dateFin: new Date(data.contrat.dateFin),
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.showError(this.i18n.get('contrats.loadOneError'));
      },
    });
  }

  private loadCreateData(): void {
    this.loading = true;
    forkJoin({
      users: this.userService.getList({ isActif: true }),
      velos: this.veloService.getAll(),
    }).subscribe({
      next: ({ users, velos }) => {
        const usersList = (users ?? []) as ContratEditData['users'];
        this.users = usersList;
        this.beneficiaires = usersList;
        this.responsablesRh = usersList;
        this.velos = (velos ?? []) as ContratEditData['velos'];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.showError(this.i18n.get('contrats.loadDataError'));
      },
    });
  }

}
