
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tsjdsbxgottssqqlzfxl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzamRzYnhnb3R0c3NxcWx6ZnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODM3NDgsImV4cCI6MjA2MDE1OTc0OH0.3WVd3cIBxyUlJGBjCzwLs5YY14xC6ZNtMbb5zuxF0EY";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: localStorage
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export type JsonObject = { [key: string]: any };

export const convertToUUID = (id: string | null | undefined): string | null => {
  // If id is null or undefined, return null
  if (id === null || id === undefined) {
    return null;
  }
  
  // Clean the ID, removing formatting that could cause problems
  const cleanId = id.toString().trim();
  
  // Skip conversion if empty string
  if (cleanId === '') {
    console.warn('Empty ID provided to convertToUUID');
    return null;
  }
  
  // Check if the ID is already a valid UUID (standard format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(cleanId)) {
    return cleanId;
  }
  
  // Known UUIDs for the database - consolidated mapping
  const knownIds: {[key: string]: string} = {
    // Companies
    "1": "12f6f95b-eeca-411d-a098-221053ab9f03", // Total Data
    "1745060635120": "12f6f95b-eeca-411d-a098-221053ab9f03",
    
    // Clients
    "1745268930996": "c5f9ed6d-8936-4989-9ee8-dddee5ccf3a0",
    
    // Responsibles
    "1745060635129": "7f6f84e6-4362-4ebe-b8cc-6e11ec8407f7",
    "1": "7f6f84e6-4362-4ebe-b8cc-6e11ec8407f7", // João Silva
    "2": "28a7ed6b-5c2a-4dd4-9aef-a8dca5c5b46e", // Maria Souza
    "3": "65f8e32c-1a1d-49c1-b432-f77d6c529612", // Carlos Oliveira
    "4": "b4a80976-86e0-4a74-8c5c-e5a0f3d35f5f", // Ana Santos
    
    // Requesters
    "1745066913470": "8854bd89-6ef7-4419-9ee3-b968bc279f19",
  };
  
  // Check if we have a direct mapping for this ID
  if (knownIds[cleanId]) {
    console.log(`Using known UUID mapping for ${cleanId}: ${knownIds[cleanId]}`);
    return knownIds[cleanId];
  }
  
  // For single character IDs like 'A', 'B', etc.
  if (cleanId.length === 1) {
    const charCode = cleanId.charCodeAt(0);
    const hexVal = charCode.toString(16).padStart(2, '0');
    const specialUUID = `aaaaaaaa-bbbb-4ccc-8ddd-${hexVal}${hexVal}${hexVal}${hexVal}${hexVal}${hexVal}`;
    console.log(`Converting single character ID ${cleanId} to UUID: ${specialUUID}`);
    return specialUUID;
  }
  
  // For numeric IDs or other formats, generate a deterministic UUID
  try {
    const defaultUUID = "00000000-0000-4000-a000-000000000000";
    let idPart = cleanId;
    
    // Truncate very long IDs
    if (idPart.length > 12) {
      idPart = idPart.substring(0, 12);
    }
    
    // Pad with zeros if too short
    if (idPart.length < 12) {
      idPart = idPart.padStart(12, '0');
    }
    
    // Generate deterministic UUID by replacing parts of the default UUID
    const idPartChars = idPart.split('');
    const uuid = defaultUUID.split('');
    
    for (let i = 0; i < idPartChars.length && i < 12; i++) {
      if (i < 8) {
        uuid[i] = idPartChars[i];
      } else if (i < 12) {
        uuid[i + 9] = idPartChars[i]; // Skip the hyphens
      }
    }
    
    const resultUUID = uuid.join('');
    console.log(`Generated deterministic UUID for ${cleanId}: ${resultUUID}`);
    
    return resultUUID;
  } catch (error) {
    console.error(`Error converting ID ${cleanId} to UUID:`, error);
    return null;
  }
};

// Enable realtime changes for the actions table with better error handling
(async () => {
  try {
    // Configure realtime channel with more detailed logging
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'actions' },
        (payload) => {
          console.log('Realtime change received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
      
    console.log('Realtime channel configured for actions table');
    
    // Note about realtime functionality
    console.log('Note: For full realtime functionality, make sure REPLICA IDENTITY is set to FULL for the actions table');
  } catch (error) {
    console.error('Error setting up realtime:', error);
  }
})();

