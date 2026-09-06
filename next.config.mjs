import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Photos uploaded from /admin/photos are served from Supabase Storage, so
 * next/image needs that hostname allow-listed. Derived from the env var rather
 * than hardcoded, with a wildcard fallback so a fresh clone (or a project ref
 * we do not know at build time) still renders hosted images.
 */
function supabaseImagePatterns() {
  const patterns = [];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (raw && !/YOUR_PROJECT/i.test(raw)) {
    try {
      const parsed = new URL(raw);
      patterns.push({
        protocol: parsed.protocol === "http:" ? "http" : "https",
        hostname: parsed.hostname,
        pathname: "/storage/v1/object/public/**",
      });
    } catch {
      // Malformed URL — fall through to the wildcard below.
    }
  }

  if (!patterns.some((p) => p.hostname.endsWith(".supabase.co"))) {
    patterns.push({
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/public/**",
    });
  }

  return patterns;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseImagePatterns(),
    // Prefer sharper outputs for hero / gallery (default quality is 75).
    qualities: [75, 90, 100],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
  },
  // Baseline security headers. Deliberately no Content-Security-Policy here —
  // this site loads third-party scripts at runtime (Plausible/GA4 after
  // cookie consent, the SumUp hosted checkout redirect) that a CSP added
  // without testing each one could silently break.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
