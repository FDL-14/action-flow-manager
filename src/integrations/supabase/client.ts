import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if we already have this function, if not, add it
export const convertToUUID = (id: string): string | null => {
  if (!id) return null;
  
  // If it's already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  
  // Otherwise, try to convert to a UUID
  try {
    // Simple hash function to convert any string to UUID format
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate a pseudo-UUID from the hash
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (hash + Math.random() * 16) % 16 | 0;
      hash = Math.floor(hash / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    
    return uuid;
  } catch (error) {
    console.error('Error converting ID to UUID:', error);
    return null;
  }
};
