export type Profile = 'DoctoralStudent' | 'Professor' | 'Listener';
export type UserLevel = 'Default' | 'Admin' | 'Superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  level: UserLevel;
  isActive: boolean;
  isVerified: boolean;
  isCommitteeOfActiveEdition: boolean;
  photoFilePath?: string | null;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  profile: Profile;
  registrationNumber?: string;
}
