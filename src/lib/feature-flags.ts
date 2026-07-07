/**
 * Feature Flags — Single Source of Truth
 *
 * Semua flag dibaca dari environment variables.
 * File ini hanya berjalan di server (Node.js runtime).
 * Gunakan helper di bawah ini di API routes, middleware, dan Server Components.
 */

/** Apakah registrasi user baru diizinkan. Default: false (closed). */
export const isRegisterEnabled =
  process.env.APP_ENABLE_REGISTER === "true";

/**
 * Apakah Cloudflare Turnstile aktif.
 *
 * Aturan hierarki:
 * - development → selalu OFF (tidak peduli nilai flag)
 * - production  → ON kecuali APP_ENABLE_CLOUDFLARE_TURNSTILE="false"
 */
export const isTurnstileEnabled =
  process.env.APP_ENV !== "development" &&
  process.env.NODE_ENV !== "development" &&
  process.env.APP_ENABLE_CLOUDFLARE_TURNSTILE !== "false";
