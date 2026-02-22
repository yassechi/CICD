import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserRole } from '../../../core/services/user.service';
import {
  Organisation,
  OrganisationService,
} from '../../../core/services/organisation.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-create-lamda-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToastModule,
  ],
  providers: [PrimeMessageService],
  templateUrl: './create-lamda-user.html',
  styleUrls: ['./create-lamda-user.scss'],
})
export class CreateLamdaUserComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly organisationService = inject(OrganisationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(PrimeMessageService);
  private readonly errorService = inject(ErrorService);

  loading = false;
  loadingOrganisations = false;
  organisations: Organisation[] = [];
  organisationName = '';
  organisationLogoUrl: string | null = null;
  private preselectedOrganisationId: number | null = null;
  organisationLocked = false;

  form = this.fb.group(
    {
      userName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      organisationId: [null, [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const orgId = params['organisationId'];
      this.preselectedOrganisationId = orgId ? Number(orgId) : null;
      this.organisationName = params['organisationName'] || '';
      this.organisationLogoUrl = params['organisationLogoUrl'] || null;
      this.organisationLocked = !!this.preselectedOrganisationId || !!this.organisationName;
    });
    this.loadOrganisations();
  }

  loadOrganisations(): void {
    this.loadingOrganisations = true;
    this.organisationService.getAll().subscribe({
      next: (data) => {
        const organisations = data ?? [];
        this.organisations = organisations
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));
        this.trySelectOrganisation();
        this.loadingOrganisations = false;
      },
      error: () => {
        this.loadingOrganisations = false;
        this.errorService.showError('Impossible de charger les organisations');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading = true;
    const values = this.form.getRawValue();

    const email = String(values.email ?? '').trim();
    const password = String(values.password ?? '');

    const payload = {
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
    };

    this.userService.create(payload).subscribe({
      next: () => {
        this.authService.login({ email, password }).subscribe({
          next: (response) => {
            this.ensureUserActive(response.id, values);
          },
          error: () => {
            this.loading = false;
            this.errorService.showError('Compte cree, mais connexion impossible');
          },
        });
      },
      error: (error) => {
        this.loading = false;
        const message =
          error?.error?.message ||
          (error instanceof Error && error.message
            ? error.message
            : 'Impossible de creer le compte');
        this.errorService.showError(message);
      },
    });
  }

  private trySelectOrganisation(): void {
    if (!this.organisations.length) {
      return;
    }
    if (this.preselectedOrganisationId) {
      this.form.patchValue({ organisationId: this.preselectedOrganisationId });
      const selected = this.organisations.find(
        (org) => org.id === this.preselectedOrganisationId,
      );
      if (selected) {
        this.organisationName = selected.name;
        this.organisationLogoUrl = selected.logoUrl ?? this.organisationLogoUrl;
      }
      return;
    }
    if (this.organisationName) {
      const selected = this.organisations.find(
        (org) => org.name.toLowerCase() === this.organisationName.toLowerCase(),
      );
      if (selected) {
        this.form.patchValue({ organisationId: selected.id });
        this.preselectedOrganisationId = selected.id;
        this.organisationLogoUrl = selected.logoUrl ?? this.organisationLogoUrl;
      }
    }
  }

  private findSelectedOrganisation(): Organisation | null {
    const orgId = this.form.get('organisationId')?.value;
    if (!orgId) {
      return null;
    }
    return this.organisations.find((org) => org.id === Number(orgId)) ?? null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    const passwordValue = password?.value;
    const confirmValue = confirmPassword?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    if (!passwordValue && !confirmValue) {
      if (confirmPassword.errors?.['passwordMismatch']) {
        const { passwordMismatch, ...rest } = confirmPassword.errors;
        confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    if (passwordValue !== confirmValue) {
      confirmPassword.setErrors({
        ...(confirmPassword.errors ?? {}),
        passwordMismatch: true,
      });
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
        if (user.isActif) {
          this.finishRegistration(values);
          return;
        }
        const payload = {
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
        };
        this.userService.update(payload).subscribe({
          next: () => {
            this.finishRegistration(values);
          },
          error: () => {
            this.loading = false;
            this.errorService.showError(
              'Compte cree, mais activation impossible. Contactez un administrateur.',
            );
          },
        });
      },
      error: () => {
        this.finishRegistration(values);
      },
    });
  }

  private finishRegistration(values: any): void {
    this.loading = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Succes',
      detail: 'Compte cree et connecte',
    });
    const organisation = this.findSelectedOrganisation();
    const queryParams: Record<string, string> = {};
    if (values.firstName) {
      queryParams['firstName'] = String(values.firstName).trim();
    }
    if (values.lastName) {
      queryParams['lastName'] = String(values.lastName).trim();
    }
    if (organisation?.name || this.organisationName) {
      queryParams['organisationName'] = organisation?.name ?? this.organisationName;
    }
    const logoUrl = organisation?.logoUrl ?? this.organisationLogoUrl;
    if (logoUrl) {
      queryParams['organisationLogoUrl'] = logoUrl;
    }
    this.router.navigate(['/choix-parcours'], { queryParams });
  }
}


