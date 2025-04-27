
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a log to verify environment variable loading
console.log('Environment variables status:', { 
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
});

// Initialize logging for Supabase client
console.info('Initializing Supabase client with:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'URL not set',
  supabaseKeyProvided: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'YES' : 'NO'
});

createRoot(document.getElementById("root")!).render(<App />);
