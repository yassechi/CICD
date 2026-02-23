import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { MessageService } from '../services/message.service';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

export const intercepteurErreur: HttpInterceptorFn = (req, next) => {
  const serviceErreur = inject(MessageService);

  return next(req).pipe(
    catchError((reponseErreur: HttpErrorResponse) => {

      const extraireMessageErreur = (erreur: any): string | null => {
        if (!erreur) return null;
        if (typeof erreur === 'string') return erreur;
        if (Array.isArray(erreur)) return erreur.join(', ');

        if (erreur.errors) {
          if (Array.isArray(erreur.errors)) return erreur.errors.join(', ');
          if (typeof erreur.errors === 'object') {
            return Object.values(erreur.errors).flat().join(', ');
          }
        }

        if (erreur.message) return erreur.message;
        if (erreur.title) return erreur.title;
        return null;
      };

      let detailErreur = '';
      switch (reponseErreur.status) {
        case 400:
          detailErreur = extraireMessageErreur(reponseErreur.error) || 'Requete invalide';
          break;
        case 401:
        case 403:
          detailErreur = extraireMessageErreur(reponseErreur.error) || 'Acces refusé';
          break;
        case 404:
          detailErreur = "L'adresse du serveur est introuvable";
          break;
        case 418:
          detailErreur = "I'm a teapot !!";
          break;
        default:
          detailErreur = 'La connexion au serveur a échoué';
          break;
      }

      serviceErreur.showError(detailErreur);

      // propager l'error au composant sinon avalée /////////////////
      return throwError(() => reponseErreur); ///////////////////////
    })
  );
};
