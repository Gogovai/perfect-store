# Perfect Store - Multi-Vendor Marketplace

A production-grade multi-vendor e-commerce marketplace built with modern web technologies. Perfect Store connects buyers and sellers in Ghana with a focus on quality, security, and user experience.

## 🎯 Project Status

**Current Phase:** Foundation Setup ✅

This is the initial foundation phase. Database schema, core features (products, cart, checkout, payments), and seller/admin functionality will be implemented in subsequent phases.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library (Button, Input, Card, Badge, Container, Loading)
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage
- **State Management:** Zustand (for global client state)
- **Form Handling:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📁 Project Structure

```
perfect-store/
├── app/                      # Next.js App Router
│   ├── (storefront)/        # Main marketplace routes
│   ├── seller/              # Seller dashboard routes
│   ├── admin/               # Admin dashboard routes
│   ├── auth/                # Authentication routes
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components (Header, Footer)
│   ├── products/            # Product-related components
│   ├── cart/                # Shopping cart components
│   ├── checkout/            # Checkout components
│   ├── seller/              # Seller components
│   └── admin/               # Admin components
├── lib/                     # Utility functions and libraries
│   ├── supabase/            # Supabase client and server setup
│   ├── validations/         # Zod validation schemas
│   └── utils/               # Helper functions
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand stores for global state
├── types/                   # TypeScript type definitions
├── config/                  # Configuration files
├── public/                  # Static assets
├── supabase/                # Supabase migrations and seeds
│   ├── migrations/          # Database migrations
│   └── seed/                # Database seed data
├── .env.example             # Environment variables template
├── .env.local               # Local environment variables (gitignored)
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── next.config.ts           # Next.js configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+
- npm or yarn
- A Supabase project ([Create one here](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd perfect-store
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local and add your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database
npm run db:migrate   # Run database migrations (coming soon)
npm run db:seed      # Seed database (coming soon)
```

## 🔐 Security Considerations

### Environment Variables

- **NEXT_PUBLIC_*** variables are exposed to the browser and are safe for public information
- **SUPABASE_SERVICE_ROLE_KEY** must NEVER be exposed to the client and should only be used in server-side code
- Always use `.env.local` for development and keep it in `.gitignore`

### Supabase Security

- All database access uses Row Level Security (RLS) policies
- Authentication is handled through Supabase Auth
- File uploads use Supabase Storage with signed URLs
- API routes act as a secure intermediary between the client and Supabase

### Data Validation

- All user input is validated using Zod schemas
- TypeScript ensures type safety throughout the application
- Form validation happens on both client and server

## 🎨 Design System

### Colors

- **Primary:** Blue (#2563eb)
- **Secondary:** Gray (#6b7280)
- **Success:** Green (#10b981)
- **Danger:** Red (#ef4444)
- **Warning:** Yellow (#f59e0b)

### Typography

- **Font Family:** Geist Sans (primary), Geist Mono (code)
- **Font Sizes:** Responsive scaling for mobile-first design
- **Line Heights:** Optimized for readability

### Components

All reusable components are located in `components/ui/`:

- **Button:** Primary, secondary, outline, ghost, and danger variants
- **Input:** Form input with validation and error states
- **Card:** Container with optional header, content, and footer
- **Badge:** Status badges with multiple variants
- **Container:** Responsive max-width container
- **Loading:** Spinner with optional fullscreen mode

## 📦 Dependencies

### Core
- `next` - React framework
- `react` / `react-dom` - UI library
- `typescript` - Type safety

### UI & Styling
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon library
- `class-variance-authority` - Component variants
- `clsx` - Conditional classnames
- `tailwind-merge` - Merge Tailwind classes

### Forms & Validation
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Form validation resolvers

### State Management
- `zustand` - Lightweight state management

### Backend Services
- `@supabase/supabase-js` - Supabase client library

## 🔄 Development Workflow

1. Create a new branch for your feature
2. Make your changes following the project conventions
3. Ensure TypeScript has no errors: `npm run type-check`
4. Run ESLint: `npm run lint`
5. Submit a pull request

## 📚 Architecture Decisions

### Server vs Client Components

- Use Server Components (`'use server'`) for data fetching and authentication checks
- Use Client Components (`'use client'`) for interactivity and form handling
- Keep business logic in Server Components when possible

### State Management

- **Global State:** Zustand stores in `/stores`
- **Form State:** React Hook Form
- **Server State:** Supabase queries in Server Components
- **URL State:** URL searchParams for filters and pagination

### Folder Organization

- **Components:** Organized by feature/domain
- **Types:** Centralized TypeScript interfaces
- **Utils:** Reusable functions grouped by purpose
- **Hooks:** Custom React hooks for reusable logic

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 Upcoming Phases

- [ ] Database schema design and migrations
- [ ] Product management and listing
- [ ] Shopping cart and checkout flow
- [ ] Payment processing
- [ ] Seller dashboard
- [ ] Admin dashboard
- [ ] User authentication flows
- [ ] Order management
- [ ] Reviews and ratings
- [ ] Search and filtering

## 🤝 Contributing

This is an active development project. Please follow the established patterns and conventions when contributing.

## 📄 License

To be defined.

## 💬 Support

For questions and support, please reach out to the development team.

---

**Last Updated:** September 2026
**Foundation Version:** 1.0.0
