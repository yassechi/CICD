import { Organisation, OrganisationService } from '../../../../core/services/organisation.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User, UserRole, UserService } from '../../../../core/services/user.service';
import { MessageService } from '../../../../core/services/message.service';
import { I18nService } from '../../../../core/services/I18n.service';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-employe-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, SelectModule, PasswordModule],
  templateUrl: './employe-form.html',
  styleUrls: ['./employe-form.scss'],
})
export class EmployeFormDialogComponent {
  loading = signal(false);
  organisations = signal<Organisation[]>([]);
  isEdit = false;
  userId: string | null = null;

  private readonly fb = inject(FormBuilder);
  form: FormGroup = this.fb.group({
    id: [null],
    userName: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    role: [UserRole.User, Validators.required],
    isActif: [true],
    organisationId: [null, Validators.required],
    tailleCm: [177],
  }, { validators: this.passwordMatchValidator });

  private readonly userService = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly roleOptions = computed(() => [
    { label: this.i18n.t().employes.admin, value: UserRole.Admin },
    { label: this.i18n.t().employes.manager, value: UserRole.Manager },
    { label: this.i18n.t().employes.utilisateur, value: UserRole.User },
  ]);

  constructor() {
    this.organisationService.getAll().subscribe({ next: (data) => this.organisations.set(data ?? []) });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEdit = true;
    this.userId = id;
    this.form.get('password')?.setValidators([]);
    this.form.get('confirmPassword')?.setValidators([]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.get('confirmPassword')?.updateValueAndValidity();

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
        this.messageService.showError(this.i18n.get('employes.loadOneError'));
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const v = this.form.getRawValue();
    const payload: any = {
      id: this.userId ?? v.id,
      userName: v.userName,
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phoneNumber: v.phoneNumber,
      role: Number(v.role),
      tailleCm: Number(v.tailleCm),
      isActif: Boolean(v.isActif),
      organisationId: Number(v.organisationId),
    };

    if (v.password?.trim()) {
      payload.password = v.password;
      payload.confirmPassword = v.confirmPassword ?? v.password;
    }

    (this.isEdit ? this.userService.update(payload) : this.userService.create(payload)).subscribe({
      next: () => {
        this.messageService.showSuccess(
          this.isEdit ? this.i18n.get('employes.updateSuccess') : this.i18n.get('employes.createSuccess'),
          this.i18n.get('common.succes'),
        );
        this.loading.set(false);
        this.goBack();
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void { this.router.navigate([this.router.url.startsWith('/manager/') ? '/manager/employes' : '/admin/employes']); }

  private passwordMatchValidator(form: FormGroup) {
    const pwd = form.get('password')?.value;
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
