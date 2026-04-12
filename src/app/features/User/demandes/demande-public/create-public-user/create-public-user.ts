import { Organisation, OrganisationService } from '../../../../../core/services/organisation.service';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { UserService, UserRole } from '../../../../../core/services/user.service';
import { MessageService } from '../../../../../core/services/message.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { I18nService } from '../../../../../core/services/I18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Component, inject } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
@Component({
  selector: 'app-create-lamda-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, SelectModule],
  templateUrl: './create-public-user.html',
  styleUrls: ['./create-public-user.scss'],
})
export class CreateLamdaUserComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  readonly i18n = inject(I18nService);

  loading = false;
  loadingOrganisations = false;
  organisations: Organisation[] = [];
  organisationName = '';
  private preselectedOrganisationId: number | null = null;
  organisationLocked = false;

  form = this.fb.group({
    userName: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    organisationId: [null, [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  constructor() {
    localStorage.clear(); ////////////////////////////
    const params = this.route.snapshot.queryParams;
    this.preselectedOrganisationId = params['organisationId'] ? Number(params['organisationId']) : null;
    this.organisationName = params['organisationName'] || '';
    this.organisationLocked = !!this.preselectedOrganisationId || !!this.organisationName;

    this.loadingOrganisations = true;
    this.organisationService.getAll().subscribe({
      next: (data) => {
        this.organisations = (data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
        this.trySelectOrganisation();
        this.loadingOrganisations = false;
      },
      error: () => {
        this.loadingOrganisations = false;
        this.messageService.showError(this.i18n.get('auth.loadOrganisationsError'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.markFormGroupTouched(this.form); return; }
    this.loading = true;
    const values = this.form.getRawValue();
    const email = String(values.email ?? '').trim();
    const password = String(values.password ?? '');

    this.userService.create({
      userName: String(values.userName ?? '').trim(),
      firstName: String(values.firstName ?? '').trim(),
      lastName: String(values.lastName ?? '').trim(),
      email,
      phoneNumber: String(values.phoneNumber ?? '').trim(),
      password,
      confirmPassword: values.confirmPassword,
      role: UserRole.User,
      isActif: true,
      organisationId: Number(values.organisationId),
    }).subscribe({
      next: () => this.authService.login({ email, password }, { redirectToDashboard: false }).subscribe({
        next: (response) => this.ensureUserActive(response.id, values),
        error: () => {
          this.loading = false;
          this.messageService.showError(this.i18n.get('auth.accountCreatedButLoginFailed'));
        },
      }),
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message || (error instanceof Error && error.message ? error.message : this.i18n.get('auth.registerError'));
        this.messageService.showError(message);
      },
    });
  }

  private trySelectOrganisation(): void {
    if (!this.organisations.length) return;
    if (this.preselectedOrganisationId) {
      this.form.patchValue({ organisationId: this.preselectedOrganisationId });
      const selected = this.organisations.find((org) => org.id === this.preselectedOrganisationId);
      if (selected) {
        this.organisationName = selected.name;
      }
      return;
    }
    if (this.organisationName) {
      const selected = this.organisations.find((org) => org.name.toLowerCase() === this.organisationName.toLowerCase());
      if (selected) {
        this.form.patchValue({ organisationId: selected.id });
        this.preselectedOrganisationId = selected.id;
      }
    }
  }

  private findSelectedOrganisation(): Organisation | null {
    const orgId = this.form.get('organisationId')?.value;
    return orgId ? this.organisations.find((org) => org.id === Number(orgId)) ?? null : null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => formGroup.get(key)?.markAsTouched());
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    const passwordValue = password?.value;
    const confirmValue = confirmPassword?.value;
    if (!password || !confirmPassword) return null;
    if (!passwordValue && !confirmValue) {
      if (confirmPassword.errors?.['passwordMismatch']) {
        const { passwordMismatch, ...rest } = confirmPassword.errors;
        confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }
    if (passwordValue !== confirmValue) {
      confirmPassword.setErrors({ ...(confirmPassword.errors ?? {}), passwordMismatch: true });
      return { passwordMismatch: true };
    }
    if (confirmPassword.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...rest } = confirmPassword.errors;
      confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }

  private ensureUserActive(userId: string, values: any): void {
    this.userService.getOne(userId).subscribe({
      next: (user) => {
        if (user.isActif) { this.finishRegistration(values); return; }
        this.userService.update({
          id: user.id,
          firstName: user.firstName || values.firstName,
          lastName: user.lastName || values.lastName,
          userName: user.userName || values.userName,
          email: user.email || values.email,
          phoneNumber: user.phoneNumber || values.phoneNumber,
          role: UserRole.User,
          tailleCm: user.tailleCm ?? 177,
          isActif: true,
          organisationId: Number(user.organisationId ?? values.organisationId),
        }).subscribe({
          next: () => this.finishRegistration(values),
          error: () => {
            this.loading = false;
            this.messageService.showError(this.i18n.get('auth.accountCreatedButActivationFailed'));
          },
        });
      },
      error: () => this.finishRegistration(values),
    });
  }

  private finishRegistration(values: any): void {
    this.loading = false;
    this.messageService.showSuccess(this.i18n.get('auth.accountCreatedAndLogged'), this.i18n.get('common.succes'));
    const organisation = this.findSelectedOrganisation();
    const queryParams: Record<string, string> = {};
    if (values.firstName) queryParams['firstName'] = String(values.firstName).trim();
    if (values.lastName) queryParams['lastName'] = String(values.lastName).trim();
    if (organisation?.name || this.organisationName) queryParams['organisationName'] = organisation?.name ?? this.organisationName;
    const organisationId = organisation?.id ?? (values.organisationId ? Number(values.organisationId) : this.preselectedOrganisationId);
    if (organisationId) queryParams['organisationId'] = String(organisationId);
    this.router.navigate(['/choix-parcours'], { queryParams });
  }
}
