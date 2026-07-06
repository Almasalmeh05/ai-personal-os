/**
 * Form validation utilities.
 * Used for all input validation across the application.
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength.
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): {
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters');

  if (password.length >= 16) score++;

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('At least one uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('At least one lowercase letter');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('At least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('At least one special character');

  return { score: Math.min(score, 5), feedback };
}

/**
 * Validate URL format.
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic).
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-().]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate form data against schema.
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, (value: unknown) => string | null>
): ValidationResult {
  const errors: Record<string, string> = {};

  Object.entries(schema).forEach(([key, validator]) => {
    const error = validator(data[key as keyof T]);
    if (error) {
      errors[key] = error;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validators for form fields.
 */
export const validators = {
  required: (value: unknown) =>
    !value || (typeof value === 'string' && !value.trim())
      ? 'This field is required'
      : null,

  email: (value: unknown) =>
    typeof value === 'string' && !validateEmail(value) ? 'Invalid email address' : null,

  minLength: (min: number) => (value: unknown) =>
    typeof value === 'string' && value.length < min
      ? `Minimum ${min} characters required`
      : null,

  maxLength: (max: number) => (value: unknown) =>
    typeof value === 'string' && value.length > max
      ? `Maximum ${max} characters allowed`
      : null,

  pattern: (pattern: RegExp, message: string) => (value: unknown) =>
    typeof value === 'string' && !pattern.test(value) ? message : null,

  url: (value: unknown) =>
    typeof value === 'string' && !validateUrl(value) ? 'Invalid URL' : null,

  phone: (value: unknown) =>
    typeof value === 'string' && !validatePhoneNumber(value)
      ? 'Invalid phone number'
      : null,
};
