import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Shown in Settings → About.
  env: { NEXT_PUBLIC_APP_VERSION: version },
  // The sidebar's collapse button lives in the bottom-left corner.
  devIndicators: { position: 'bottom-right' },
  // Pages that were merged into other sections; old bookmarks keep working.
  async redirects() {
    return [
      { source: '/search', destination: '/library', permanent: true },
      { source: '/admin/jobs', destination: '/admin/tasks?tab=jobs', permanent: true },
      { source: '/admin/library', destination: '/admin/libraries', permanent: true },
      { source: '/admin/artwork', destination: '/admin/metadata?tab=artwork', permanent: true },
      { source: '/admin/duplicates', destination: '/admin/metadata?tab=duplicates', permanent: true },
      { source: '/admin/permissions', destination: '/admin/users?tab=roles', permanent: true },
      { source: '/admin/audit-logs', destination: '/admin/logs', permanent: true },
      { source: '/admin/monitoring', destination: '/admin', permanent: true },
      { source: '/admin/analytics', destination: '/admin', permanent: true },
      { source: '/admin/collections', destination: '/collections', permanent: true },
    ]
  },
}

export default nextConfig
