import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule
  ],
  providers: [PrimeMessageService],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(PrimeMessageService);
  private errorService = inject(ErrorService);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  loading = signal(false);
  emailSent = signal(false);

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.loading = signal(false);
        this.emailSent.set(true);
        this.messageService.add({
          severity: 'success',
          summary: 'Email envoyé',
          detail: 'Si cet email existe, vous recevrez un lien de réinitialisation.'
        });
      },
      error: () => {
        this.loading = signal(false);
        this.errorService.showError('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  get email() {
    return this.forgotForm.get('email');
  }
}


