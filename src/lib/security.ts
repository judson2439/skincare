/**
 * @fileoverview Security utilities for client-side validation, sanitization, and CSRF protection.
 * This module provides comprehensive security features including:
 * - Input validation with predefined patterns
 * - XSS sanitization for user-generated content
 * - CSRF token management
 * - Rate limiting for authentication attempts
 * - Password strength checking
 * 
 * @module lib/security
 * @version 1.0.0
 */

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

/**
 * Predefined regular expression patterns for common input validation scenarios.
 * These patterns are designed to be strict enough for security while allowing
 * legitimate user input.
 * 
 * @constant {Object} VALIDATION_PATTERNS
 * @property {RegExp} email - Validates email addresses (RFC 5322 simplified)
 * @property {RegExp} password - Strong password: 8+ chars, upper, lower, number, special
 * @property {RegExp} passwordSimple - Basic password: 8+ characters minimum
 * @property {RegExp} name - Names: 2-100 chars, letters, spaces, hyphens, apostrophes
 * @property {RegExp} phone - Phone numbers: 10-20 digits with optional + and formatting
 * @property {RegExp} uuid - UUID v4 format validation
 * @property {RegExp} url - HTTP/HTTPS URL validation
 * @property {RegExp} alphanumeric - Letters and numbers only
 * @property {RegExp} numeric - Numbers only
 */
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  passwordSimple: /^.{8,}$/, // At least 8 characters
  name: /^[a-zA-Z\s'-]{2,100}$/,
  phone: /^\+?[\d\s-]{10,20}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result of a validation operation.
 * @interface ValidationResult
 * @property {boolean} valid - Whether the validation passed
 * @property {string} [error] - Error message if validation failed
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Configuration rules for custom validation.
 * @interface ValidationRules
 * @property {boolean} [required] - Whether the field is required
 * @property {number} [minLength] - Minimum string length
 * @property {number} [maxLength] - Maximum string length
 * @property {RegExp} [pattern] - Custom regex pattern to match
 * @property {Function} [custom] - Custom validation function
 */
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single input value against a predefined pattern.
 * 
 * @function validateInput
 * @param {string | undefined | null} value - The value to validate
 * @param {keyof typeof VALIDATION_PATTERNS} type - The type of validation to perform
 * @returns {ValidationResult} Object containing validation status and error message
 * 
 * @example
 * // Validate an email address
 * const result = validateInput('user@example.com', 'email');
 * if (!result.valid) {
 *   console.error(result.error); // "Please enter a valid email address"
 * }
 * 
 * @example
 * // Validate a strong password
 * const result = validateInput('MyP@ssw0rd', 'password');
 * console.log(result.valid); // true
 */
export function validateInput(
  value: string | undefined | null,
  type: keyof typeof VALIDATION_PATTERNS
): ValidationResult {
  // Check for null, undefined, or non-string values
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${type} is required` };
  }

  // Trim whitespace before validation
  const trimmedValue = value.trim();
  const pattern = VALIDATION_PATTERNS[type];

  // Test against the pattern and return appropriate error message
  if (!pattern.test(trimmedValue)) {
    switch (type) {
      case 'email':
        return { valid: false, error: 'Please enter a valid email address' };
      case 'password':
        return {
          valid: false,
          error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        };
      case 'passwordSimple':
        return { valid: false, error: 'Password must be at least 8 characters' };
      case 'name':
        return { valid: false, error: 'Name must be 2-100 characters, letters only' };
      case 'phone':
        return { valid: false, error: 'Please enter a valid phone number' };
      case 'uuid':
        return { valid: false, error: 'Invalid ID format' };
      case 'url':
        return { valid: false, error: 'Please enter a valid URL' };
      default:
        return { valid: false, error: `Invalid ${type} format` };
    }
  }

  return { valid: true };
}

/**
 * Validates a value with custom validation rules.
 * Allows for flexible validation beyond predefined patterns.
 * 
 * @function validateWithRules
 * @param {string | undefined | null} value - The value to validate
 * @param {ValidationRules} rules - Custom validation rules to apply
 * @returns {ValidationResult} Object containing validation status and error message
 * 
 * @example
 * // Validate a username with custom rules
 * const result = validateWithRules('john_doe', {
 *   required: true,
 *   minLength: 3,
 *   maxLength: 20,
 *   pattern: /^[a-z0-9_]+$/
 * });
 * 
 * @example
 * // Validate with custom function
 * const result = validateWithRules('test', {
 *   custom: (value) => ({
 *     valid: value !== 'admin',
 *     error: 'Username "admin" is reserved'
 *   })
 * });
 */
export function validateWithRules(
  value: string | undefined | null,
  rules: ValidationRules
): ValidationResult {
  // Check required field - fail if required and empty
  if (rules.required && (!value || value.trim() === '')) {
    return { valid: false, error: 'This field is required' };
  }

  // If not required and empty, validation passes (optional field)
  if (!value || value.trim() === '') {
    return { valid: true };
  }

  const trimmedValue = value.trim();

  // Validate minimum length constraint
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return { valid: false, error: `Must be at least ${rules.minLength} characters` };
  }

  // Validate maximum length constraint
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return { valid: false, error: `Must be no more than ${rules.maxLength} characters` };
  }

  // Validate against custom regex pattern
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return { valid: false, error: 'Invalid format' };
  }

  // Run custom validation function if provided
  if (rules.custom) {
    return rules.custom(trimmedValue);
  }

  return { valid: true };
}

/**
 * Validates multiple form fields at once using a schema definition.
 * Useful for validating entire forms before submission.
 * 
 * @function validateForm
 * @param {Record<string, string | undefined | null>} data - Object containing field names and values
 * @param {Record<string, ValidationRules | keyof typeof VALIDATION_PATTERNS>} schema - Validation schema
 * @returns {{ valid: boolean; errors: Record<string, string> }} Validation result with all errors
 * 
 * @example
 * // Validate a login form
 * const result = validateForm(
 *   { email: 'user@example.com', password: 'secret' },
 *   { email: 'email', password: { required: true, minLength: 8 } }
 * );
 * 
 * if (!result.valid) {
 *   Object.entries(result.errors).forEach(([field, error]) => {
 *     console.error(`${field}: ${error}`);
 *   });
 * }
 */
export function validateForm(
  data: Record<string, string | undefined | null>,
  schema: Record<string, ValidationRules | keyof typeof VALIDATION_PATTERNS>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Iterate through each field in the schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    let result: ValidationResult;

    if (typeof rules === 'string') {
      // Rules is a pattern name (e.g., 'email', 'password')
      result = validateInput(value, rules);
    } else {
      // Rules is a ValidationRules object
      result = validateWithRules(value, rules);
    }

    // Collect errors for invalid fields
    if (!result.valid && result.error) {
      errors[field] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitizes user input to prevent XSS (Cross-Site Scripting) attacks.
 * Removes dangerous HTML elements and encodes special characters.
 * 
 * @function sanitizeInput
 * @param {string | undefined | null} input - The raw user input to sanitize
 * @returns {string} Sanitized string safe for display
 * 
 * @description
 * This function performs the following sanitization steps:
 * 1. Removes <script> tags and their content
 * 2. Removes inline event handlers (onclick, onerror, etc.)
 * 3. Removes javascript: protocol URLs
 * 4. Removes data: URLs that could contain scripts
 * 5. Encodes HTML entities (&, <, >, ", ')
 * 
 * @example
 * // Remove script tags
 * sanitizeInput('<script>alert("XSS")</script>Hello');
 * // Returns: "Hello"
 * 
 * @example
 * // Encode HTML entities
 * sanitizeInput('<div onclick="evil()">Click me</div>');
 * // Returns: "&lt;div&gt;Click me&lt;/div&gt;"
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Step 1: Remove script tags and their content entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Step 2: Remove inline event handlers (onclick, onerror, onload, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
    // Step 3: Remove javascript: protocol URLs
    .replace(/javascript:/gi, '')
    // Step 4: Remove data: URLs that could contain executable scripts
    .replace(/data:\s*text\/html/gi, '')
    // Step 5: Encode HTML entities to prevent tag injection
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizes HTML content while optionally preserving safe tags.
 * Useful for rich text content where some HTML formatting is allowed.
 * 
 * @function sanitizeHTML
 * @param {string | undefined | null} html - The HTML content to sanitize
 * @param {string[]} [allowedTags=[]] - Array of tag names to preserve (e.g., ['b', 'i', 'p'])
 * @returns {string} Sanitized HTML string
 * 
 * @description
 * When allowedTags is empty, all HTML is escaped. When tags are specified,
 * only those tags are preserved (without attributes for security).
 * 
 * @example
 * // Allow basic formatting tags
 * sanitizeHTML('<b>Bold</b><script>evil()</script>', ['b', 'i', 'p']);
 * // Returns: "<b>Bold</b>"
 * 
 * @example
 * // Escape all HTML
 * sanitizeHTML('<div>Content</div>');
 * // Returns: "&lt;div&gt;Content&lt;/div&gt;"
 */
export function sanitizeHTML(html: string | undefined | null, allowedTags: string[] = []): string {
  if (!html || typeof html !== 'string') return '';

  // First pass: Remove dangerous content regardless of allowed tags
  let sanitized = html
    // Remove script tags completely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers from any remaining tags
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove potentially dangerous data: URLs
    .replace(/data:\s*text\/html/gi, '');

  // If no tags are allowed, escape everything
  if (allowedTags.length === 0) {
    return sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Remove tags that aren't in the allowed list
  // Also strip all attributes from allowed tags for security
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Keep the tag but remove all attributes
      return match.replace(/\s+[a-z-]+\s*=\s*["'][^"']*["']/gi, '');
    }
    // Remove disallowed tags entirely
    return '';
  });

  return sanitized;
}

/**
 * Recursively sanitizes all string values in an object.
 * Useful for sanitizing entire form data objects or API payloads.
 * 
 * @function sanitizeObject
 * @template T - The type of the input object
 * @param {T} obj - The object containing values to sanitize
 * @returns {T} New object with all string values sanitized
 * 
 * @description
 * This function:
 * - Sanitizes string values using sanitizeInput()
 * - Recursively processes nested objects
 * - Sanitizes strings within arrays
 * - Preserves non-string values unchanged
 * 
 * @example
 * const userData = {
 *   name: '<script>alert("xss")</script>John',
 *   email: 'john@example.com',
 *   profile: {
 *     bio: '<img onerror="evil()" src="x">Hello'
 *   }
 * };
 * 
 * const safe = sanitizeObject(userData);
 * // safe.name = "John"
 * // safe.profile.bio = "&lt;img src=&quot;x&quot;&gt;Hello"
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      // Sanitize strings within arrays
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      // Preserve non-string, non-object values as-is
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================================================
// CSRF TOKEN MANAGEMENT
// ============================================================================

/**
 * Storage key for CSRF token in sessionStorage.
 * @constant {string}
 * @private
 */
const CSRF_STORAGE_KEY = 'csrf_token';

/**
 * Stores a CSRF token in session storage.
 * The token is used to prevent Cross-Site Request Forgery attacks.
 * 
 * @function setCSRFToken
 * @param {string} token - The CSRF token received from the server
 * @returns {void}
 * 
 * @example
 * // After login, store the CSRF token
 * const response = await login(credentials);
 * setCSRFToken(response.csrfToken);
 */
export function setCSRFToken(token: string): void {
  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch (e) {
    // Handle cases where sessionStorage is unavailable (private browsing, etc.)
    console.warn('Failed to store CSRF token:', e);
  }
}

/**
 * Retrieves the stored CSRF token from session storage.
 * 
 * @function getCSRFToken
 * @returns {string | null} The stored CSRF token, or null if not found
 * 
 * @example
 * const token = getCSRFToken();
 * if (token) {
 *   headers['X-CSRF-Token'] = token;
 * }
 */
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to retrieve CSRF token:', e);
    return null;
  }
}

/**
 * Removes the CSRF token from session storage.
 * Should be called on logout to clean up security tokens.
 * 
 * @function clearCSRFToken
 * @returns {void}
 * 
 * @example
 * // On logout
 * await signOut();
 * clearCSRFToken();
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear CSRF token:', e);
  }
}

/**
 * Creates HTTP headers with CSRF token included.
 * Automatically adds Content-Type and CSRF token headers.
 * 
 * @function createSecureHeaders
 * @param {Record<string, string>} [additionalHeaders={}] - Additional headers to include
 * @returns {Headers} Headers object ready for fetch requests
 * 
 * @example
 * const headers = createSecureHeaders({ 'Accept-Language': 'en-US' });
 * fetch('/api/data', { headers });
 */
export function createSecureHeaders(additionalHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...additionalHeaders,
  });

  // Add CSRF token if available
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return headers;
}

/**
 * Wrapper around fetch() that automatically includes CSRF token and credentials.
 * Use this for all authenticated API requests to ensure security headers are included.
 * 
 * @function secureFetch
 * @param {string} url - The URL to fetch
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<Response>} The fetch response
 * 
 * @example
 * // Make a secure POST request
 * const response = await secureFetch('/api/update-profile', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 * 
 * @example
 * // Make a secure GET request
 * const response = await secureFetch('/api/user/profile');
 * const data = await response.json();
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = createSecureHeaders(
    options.headers as Record<string, string> | undefined
  );

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies in request
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Client-side rate limiter to prevent brute force attacks.
 * Tracks attempts within a sliding time window.
 * 
 * @class RateLimiter
 * 
 * @example
 * // Create a limiter allowing 5 attempts per minute
 * const loginLimiter = new RateLimiter(5, 60000);
 * 
 * if (loginLimiter.canAttempt()) {
 *   loginLimiter.recordAttempt();
 *   await attemptLogin(credentials);
 * } else {
 *   const waitTime = loginLimiter.getTimeUntilReset();
 *   showError(`Please wait ${waitTime}ms before trying again`);
 * }
 */
export class RateLimiter {
  /** @private Timestamps of recorded attempts */
  private attempts: number[] = [];
  /** @private Maximum allowed attempts within the window */
  private maxAttempts: number;
  /** @private Time window in milliseconds */
  private windowMs: number;

  /**
   * Creates a new RateLimiter instance.
   * 
   * @constructor
   * @param {number} [maxAttempts=5] - Maximum attempts allowed within the time window
   * @param {number} [windowMs=60000] - Time window in milliseconds (default: 1 minute)
   */
  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Checks if another attempt is allowed within the rate limit.
   * Also cleans up old attempts outside the current window.
   * 
   * @method canAttempt
   * @returns {boolean} True if an attempt is allowed, false if rate limited
   */
  canAttempt(): boolean {
    const now = Date.now();
    // Remove attempts that are outside the current time window
    this.attempts = this.attempts.filter((time) => now - time < this.windowMs);
    return this.attempts.length < this.maxAttempts;
  }

  /**
   * Records a new attempt timestamp.
   * Call this after each authentication attempt.
   * 
   * @method recordAttempt
   * @returns {void}
   */
  recordAttempt(): void {
    this.attempts.push(Date.now());
  }

  /**
   * Gets the number of remaining attempts before rate limiting kicks in.
   * 
   * @method getRemainingAttempts
   * @returns {number} Number of attempts remaining
   */
  getRemainingAttempts(): number {
    const now = Date.now();
    // Clean up old attempts first
    this.attempts = this.attempts.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - this.attempts.length);
  }

  /**
   * Gets the time in milliseconds until the rate limit resets.
   * 
   * @method getTimeUntilReset
   * @returns {number} Milliseconds until the oldest attempt expires
   */
  getTimeUntilReset(): number {
    if (this.attempts.length === 0) return 0;
    const oldestAttempt = Math.min(...this.attempts);
    return Math.max(0, this.windowMs - (Date.now() - oldestAttempt));
  }

  /**
   * Resets the rate limiter, clearing all recorded attempts.
   * Call this after successful authentication.
   * 
   * @method reset
   * @returns {void}
   */
  reset(): void {
    this.attempts = [];
  }
}

// ============================================================================
// PASSWORD STRENGTH
// ============================================================================

/**
 * Result of password strength analysis.
 * @interface PasswordStrength
 * @property {number} score - Strength score from 0 (very weak) to 4 (very strong)
 * @property {'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'} label - Human-readable strength label
 * @property {string[]} suggestions - Array of suggestions to improve password strength
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  suggestions: string[];
}

/**
 * Analyzes password strength and provides improvement suggestions.
 * Uses multiple criteria including length, character variety, and common patterns.
 * 
 * @function checkPasswordStrength
 * @param {string} password - The password to analyze
 * @returns {PasswordStrength} Analysis result with score, label, and suggestions
 * 
 * @description
 * Scoring criteria:
 * - Length >= 8: +1 point
 * - Length >= 12: +1 point
 * - Contains lowercase: +0.5 points
 * - Contains uppercase: +0.5 points
 * - Contains numbers: +0.5 points
 * - Contains special characters: +0.5 points
 * - Only letters: -1 point
 * - Only numbers: -1 point
 * - Repeated characters (3+): -0.5 points
 * 
 * @example
 * const result = checkPasswordStrength('MyP@ssw0rd123');
 * console.log(result.label); // "Very Strong"
 * console.log(result.score); // 4
 * console.log(result.suggestions); // []
 * 
 * @example
 * const weak = checkPasswordStrength('password');
 * console.log(weak.label); // "Weak"
 * console.log(weak.suggestions); // ["Add uppercase letters", "Add numbers", ...]
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  // Handle empty password
  if (!password) {
    return { score: 0, label: 'Very Weak', suggestions: ['Enter a password'] };
  }

  // Length-based scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) suggestions.push('Use at least 8 characters');

  // Character type checks - each type adds to the score
  if (/[a-z]/.test(password)) score += 0.5;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 0.5;
  else suggestions.push('Add uppercase letters');

  if (/\d/.test(password)) score += 0.5;
  else suggestions.push('Add numbers');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 0.5;
  else suggestions.push('Add special characters');

  // Penalty for common weak patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    suggestions.push('Avoid using only letters');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 1;
    suggestions.push('Avoid using only numbers');
  }
  // Penalty for repeated characters (e.g., "aaa", "111")
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    suggestions.push('Avoid repeated characters');
  }

  // Normalize score to 0-4 range
  const normalizedScore = Math.max(0, Math.min(4, Math.round(score)));

  const labels: PasswordStrength['label'][] = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong',
  ];

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    suggestions: suggestions.slice(0, 3), // Limit to 3 most important suggestions
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes special characters in a string for use in a RegExp.
 * Prevents regex injection when building dynamic patterns.
 * 
 * @function escapeRegExp
 * @param {string} string - The string to escape
 * @returns {string} String with special regex characters escaped
 * 
 * @example
 * const userInput = 'price: $10.00';
 * const pattern = new RegExp(escapeRegExp(userInput));
 * // Creates pattern that matches literal "price: $10.00"
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates a cryptographically secure random string.
 * Uses the Web Crypto API for secure random number generation.
 * 
 * @function generateRandomString
 * @param {number} [length=32] - The desired length of the random string
 * @returns {string} Random alphanumeric string
 * 
 * @description
 * This function uses crypto.getRandomValues() which provides
 * cryptographically strong random values suitable for security purposes.
 * 
 * @example
 * // Generate a 32-character random string (default)
 * const token = generateRandomString();
 * // e.g., "aB3kL9mNpQ2rStUvWxYz1234567890AB"
 * 
 * @example
 * // Generate a 16-character random string
 * const shortToken = generateRandomString(16);
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use Web Crypto API for secure random values
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    // Use modulo to map random value to character index
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}
