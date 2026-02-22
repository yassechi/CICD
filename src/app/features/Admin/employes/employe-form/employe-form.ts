import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

// Services
import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-employe-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, SelectModule, PasswordModule, ToastModule,
  ],
  providers: [PrimeMessageService],
  templateUrl: './employe-form.html',
  styleUrls: ['./employe-form.scss'],
})
export class EmployeFormDialogComponent {

  // --- DONNÉES ---
  loading       = signal(false);
  organisations = signal<Organisation[]>([]);
  isEdit        = false;
  userId: string | null = null;

  roleOptions = [
    { label: 'Administrateur', value: UserRole.Admin },
    { label: 'Manager',        value: UserRole.Manager },
    { label: 'Utilisateur',    value: UserRole.User },
  ];

  // --- FORMULAIRE ---
  private readonly fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    id:              [null],
    userName:        ['', Validators.required],
    firstName:       ['', Validators.required],
    lastName:        ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    phoneNumber:     ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    role:            [UserRole.User, Validators.required],
    isActif:         [true],
    organisationId:  [null, Validators.required],
    tailleCm:        [177],
  }, { validators: this.passwordMatchValidator });

  // --- SERVICES ---
  private readonly userService         = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly messageService      = inject(PrimeMessageService);
  private readonly errorService        = inject(ErrorService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);

  // --- INIT ---
  constructor() {
    this.loadOrganisations();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.userId = id;
      this.updatePasswordValidators();
      this.loadUser(id);
    }
  }

  // --- CHARGEMENT ---
  loadOrganisations(): void {
    this.organisationService.getAll().subscribe({
      next: (data) => this.organisations.set(data),
    });
  }

  loadUser(id: string): void {
    this.loading.set(true);
    this.userService.getOne(id).subscribe({
      next: (u: any) => {
        this.form.patchValue({
          ...u,
          organisationId: typeof u.organisationId === 'object' ? u.organisationId.id : u.organisationId,
          tailleCm: u.tailleCm || 177,
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorService.showError("Impossible de charger l'employé");
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
      id:             this.userId ?? v.id,
      userName:       v.userName,
      firstName:      v.firstName,
      lastName:       v.lastName,
      email:          v.email,
      phoneNumber:    v.phoneNumber,
      role:           Number(v.role),
      tailleCm:       Number(v.tailleCm),
      isActif:        Boolean(v.isActif),
      organisationId: Number(v.organisationId),
    };

    // Mot de passe seulement si renseigné
    if (v.password?.trim()) {
      payload.password        = v.password;
      payload.confirmPassword = v.confirmPassword ?? v.password;
    }

    const operation = this.isEdit
      ? this.userService.update(payload)
      : this.userService.create(payload);

    operation.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: this.isEdit ? 'Employé modifié' : 'Employé créé' });
        this.loading.set(false);
        this.goBack();
      },
      error: () => this.loading.set(false),
    });
  }

  // --- NAVIGATION ---
  goBack(): void { this.router.navigate([this.basePath()]); }

  private basePath(): string {
    return this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes';
  }

  // Mot de passe optionnel en mode édition
  private updatePasswordValidators(): void {
    this.form.get('password')?.setValidators([]);
    this.form.get('confirmPassword')?.setValidators([]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.get('confirmPassword')?.updateValueAndValidity();
  }

  // Vérifie que les 2 mots de passe sont identiques
  private passwordMatchValidator(form: FormGroup) {
    const pwd     = form.get('password')?.value;
    const confirm = form.get('confirmPassword');
    if (!pwd && !confirm?.value) return null;
    if (pwd !== confirm?.value) {
      confirm?.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
      return { passwordMismatch: true };
    }
    const { passwordMismatch, ...rest } = confirm?.errors ?? {};
    confirm?.setErrors(Object.keys(rest).length ? rest : null);
    return null;
  }
}
