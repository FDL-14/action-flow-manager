
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
    "1745060635120": "12f6f95b-eeca-411d-a098-221053ab9f03", // Same Total Data company with different ID
    "1745060164901": "12f6f95b-eeca-411d-a098-221053ab9f03", // Another Total Data entry
    
    // Clients
    "1745268930996": "c5f9ed6d-8936-4989-9ee8-dddee5ccf3a0",
    "2099b1c4-b95c-42d1-8768-48b528f66607": "2099b1c4-b95c-42d1-8768-48b528f66607",
    
    // Responsibles - using unique keys for each responsible
    "1745060635129": "7f6f84e6-4362-4ebe-b8cc-6e11ec8407f7", // João Silva with timestamp ID
    "resp_1": "7f6f84e6-4362-4ebe-b8cc-6e11ec8407f7", // João Silva with named ID
    "resp_2": "28a7ed6b-5c2a-4dd4-9aef-a8dca5c5b46e", // Maria Souza
    "resp_3": "65f8e32c-1a1d-49c1-b432-f77d6c529612", // Carlos Oliveira
    "resp_4": "b4a80976-86e0-4a74-8c5c-e5a0f3d35f5f", // Ana Santos
    "1745581459614": "7d69f456-543a-4e1c-9a23-f056481a7c12", // New responsible
    
    // Requesters
    "1745066913470": "8854bd89-6ef7-4419-9ee3-b968bc279f19",
    
    // Users
    "1745067722987": "94c92f32-a676-4a3d-9d90-5704d8aae237", // Fabiano Domingues Luciano
    "1745067484193": "9c2df12c-4b89-4d94-adb2-1a25b613dd61", // Flávia de Souza Magalhães Lucano
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
    // Use a proper format for the generated UUID
    // Format: xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxxxxxx (RFC 4122 v4 UUID format)
    let idStr = cleanId.toString().padStart(12, '0');
    
    // Generate first segment (8 chars)
    let segment1 = idStr.substring(0, 8);
    if (segment1.length < 8) {
      segment1 = segment1.padEnd(8, '0');
    }
    
    // Generate second segment (4 chars)
    let segment2 = idStr.length > 8 ? idStr.substring(8, 12) : '0000';
    if (segment2.length < 4) {
      segment2 = segment2.padEnd(4, '0');
    }
    
    // Generate last segment (12 chars) - use hash of the original ID for uniqueness
    let segment3 = '';
    for (let i = 0; i < 12; i++) {
      if (i < idStr.length) {
        segment3 += idStr.charCodeAt(i % idStr.length).toString(16).padStart(2, '0').substring(0, 1);
      } else {
        segment3 += '0';
      }
    }
    
    // Combine into valid UUID format (version 4, variant 1)
    const generatedUUID = `${segment1}-${segment2}-4000-a000-${segment3}`;
    console.log(`Generated deterministic UUID for ${cleanId}: ${generatedUUID}`);
    
    return generatedUUID;
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
