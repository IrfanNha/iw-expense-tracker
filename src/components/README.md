# Components Directory Structure

Struktur direktori komponen yang terorganisir berdasarkan fungsi dan kegunaan.

## Struktur Direktori

```
src/components/
├── ui/                    # Shadcn UI components (HANYA komponen dari shadcn)
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── navigation-menu.tsx
│   ├── password-input.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── skeleton.tsx
│   ├── tabs.tsx
│   └── tooltip.tsx
│
├── forms/                 # Form components
│   ├── TransactionForm.tsx    # Form untuk menambah/edit transaksi
│   ├── TransferForm.tsx       # Form untuk transfer antar akun
│   ├── AccountSelect.tsx      # Select component untuk memilih akun
│   └── AmountInput.tsx        # Input component untuk jumlah uang
│
├── charts/                # Chart components
│   ├── DonutChart.tsx         # Donut chart untuk visualisasi data
│   └── IncomeExpenseChart.tsx # Chart untuk income vs expense
│
├── lists/                 # List components
│   └── TransactionList.tsx    # List component untuk menampilkan transaksi
│
├── features/              # Feature-specific components
│   ├── Turnstile.tsx          # Cloudflare Turnstile component
│   └── IconPicker.tsx         # Icon picker untuk akun dan kategori
│
└── layout/                # Layout/theme components
    ├── ThemeProvider.tsx      # Theme provider wrapper
    └── ThemeToggle.tsx        # Theme toggle button
```

## Aturan Penggunaan

### 1. `ui/` Directory
- **HANYA** untuk komponen dari shadcn/ui
- **JANGAN** menambahkan komponen custom di sini
- Semua komponen di sini adalah komponen dasar/primitif

### 2. `forms/` Directory
- Komponen yang terkait dengan form input
- Form components yang digunakan untuk input data
- Reusable form components

### 3. `charts/` Directory
- Komponen untuk visualisasi data
- Chart components menggunakan library seperti recharts
- Data visualization components

### 4. `lists/` Directory
- Komponen untuk menampilkan list/daftar data
- List components dengan pagination, filtering, dll

### 5. `features/` Directory
- Komponen yang spesifik untuk fitur tertentu
- Third-party integrations (seperti Turnstile)
- Feature-specific UI components

### 6. `layout/` Directory
- Komponen yang terkait dengan layout aplikasi
- Theme-related components
- Layout wrappers

## Import Examples

```typescript
// UI Components (shadcn)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Form Components
import { TransactionForm } from "@/components/forms/TransactionForm";
import { AccountSelect } from "@/components/forms/AccountSelect";

// Chart Components
import { DonutChart } from "@/components/charts/DonutChart";

// List Components
import { TransactionList } from "@/components/lists/TransactionList";

// Feature Components
import { Turnstile } from "@/components/features/Turnstile";
import { IconPicker } from "@/components/features/IconPicker";

// Layout Components
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
```

## Best Practices

1. **Jangan mencampur komponen custom dengan shadcn components**
   - Semua shadcn components harus di `ui/`
   - Komponen custom harus di direktori yang sesuai

2. **Gunakan direktori yang sesuai dengan fungsi komponen**
   - Form-related → `forms/`
   - Chart-related → `charts/`
   - List-related → `lists/`
   - Feature-specific → `features/`
   - Layout-related → `layout/`

3. **Buat komponen reusable**
   - Jika komponen digunakan di banyak tempat, letakkan di direktori yang sesuai
   - Jika komponen sangat spesifik untuk satu fitur, bisa di `features/`

4. **Naming convention**
   - Gunakan PascalCase untuk nama file
   - Nama file harus deskriptif dan jelas

## Menambahkan Komponen Baru

1. Tentukan kategori komponen (form, chart, list, feature, layout)
2. Buat file di direktori yang sesuai
3. Update import statements di file yang menggunakan komponen tersebut
4. Update dokumentasi ini jika perlu

