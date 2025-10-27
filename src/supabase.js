import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

console.log('🔧 Supabase config:', { 
  url: supabaseUrl ? '✅ Set' : '❌ Missing', 
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please check your .env file has:');
  console.error('REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
  console.error('REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
}

// Create client with proper error handling
let supabase;
try {
  supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    db: {
      schema: 'public'
    }
  });
} catch (error) {
  console.error('❌ Error creating Supabase client:', error);
  // Create a dummy client to prevent crashes
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) })
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => {}
      })
    }),
    removeAllChannels: () => {}
  };
}

export { supabase };
