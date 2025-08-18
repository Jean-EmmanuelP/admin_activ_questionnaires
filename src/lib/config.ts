// Configuration Supabase
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
};

// Vérification des variables d'environnement
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.warn('⚠️ Variables Supabase manquantes. Créez un fichier .env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
} 