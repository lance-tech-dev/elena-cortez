// Shared by the form (maxLength) and the server actions (validation).
export const CERTIFICATE_LIMITS = {
  title: 160,
  issuer: 80,
  description: 300,
  issuedOn: 10,
  credentialUrl: 500,
} as const;

export type CertificateField = keyof typeof CERTIFICATE_LIMITS;

/** Raw form values, so a failed save can show what was typed. */
export type CertificateValues = Record<CertificateField, string>;
export const CERTIFICATE_FIELDS = Object.keys(CERTIFICATE_LIMITS) as CertificateField[];
