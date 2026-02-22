import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { Demande, DemandeService, DemandeStatus } from '../../../../core/services/demande.service';
import { User, UserService } from '../../../../core/services/user.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-demande-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonModule, SelectModule, CheckboxModule, InputNumberModule, ToastModule],
  providers: [PrimeMessageService],
  templateUrl: './demande-form.html',
  styleUrls: ['./demande-form.scss'],
})
export class DemandeFormDialogComponent {

  // --- DONNÉES ---
  loading  = signal(false);
  users    = signal<User[]>([]);
  isEdit   = false;
  demandeId: number | null = null;

  statusOptions = [
    { label: 'En cours',          value: DemandeStatus.Encours },
    { label: 'Attente Compagnie', value: DemandeStatus.AttenteComagnie },
    { label: 'Finalisation',      value: DemandeStatus.Finalisation },
    { label: 'Validé',            value: DemandeStatus.Valide },
    { label: 'Refusé',            value: DemandeStatus.Refuse },
  ];

  // --- FORMULAIRE ---
  private readonly fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    id:           [null],
    idUser:       [null, Validators.required],
    idVelo:       [null, Validators.required],
    status:       [DemandeStatus.Encours, Validators.required],
    discussionId: [null],
    isActif:      [true],
  });

  // --- SERVICES ---
  private readonly demandeService = inject(DemandeService);
  private readonly userService    = inject(UserService);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService   = inject(ErrorService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);

  // --- INIT ---
  constructor() {
    this.loadUsers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit    = true;
      this.demandeId = Number(id);
      this.loadDemande(this.demandeId);
    }
  }

  // --- CHARGEMENT ---
  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => this.users.set(data),
    });
  }

  loadDemande(id: number): void {
    this.loading.set(true);
    this.demandeService.getOne(id).subscribe({
      next: (d: any) => {
        this.form.patchValue({ ...d, isActif: d.isActif ?? true });
        this.loading.set(false);
      },
      error: () => {
        this.errorService.showError('Impossible de charger la demande');
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  // --- SOUMISSION ---
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const v = this.form.getRawValue();

    const payload: any = {
      idUser:       v.idUser,
      idVelo:       Number(v.idVelo),
      status:       Number(v.status),
      discussionId: v.discussionId ? Number(v.discussionId) : null,
    };
    if (this.isEdit && this.demandeId) payload.id = this.demandeId;

    const operation = this.isEdit
      ? this.demandeService.update(payload)
      : this.demandeService.create(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: this.isEdit ? 'Demande modifiée' : 'Demande créée' });
        this.loading.set(false);
        this.goBack();
      },
      error: () => this.loading.set(false),
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate([this.basePath()]); }

  private basePath(): string {
    return this.router.url.startsWith('/manager/') ? '/manager/demandes' : '/admin/demandes';
  }
}
