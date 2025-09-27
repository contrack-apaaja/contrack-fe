/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...konfigurasi Anda yang lain mungkin ada di sini

  eslint: {
    // PERINGATAN: Ini akan membuat build berhasil meskipun ada error linter.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
