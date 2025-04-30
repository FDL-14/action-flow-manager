
import { supabase } from '@/integrations/supabase/client';

/**
 * Validates if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Logs messages with consistent formatting for debugging
 */
export function logDebug(message: string, data?: any): void {
  console.log(`Supabase Client: ${message}`, data || '');
}
