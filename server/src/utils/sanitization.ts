/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize string to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Sanitize HTML content - more aggressive than sanitizeString
 * Strips all HTML tags completely
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Sanitize email address
 * Ensures email is lowercase and properly formatted
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ''); // Remove all whitespace
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except + at start
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';
  
  // Keep only digits and + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure + only appears at the start
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.substring(1).replace(/\+/g, '');
  }
  
  return cleaned.replace(/\+/g, '');
}

/**
 * Sanitize URL
 * Ensures URL is safe and well-formed
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url.trim());
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize file name
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Sanitize address string
 * Prevents injection while preserving address formatting
 */
export function sanitizeAddress(address: string): string {
  if (typeof address !== 'string') return '';
  
  return address
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[;'"]/g, '') // Remove potentially dangerous characters
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Limit length
}

/**
 * Sanitize JSON input
 * Ensures JSON is valid and safe
 */
export function sanitizeJson<T>(input: any): T | null {
  try {
    // If it's already an object, stringify and parse to clean it
    const jsonString = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Parse to validate JSON structure
    const parsed = JSON.parse(jsonString);
    
    // Check for common injection patterns
    const str = JSON.stringify(parsed);
    if (str.includes('<script>') || str.includes('javascript:')) {
      console.warn('⚠️ Potential XSS in JSON input blocked');
      return null;
    }
    
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize search query
 * Prevents search injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"`;]/g, '') // Remove quotes and semicolons
    .replace(/\\/g, '') // Remove backslashes
    .substring(0, 200); // Limit length
}

/**
 * Sanitize integer input
 * Ensures value is a valid integer within bounds
 */
export function sanitizeInteger(value: any, min?: number, max?: number): number | null {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) return null;
  
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
}

/**
 * Sanitize float input
 * Ensures value is a valid float within bounds
 */
export function sanitizeFloat(value: any, min?: number, max?: number, decimals?: number): number | null {
  const num = parseFloat(value);
  
  if (isNaN(num)) return null;
  
  let result = num;
  
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  
  if (decimals !== undefined) {
    result = parseFloat(result.toFixed(decimals));
  }
  
  return result;
}

/**
 * Sanitize boolean input
 * Converts various truthy/falsy values to boolean
 */
export function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}

/**
 * Sanitize array of strings
 * Ensures each element is properly sanitized
 */
export function sanitizeStringArray(arr: any[], maxLength: number = 100): string[] {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
    .slice(0, maxLength);
}

/**
 * Sanitize object keys
 * Prevents prototype pollution and injection via object keys
 */
export function sanitizeObjectKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = {};
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (dangerousKeys.includes(key)) {
      console.warn(`⚠️ Dangerous key "${key}" filtered from object`);
      continue;
    }
    
    // Sanitize the key
    const sanitizedKey = sanitizeString(key).substring(0, 100);
    
    if (sanitizedKey) {
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[sanitizedKey] = sanitizeObjectKeys(value);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUuid(uuid: string): string | null {
  if (typeof uuid !== 'string') return null;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const cleaned = uuid.trim().toLowerCase();
  
  return uuidRegex.test(cleaned) ? cleaned : null;
}

/**
 * Sanitize SQL LIKE pattern
 * Escapes special characters for safe use in LIKE queries
 */
export function sanitizeLikePattern(pattern: string): string {
  if (typeof pattern !== 'string') return '';
  
  return pattern
    .replace(/\\/g, '\\\\') // Escape backslash
    .replace(/%/g, '\\%')   // Escape percent
    .replace(/_/g, '\\_')   // Escape underscore
    .trim()
    .substring(0, 200);
}

/**
 * Rate limit key sanitization
 * Creates a safe key for rate limiting
 */
export function sanitizeRateLimitKey(identifier: string): string {
  if (typeof identifier !== 'string') return 'unknown';
  
  return identifier
    .replace(/[^a-zA-Z0-9-_:.]/g, '')
    .substring(0, 100);
}

/**
 * Content Security Policy safe string
 * Ensures string is safe for CSP headers
 */
export function sanitizeForCSP(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Comprehensive input sanitizer
 * Applies appropriate sanitization based on input type
 */
export function sanitizeInput(input: any, type: 'string' | 'email' | 'phone' | 'url' | 'integer' | 'float' | 'boolean' | 'uuid' = 'string'): any {
  switch (type) {
    case 'string':
      return sanitizeString(input);
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhone(input);
    case 'url':
      return sanitizeUrl(input);
    case 'integer':
      return sanitizeInteger(input);
    case 'float':
      return sanitizeFloat(input);
    case 'boolean':
      return sanitizeBoolean(input);
    case 'uuid':
      return sanitizeUuid(input);
    default:
      return sanitizeString(input);
  }
}
