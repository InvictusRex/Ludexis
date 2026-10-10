export interface SetupStatus {
  initialized: boolean;
  /** Username of the default administrator while it still has its first-run password. */
  default_login?: string | null;
}
