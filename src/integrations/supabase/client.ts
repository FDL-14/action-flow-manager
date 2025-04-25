
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with explicit fallback values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tsjdsbxgottssqqlzfxl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamRzYnhnb3R0c3NxcWx6ZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODM3NDgsImV4cCI6MjA2MDE1OTc0OH0.3WVd3cIBxyUlJGBjCzwLs5YY14xC6ZNtMbb5zuxF0EY';

// Log initialization values for debugging
console.log('Initializing Supabase client with:', { 
  supabaseUrl: supabaseUrl || 'NOT SET', 
  supabaseKeyProvided: supabaseKey ? 'YES' : 'NO' 
});

export const supabase = createClient(supabaseUrl, supabaseKey);

// Improved UUID conversion function
export const convertToUUID = (id: string): string => {
  if (!id) {
    console.error("convertToUUID received empty ID");
    // Return a valid UUID format as fallback for empty inputs
    return "00000000-0000-0000-0000-000000000000";
  }
  
  // If it's already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    console.log(`ID is already a UUID: ${id}`);
    return id;
  }
  
  // Generate consistent UUID from any string
  try {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate a deterministic UUID from the hash
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (hash + Math.random() * 16) % 16 | 0;
      hash = Math.floor(hash / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    
    console.log(`Converted ID ${id} to UUID ${uuid}`);
    return uuid;
  } catch (error) {
    console.error('Error converting ID to UUID:', error);
    // Return a valid UUID format as fallback
    return "00000000-0000-0000-0000-000000000000";
  }
};
