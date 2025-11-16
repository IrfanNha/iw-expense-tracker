# IW Expense Tracker

A modern, full-featured expense tracking application built with Next.js, featuring secure authentication, multi-account management, transaction tracking, and comprehensive financial reporting.

## 🚀 Features

- **User Authentication**: Secure login/registration with PIN-based authentication
- **Multi-Account Management**: Support for Cash, Bank, Card, E-Wallet, and other account types
- **Transaction Tracking**: Record income and expenses with categories
- **Transfer Management**: Transfer funds between accounts
- **Financial Reports**: Monthly reports with charts and analytics
- **Category Management**: Customizable income and expense categories
- **Dark Mode**: Built-in theme support with dark/light mode toggle
- **Security**: Cloudflare Turnstile integration for bot protection (production only)

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16.0.3** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type-safe development

### Database & ORM
- **Prisma 6.19.0** - Next-generation ORM
- **PostgreSQL** - Primary database (configurable)

### Authentication
- **NextAuth.js 4.24.13** - Authentication library
- **bcryptjs 3.0.3** - Password hashing

### UI Components
- **Radix UI** - Accessible component primitives
  - Dialog, Dropdown Menu, Select, Tabs, Tooltip, and more
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts 3.4.1** - Chart library for data visualization

### Form Management
- **React Hook Form 7.66.0** - Form state management
- **Zod 4.1.12** - Schema validation
- **@hookform/resolvers** - Form validation integration

### State Management
- **Zustand 5.0.8** - Lightweight state management
- **TanStack Query 5.90.9** - Data fetching and caching

### Security
- **Cloudflare Turnstile** - Bot protection (production only)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**
- **PostgreSQL** database (or use SQLite for development)
- **Git**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iw-expense-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in the required values (see [Environment Variables](#environment-variables) section).

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database with sample data
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:password@localhost:5432/expense_tracker` |
| `NEXTAUTH_URL` | Base URL of your application | Yes | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key for JWT encryption | Yes | Generate with `openssl rand -base64 32` |
| `APP_ENV` | Application environment | No | `development` or `production` |
| `NEXT_PUBLIC_APP_ENV` | Public app environment (client-side) | No | `development` or `production` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | Production | Get from Cloudflare dashboard |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | Production | Get from Cloudflare dashboard |
| `PIN_SALT_ROUNDS` | Bcrypt salt rounds for PIN hashing | No | `12` (default) |

### Development vs Production

- **Development**: Turnstile is automatically disabled when `APP_ENV=development` or `NODE_ENV=development`
- **Production**: All security features including Turnstile are enabled

## 📖 Usage

### Getting Started

1. **Register an Account**
   - Navigate to `/register`
   - Enter your name, email, and create a PIN (6-10 digits)
   - Complete the security verification (if in production)

2. **Login**
   - Go to `/login`
   - Enter your email and PIN
   - Access your dashboard

3. **Create Accounts**
   - Navigate to Dashboard → Accounts
   - Add accounts (Cash, Bank, Card, E-Wallet, etc.)
   - Set initial balances

4. **Add Categories**
   - Go to Dashboard → Categories
   - Create income and expense categories
   - Customize with icons

5. **Record Transactions**
   - Navigate to Dashboard → Transactions
   - Add income or expense transactions
   - Select account and category
   - Add notes and set date

6. **Transfer Funds**
   - Go to Dashboard → Transfer
   - Transfer money between accounts
   - Track transfer history

7. **View Reports**
   - Check Dashboard for overview
   - View monthly income/expense charts
   - Analyze spending patterns

## 🚀 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - Add all environment variables from `.env.example`
   - Set `APP_ENV=production`
   - Configure `DATABASE_URL` with your production database
   - Add Turnstile keys for production

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

### Other Platforms

#### Railway
1. Connect your GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

#### Docker
```bash
# Build the image
docker build -t iw-expense-tracker .

# Run the container
docker run -p 3000:3000 --env-file .env iw-expense-tracker
```

### Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Configure production database
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Configure `NEXTAUTH_URL` with production domain
- [ ] Add Cloudflare Turnstile keys
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Verify security features

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database with sample data |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |

## 🏗️ Project Structure

```
iw-expense-tracker/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/               # API routes
│   │   │   ├── accounts/
│   │   │   ├── auth/
│   │   │   ├── categories/
│   │   │   ├── register/
│   │   │   ├── reports/
│   │   │   ├── transaction/
│   │   │   ├── transfer/
│   │   │   └── turnstile/
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── ui/                # UI components
│   │   └── Turnstile.tsx
│   ├── generated/             # Generated Prisma client
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript types
├── scripts/
│   └── seed.ts                # Database seeding script
├── public/                    # Static assets
└── .env.example              # Environment variables template
```

## 🔒 Security Features

- **PIN-based Authentication**: Secure login with bcrypt hashing
- **JWT Sessions**: Secure session management with NextAuth
- **Cloudflare Turnstile**: Bot protection in production
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Environment-based Security**: Development mode bypasses security checks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**MIT License**

Copyright (c) 2024 IW Expense Tracker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
