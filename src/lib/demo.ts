export const DEMO_EMAIL = 'demo@digitalstack.cloud'

export function isDemoUser(email: string | null | undefined): boolean {
  return email === DEMO_EMAIL
}
