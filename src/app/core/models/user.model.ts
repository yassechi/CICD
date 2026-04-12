export enum UserRole {
  Admin = 1,
  Manager = 2,
  User = 3
}

export interface OrganisationRef {
  id: number;
  name: string;
}

export interface User {
  id?: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  isActif: boolean;
  organisationId: number | OrganisationRef;
  password?: string;
  confirmPassword?: string;
  tailleCm?: number;
}
