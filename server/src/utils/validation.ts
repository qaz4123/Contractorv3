/**
 * Validation Utilities
 * Common validation helpers
 */

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid phone number
 */
export function isValidPhone(value: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\.+]+$/;
  return phoneRegex.test(value) && value.length >= 10;
}

/**
 * Check if a value is a valid URL
 */
export function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input (trim and remove extra spaces)
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Parse pagination parameters
 */
export function parsePagination(
  page?: string | number,
  pageSize?: string | number
): { page: number; pageSize: number; skip: number } {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const skip = (parsedPage - 1) * parsedPageSize;

  return {
    page: parsedPage,
    pageSize: parsedPageSize,
    skip,
  };
}

/**
 * Check if a string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Validate and parse a date string
 */
export function parseDate(value: string): Date | null {
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Check if a value is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends object>(
  obj: T,
  fields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of fields) {
    if (obj[field] === null || obj[field] === undefined || obj[field] === '') {
      missing.push(String(field));
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate line items for quotes/invoices
 */
export function validateLineItems(lineItems: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return { valid: false, error: 'At least one line item is required' };
  }

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    if (!item.description || typeof item.description !== 'string') {
      return { valid: false, error: `Line item ${i + 1}: description is required` };
    }
    if (typeof item.quantity !== 'number' || item.quantity < 0) {
      return { valid: false, error: `Line item ${i + 1}: valid quantity is required` };
    }
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      return { valid: false, error: `Line item ${i + 1}: valid unit price is required` };
    }
    if (typeof item.total !== 'number' || item.total < 0) {
      return { valid: false, error: `Line item ${i + 1}: valid total is required` };
    }
    // Verify calculation
    const expectedTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    const actualTotal = Math.round(item.total * 100) / 100;
    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      return { valid: false, error: `Line item ${i + 1}: total doesn't match quantity × unit price` };
    }
  }

  return { valid: true };
}

/**
 * Calculate totals for line items with tax and discount
 */
export function calculateTotals(lineItems: any[], tax: number = 0, discount: number = 0) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
