import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const currentUser = authService.getCurrentUser();
  const requiredRole = route.data['role'];

  if (!requiredRole) {
    return true;
  }

  if (currentUser && currentUser.role === requiredRole) {
    return true;
  }

  if (currentUser) {
    switch (currentUser.role) {
      case 1:
        router.navigate(['/admin/dashboard']);
        break;
      case 2:
        router.navigate(['/manager/dashboard']);
        break;
      case 3:
        router.navigate(['/user/dashboard']);
        break;
      default:
        router.navigate(['/login']);
    }
  } else {
    router.navigate(['/login']);
  }

  return false;
};
