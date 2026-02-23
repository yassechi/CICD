import { Contrat, ContratEditData, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '../../../../core/services/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-contrat-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Card, Button, InputText, Select, DatePicker, InputNumber, Toast],
  templateUrl: './contrat-edit.html',
  styleUrls: ['./contrat-edit.scss'],
})
export class ContratEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(MessageService);

  contratId: number | null = null;
  users: ContratEditData['users'] = [];
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

  readonly statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Termin?', value: StatutContrat.Termine },
    { label: 'R?sili?', value: StatutContrat.Resilie },
  ];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id')) || null;
    this.contratId = id;
    if (!id) { this.goBack(); return; }

    this.loading = true;
    this.contratService.getEditData(id).subscribe({
      next: (data) => {
        this.users = data.users ?? [];
        this.velos = data.velos ?? [];
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
        this.messageService.showError('Impossible de charger le contrat');
      },
    });
  }

  onSubmit(): void {
    if (this.contratForm.invalid) { this.messageService.showWarn('Veuillez remplir tous les champs obligatoires'); return; }

    const v = this.contratForm.getRawValue();
    if (!v.dateDebut || !v.dateFin || v.veloId === null || v.duree === null || v.loyerMensuelHT === null) {
      this.messageService.showError('Formulaire incomplet');
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

    this.contratService.update(contrat).subscribe({
      next: () => {
        this.messageService.showSuccess('Contrat modifi? avec succ?s');
        setTimeout(() => window.location.href = `/admin/contrats/${this.contratId}`, 1000);
      },
      error: () => this.messageService.showError('Impossible de modifier le contrat'),
    });
  }

  goBack(): void { this.router.navigate(['/admin/contrats', this.contratId ?? '']); }
}
