# Perbaikan untuk Deployment

## Masalah yang Diperbaiki

### 1. ✅ NextAuth Tidak Bekerja di Production
**Masalah:** NextAuth tidak berfungsi setelah deploy ke Vercel.

**Perbaikan:**
- ✅ Memperbaiki syntax error di `src/lib/nextauth-config.ts` (menghapus `} as NextAuthOptions;` yang duplikat)
- ✅ Menambahkan `url: process.env.NEXTAUTH_URL` secara eksplisit
- ✅ Memastikan `trustHost: true` sudah dikonfigurasi
- ✅ Memperbarui `vercel.json` dengan `NEXTAUTH_URL` default
- ✅ Memperbarui middleware untuk menangani auth routes dengan benar

**File yang Diubah:**
- `src/lib/nextauth-config.ts`
- `src/middleware.ts`
- `vercel.json`

### 2. ✅ Error Build CSS & Tailwind CSS v4
**Masalah:** Error build terkait CSS import dengan Tailwind CSS v4 di production build di Vercel.

**Error yang Terjadi:**
```
Error: Cannot find module '@tailwindcss/postcss'
```

**Penyebab:**
- `@tailwindcss/postcss` dan `tailwindcss` ada di `devDependencies`, sehingga tidak terinstall saat production build
- PostCSS tidak bisa menemukan plugin yang diperlukan

**Perbaikan:**
- ✅ Memindahkan `@tailwindcss/postcss` dan `tailwindcss` ke `dependencies` (diperlukan saat build)
- ✅ Memperbarui PostCSS config dengan format object yang benar
- ✅ Memastikan CSS diimport hanya di Server Component (layout.tsx)
- ✅ Menambahkan Node.js engine requirement di package.json
- ✅ Membersihkan next.config.ts dari konfigurasi yang tidak diperlukan

**File yang Diubah:**
- `package.json` - Memindahkan tailwindcss dan @tailwindcss/postcss ke dependencies
- `postcss.config.mjs` - Memperbaiki format plugins (object bukan array)
- `next.config.ts` - Membersihkan konfigurasi

### 3. ✅ Optimasi Production
**Perbaikan:**
- ✅ Menambahkan `optimizePackageImports` untuk lucide-react dan @radix-ui
- ✅ Memastikan environment variables ditangani dengan benar
- ✅ Memperbarui `DEPLOYMENT.md` dengan instruksi yang lebih jelas

**File yang Diubah:**
- `next.config.ts`
- `DEPLOYMENT.md`

## Langkah Deployment ke Vercel

### 1. Set Environment Variables di Vercel

Pastikan semua environment variables berikut sudah diset di Vercel Dashboard:

```
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=https://iw-expense-tracker.vercel.app
NEXTAUTH_SECRET=<generate-dengan-openssl-rand-base64-32>
APP_ENV=production
TURNSTILE_SECRET_KEY=<your-turnstile-secret>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-turnstile-site-key>
```

**PENTING:**
- `NEXTAUTH_URL` harus sama persis dengan URL Vercel Anda (tanpa trailing slash)
- `NEXTAUTH_SECRET` harus di-generate dengan: `openssl rand -base64 32`
- Jangan lupa set `DATABASE_URL` ke database production Anda

### 2. Deploy ke Vercel

1. Push semua perubahan ke repository
2. Vercel akan otomatis detect perubahan dan rebuild
3. Atau trigger manual deploy dari Vercel Dashboard

### 3. Verifikasi Deployment

Setelah deploy, pastikan:
- ✅ Build berhasil tanpa error
- ✅ NextAuth bisa login (test di `/login`)
- ✅ Dashboard bisa diakses setelah login
- ✅ Tidak ada error di browser console
- ✅ Tidak ada error di Vercel logs

## Testing Locally

Sebelum deploy, test build production secara lokal:

```bash
# Generate Prisma Client
npm run db:generate

# Build untuk production
npm run build

# Test production build
npm run start
```

## Troubleshooting

### Jika NextAuth Masih Tidak Bekerja:

1. **Cek Environment Variables:**
   - Pastikan `NEXTAUTH_URL` sudah diset dengan benar
   - Pastikan `NEXTAUTH_SECRET` sudah diset
   - Pastikan tidak ada typo di environment variable names

2. **Cek Vercel Logs:**
   - Buka Vercel Dashboard → Project → Logs
   - Cari error terkait NextAuth
   - Pastikan database connection berfungsi

3. **Cek Browser Console:**
   - Buka DevTools (F12)
   - Cek Network tab untuk request ke `/api/auth/callback/credentials`
   - Cek Console tab untuk JavaScript errors

### Jika Build Error:

1. **Cek Prisma:**
   - Pastikan `prisma generate` berjalan dengan sukses
   - Pastikan `DATABASE_URL` sudah diset

2. **Cek Dependencies:**
   - Hapus `node_modules` dan `package-lock.json`
   - Jalankan `npm install` lagi

3. **Cek TypeScript Errors:**
   - Jalankan `npm run lint` untuk cek errors
   - Pastikan semua types sudah benar

## File yang Diubah

1. `src/lib/nextauth-config.ts` - Fix NextAuth configuration
2. `src/middleware.ts` - Improve middleware untuk auth routes
3. `next.config.ts` - Optimasi dan fix CSS handling
4. `vercel.json` - Tambah NEXTAUTH_URL default
5. `DEPLOYMENT.md` - Update dokumentasi

## Catatan Penting

- Pastikan database migrations sudah dijalankan di production
- Pastikan semua environment variables sudah diset sebelum deploy
- Test build production secara lokal sebelum push ke production
- Monitor Vercel logs setelah deploy untuk memastikan tidak ada error

