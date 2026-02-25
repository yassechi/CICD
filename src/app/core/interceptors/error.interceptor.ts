import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const intercepteurErreur: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((reponseErreur: HttpErrorResponse) => {
      // propager l'error au composant sinon avalee
      return throwError(() => reponseErreur);
    }),
  );
};
