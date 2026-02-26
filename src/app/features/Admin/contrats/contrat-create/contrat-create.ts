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
import { Component, inject } from '@angular/core';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-contrat-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    Button,
    InputText,
    Select,
    DatePicker,
    InputNumber],
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

  readonly statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Terminé', value: StatutContrat.Termine },
    { label: 'Résilié', value: StatutContrat.Resilie }];

  constructor() {
    this.loadCreateData();
  }

  onSubmit(): void {
    if (this.contratForm.invalid) {
      this.messageService.showWarn('Veuillez remplir tous les champs obligatoires');
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
      this.messageService.showError('Formulaire incomplet');
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
        this.messageService.showSuccess('Contrat créé avec succès');
        const newId = response?.id;
        if (newId) {
          setTimeout(() => (window.location.href = `/admin/contrats/${newId}`), 1000);
          return;
        }
        this.goBack();
      },
      error: (err) =>
        this.messageService.showError(
          err?.error?.message ?? err?.error?.Message ?? 'Impossible de créer le contrat',
        ),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/contrats']);
  }

  private loadCreateData(): void {
    this.loading = true;
    forkJoin({
      users: this.userService.getList({ isActif: true }),
      velos: this.veloService.getAll(),
    }).subscribe({
      next: ({ users, velos }) => {
        const usersList = (users ?? []) as ContratEditUser[];
        this.users = usersList;
        this.beneficiaires = usersList;
        this.responsablesRh = usersList;
        this.velos = (velos ?? []) as ContratEditVelo[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.showError('Impossible de charger les données');
      },
    });
  }

}
