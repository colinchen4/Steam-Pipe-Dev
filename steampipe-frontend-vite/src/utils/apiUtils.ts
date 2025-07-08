import { API_TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY } from '../config';
import { ApiError } from '../types/api';

/**
 * Retry mechanism for failed API requests
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = RETRY_ATTEMPTS,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Steam ID validation
 */
export const validateSteamId = (steamId: string): boolean => {
  // Steam ID is a 17-digit number starting with 7656119
  const steamIdRegex = /^7656119[0-9]{10}$/;
  return steamIdRegex.test(steamId);
};

/**
 * Sanitize Steam ID input
 */
export const sanitizeSteamId = (input: string): string => {
  return input.replace(/[^0-9]/g, '').slice(0, 17);
};

/**
 * Price validation
 */
export const validatePrice = (price: string): { isValid: boolean; error?: string } => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return { isValid: false, error: 'Invalid price format' };
  if (numPrice <= 0) return { isValid: false, error: 'Price must be positive' };
  if (numPrice > 10000) return { isValid: false, error: 'Price too high' };
  return { isValid: true };
};

/**
 * Rate limiting for API calls
 */
const rateLimiter = new Map<string, number[]>();

export const checkRateLimit = (key: string, limit = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const timestamps = rateLimiter.get(key) || [];
  
  // Filter out timestamps outside the window
  const recentTimestamps = timestamps.filter(time => now - time < windowMs);
  
  // Check if we've hit the limit
  if (recentTimestamps.length >= limit) {
    return false;
  }
  
  // Add current timestamp and update the map
  recentTimestamps.push(now);
  rateLimiter.set(key, recentTimestamps);
  return true;
};

/**
 * Format USDC amount from micro-units to human-readable
 */
export const formatUsdcAmount = (amount: number): string => {
  return (amount / 1000000).toFixed(2);
};

/**
 * Parse USDC amount from human-readable to micro-units
 */
export const parseUsdcAmount = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 1000000);
};

/**
 * Debounce function for limiting rapid function calls
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};
