/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expose the Supabase URL/anon key to the browser under the NEXT_PUBLIC_
  // prefix while keeping the .env variable names exactly as specified in
  // /.env.example (SUPABASE_URL / SUPABASE_ANON_KEY). The service role key
  // is never mapped here and stays server-only.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
  },
};

module.exports = nextConfig;
