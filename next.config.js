/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Allow HEIC files (though browser support may vary)
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
