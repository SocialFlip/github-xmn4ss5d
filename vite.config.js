import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify('https://uqdgjtlmxkxofqynfaro.supabase.co'),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZGdqdGxteGt4b2ZxeW5mYXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTExOTMsImV4cCI6MjA2NTMyNzE5M30.AHykWCUBUIqqq3mt7f9DAPMsjvSgPXCEh7y-pHKjpc0'),
    'process.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify('pk_live_51JCyNOAPsY1QdyG2Podkafhttx6RfcJOixVSN3SD8aQOab7UXviKAMe2yMtaqexlyz7UmKepzpvgr4xnClKqncEb00pPS0Xoqf')
  }
})