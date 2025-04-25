
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a log to verify environment variable loading
console.log('Environment variables status:', { 
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
});

createRoot(document.getElementById("root")!).render(<App />);
