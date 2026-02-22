import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user-choix-parcours',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './choix-parcours.html',
  styleUrls: ['./choix-parcours.scss'],
})
export class ChoixParcoursUtilisateurComponent {

  // --- DONNÉES ---
  firstName:           string = '';
  lastName:            string = '';
  organisationName:    string = '';
  organisationLogoUrl: string | null = null;

  // --- SERVICES ---
  private readonly router = inject(Router);

  // --- INIT ---
  constructor() {
    const params = inject(ActivatedRoute).snapshot.queryParams;
    this.firstName           = params['firstName']           || '';
    this.lastName            = params['lastName']            || '';
    this.organisationName    = params['organisationName']    || '';
    this.organisationLogoUrl = params['organisationLogoUrl'] || null;
  }

  // --- NAVIGATION ---
  goToQuestionnaire(): void { this.router.navigate(['/questionnaire-guide'], { queryParams: this.queryParams() }); }
  goToCatalogue():     void { this.router.navigate(['/catalogue-velos'],     { queryParams: this.queryParams() }); }

  private queryParams(): Record<string, string> {
    const p: Record<string, string> = {};
    if (this.firstName)           p['firstName']           = this.firstName;
    if (this.lastName)            p['lastName']            = this.lastName;
    if (this.organisationName)    p['organisationName']    = this.organisationName;
    if (this.organisationLogoUrl) p['organisationLogoUrl'] = this.organisationLogoUrl;
    return p;
  }
}
