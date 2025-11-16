# Deployment Guide

## Prisma Configuration for Production

This project uses Prisma with custom output path. Make sure Prisma Client is generated correctly during deployment.

### Important Configuration

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Binary targets configured for multiple platforms: `native`, `rhel-openssl-3.0.x`, `linux-musl-openssl-3.0.x`
   - Output path: `../src/generated/prisma`

2. **Build Process**
   - `postinstall` script automatically runs `prisma generate`
   - `build` script runs `prisma generate && next build`

### Deployment Platforms

#### Vercel

Vercel will automatically:
1. Run `npm install` (which triggers `postinstall` → `prisma generate`)
2. Run `npm run build` (which also runs `prisma generate`)

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Secret key for JWT
- `APP_ENV=production` - Set to production
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret (production)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key (production)

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build` (or leave default)
- Install Command: `npm install` (or leave default)
- Output Directory: `.next` (default)

#### Railway

1. Connect your GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Railway will automatically run `npm install` and `npm run build`

#### Other Platforms

Make sure your deployment platform:
1. Runs `npm install` (triggers `postinstall` → `prisma generate`)
2. Runs `npm run build` (includes `prisma generate`)
3. Includes `src/generated/prisma` in the deployment package

### Troubleshooting

#### Error: "Prisma Client could not locate the Query Engine"

**Solution:**
1. Ensure `prisma generate` runs during build
2. Check that `binaryTargets` in `prisma/schema.prisma` includes your platform
3. Verify `src/generated/prisma` is included in deployment
4. For Vercel, check Build Logs to confirm `prisma generate` ran

#### Login Not Working / Hanging After Deploy

**Common Causes:**
1. **Missing NEXTAUTH_URL** - Must be set to your production domain (e.g., `https://your-app.vercel.app`)
2. **Missing NEXTAUTH_SECRET** - Generate with `openssl rand -base64 32`
3. **Session not being created** - Check browser console and server logs

**Solution:**
1. Verify environment variables in your deployment platform:
   ```bash
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here
   ```
2. Check browser console for errors (F12 → Console)
3. Check server logs for NextAuth errors
4. Ensure `trustHost: true` is set in `nextauth-config.ts` (already configured)
5. Try clearing browser cookies and cache
6. Verify database connection is working (registration works, so this should be OK)

**Debug Steps:**
- Open browser DevTools (F12)
- Go to Network tab
- Try logging in
- Check for failed requests to `/api/auth/callback/credentials`
- Check Console tab for JavaScript errors

#### Error: "EPERM: operation not permitted"

This usually happens on Windows when files are locked. Solutions:
- Close any processes using Prisma files
- Restart your IDE/terminal
- Run `npm run db:generate` again

### Pre-Deployment Checklist

- [ ] `DATABASE_URL` is set correctly
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- [ ] `APP_ENV=production` is set
- [ ] Cloudflare Turnstile keys are configured (production only)
- [ ] Database migrations are applied (`prisma migrate deploy` or `prisma db push`)
- [ ] Build completes successfully locally (`npm run build`)

### Database Migrations

For production, use:
```bash
prisma migrate deploy
```

This applies all pending migrations without creating new ones.

### Testing Production Build Locally

```bash
# Generate Prisma Client
npm run db:generate

# Build for production
npm run build

# Start production server
npm run start
```

