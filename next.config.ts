import type {NextConfig} from 'next';

// Deteksi otomatis environment Cloudflare Pages atau manual export
const isCloudflareExport = process.env.CF_PAGES === '1' || process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Otomatis gunakan static export saat di Cloudflare Pages agar 100% mulus tanpa error
  output: isCloudflareExport ? 'export' : 'standalone',
  trailingSlash: true,
  // Semua gambar cdn.scalev.com diload ukuran asli 100% tanpa recompress/crop
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.scalev.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'files.catbox.moe',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
