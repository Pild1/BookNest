const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterPayload(payload) {
  const user = {
    email: String(payload.email ?? '').trim().toLowerCase(),
    password: String(payload.password ?? ''),
    displayName: String(payload.displayName ?? '').trim(),
  };
  const errors = {};

  if (!emailPattern.test(user.email)) errors.email = 'A valid email address is required.';
  if (user.password.length < 8) errors.password = 'Password must contain at least 8 characters.';
  if (!/[A-Z]/.test(user.password) || !/[0-9]/.test(user.password)) {
    errors.password = 'Password must include at least one uppercase letter and one number.';
  }
  if (!user.displayName) errors.displayName = 'Display name is required.';

  return { user, errors, isValid: Object.keys(errors).length === 0 };
}

export function validateLoginPayload(payload) {
  const credentials = {
    email: String(payload.email ?? '').trim().toLowerCase(),
    password: String(payload.password ?? ''),
  };
  const errors = {};

  if (!emailPattern.test(credentials.email)) errors.email = 'A valid email address is required.';
  if (!credentials.password) errors.password = 'Password is required.';

  return { credentials, errors, isValid: Object.keys(errors).length === 0 };
}
