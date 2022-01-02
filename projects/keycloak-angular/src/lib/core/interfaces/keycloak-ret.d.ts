import { KeycloakProfile } from 'keycloak-js';
export interface UserIdentity {
  user_id: string;
  sub: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile: KeycloakProfile;
  roles: string[];
}
