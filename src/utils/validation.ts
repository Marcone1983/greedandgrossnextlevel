export function validateUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 20) {
    return false;
  }
  
  // Only alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
}

export function validateStrainName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) {
    return false;
  }
  
  // Allow letters, numbers, spaces, and common special characters
  const strainRegex = /^[a-zA-Z0-9\s\-#]+$/;
  return strainRegex.test(name);
}

export function validateTHCCBD(value: number): boolean {
  return value >= 0 && value <= 40;
}

export function validateMessage(message: string, tier: 'free' | 'premium' | 'admin'): boolean {
  const maxLength = tier === 'free' ? 500 : 5000;
  return message.length > 0 && message.length <= maxLength;
}

export function sanitizeInput(input: string): string {
  // Remove potential XSS attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAdminSecret(secret: string): boolean {
  // Must be exactly 7 taps or the secret phrase
  return secret === 'tap7times' || secret === 'greedandgross2024';
}