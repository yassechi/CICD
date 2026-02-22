import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// PrimeNG
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { Contrat, ContratEditData, ContratService, StatutContrat } from '../../../../core/services/contrat.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-contrat-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Card, Button, InputText, Select, DatePicker, InputNumber, Toast],
  providers: [PrimeMessageService],
  templateUrl: './contrat-edit.html',
  styleUrls: ['./contrat-edit.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratEditComponent {

  // --- SERVICES ---
  private readonly fb             = inject(FormBuilder);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly contratService = inject(ContratService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService   = inject(ErrorService);

  // --- FORMULAIRE ---
  readonly contratForm = this.fb.group({
    ref:            this.fb.nonNullable.control('',                    Validators.required),
    veloId:         this.fb.control<number | null>(null,               Validators.required),
    beneficiaireId: this.fb.nonNullable.control('',                    Validators.required),
    userRhId:       this.fb.nonNullable.control('',                    Validators.required),
    dateDebut:      this.fb.control<Date | null>(null,                 Validators.required),
    dateFin:        this.fb.control<Date | null>(null,                 Validators.required),
    duree:          this.fb.control<number | null>(null,               Validators.required),
    loyerMensuelHT: this.fb.control<number | null>(null,               Validators.required),
    statutContrat:  this.fb.nonNullable.control(StatutContrat.EnCours, Validators.required),
  });

  // --- DONNÉES ---
  // Récupère l'id depuis l'URL
  readonly contratId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || null)),
    { initialValue: null },
  );

  // Charge les données d'édition (contrat + users + vélos) en une seule requête
  readonly editData = signal<ContratEditData | null>(null);
  readonly contratData = computed(() => this.editData()?.contrat ?? null);
  readonly users       = computed(() => this.editData()?.users ?? []);
  readonly velos       = computed(() => this.editData()?.velos ?? []);
  readonly loading     = signal(false);

  readonly statutOptions = [
    { label: 'En cours', value: StatutContrat.EnCours },
    { label: 'Terminé',  value: StatutContrat.Termine },
    { label: 'Résilié',  value: StatutContrat.Resilie },
  ];

  // Remplit le formulaire quand les données arrivent
  private readonly formEffect = effect(() => {
    const contrat = this.contratData();
    if (!contrat) return;
    this.contratForm.patchValue({
      ...contrat,
      dateDebut: new Date(contrat.dateDebut),
      dateFin:   new Date(contrat.dateFin),
    });
  });

  // Charge les donnees d'edition (contrat + users + velos)
  private readonly errorShown  = signal(false);
  private readonly loadEffect = effect((onCleanup) => {
    const id = this.contratId();
    if (!id) {
      this.editData.set(null);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const sub = this.contratService.getEditData(id).subscribe({
      next: (data) => {
        this.editData.set(data);
        this.loading.set(false);
        this.errorShown.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (!this.errorShown()) {
          this.errorService.showError('Impossible de charger le contrat');
          this.errorShown.set(true);
        }
      },
    });
    onCleanup(() => sub.unsubscribe());
  });

  // --- SOUMISSION ---
  onSubmit(): void {
    if (this.contratForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    const v = this.contratForm.getRawValue();
    if (!v.dateDebut || !v.dateFin || v.veloId === null || v.duree === null || v.loyerMensuelHT === null) {
      this.errorService.showError('Formulaire incomplet');
      return;
    }

    const contrat: Contrat = {
      id:             this.contratId() ?? undefined,
      ref:            v.ref,
      veloId:         v.veloId,
      beneficiaireId: v.beneficiaireId,
      userRhId:       v.userRhId,
      dateDebut:      v.dateDebut.toISOString().split('T')[0],
      dateFin:        v.dateFin.toISOString().split('T')[0],
      duree:          v.duree,
      loyerMensuelHT: v.loyerMensuelHT,
      statutContrat:  v.statutContrat,
      isActif:        true,
    };

    this.contratService.update(contrat).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Contrat modifié avec succès' });
        // Redirige vers le détail après 1 seconde
        setTimeout(() => window.location.href = `/admin/contrats/${this.contratId()}`, 1000);
      },
      error: () => this.errorService.showError('Impossible de modifier le contrat'),
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate(['/admin/contrats', this.contratId()]); }
}
