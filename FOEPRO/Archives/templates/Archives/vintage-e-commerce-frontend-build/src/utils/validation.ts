/**
 * Input validation utilities for forms.
 */

/** Basic email format check */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Phone: allows +, digits, spaces, dashes. Minimum 7 digits. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** Indian pincode — exactly 6 digits */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

/** Non-empty after trimming */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Password strength — minimum length */
export function isValidPassword(password: string, minLength = 6): boolean {
  return password.length >= minLength;
}

/** Username — alphanumeric and underscores, 3-30 chars */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username.trim());
}
