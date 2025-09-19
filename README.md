# BabaWina - Spot-the-Ball Competition Platform

A modern, production-ready Next.js application for running "Spot-the-Ball" competitions. Built for South Africa with Supabase backend, AI-powered ball detection, and a comprehensive admin panel.

## Features

- 🎯 **Interactive Game Canvas** - Pan, zoom, and place crosshair with pixel precision
- 🤖 **AI Ball Processing** - Automated ball detection and inpainting using external APIs
- 👨‍💼 **Admin Panel** - Complete competition management with AI processing buttons
- 🏆 **Winners System** - Transparent judging and winner announcements
- 🔐 **Authentication** - Secure user accounts with Supabase Auth
- 📱 **Mobile-First** - Responsive design optimized for all devices
- ⚡ **Performance** - Lighthouse scores: Performance ≥90, SEO ≥95
- 🇿🇦 **South African** - ZAR currency, local support, SA-focused design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **UI Components**: Radix UI + Custom components
- **Deployment**: Vercel (recommended)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd babawina
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.babawina.co.za

# AI Processing APIs (Optional - for real AI integration)
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the database schema:
   - Copy contents of `supabase-schema.sql`
   - Paste into Supabase SQL Editor
   - Execute the script

3. Set up Storage buckets (should be created by schema):
   - `competition-raw` (private)
   - `competition-images` (public)
   - `masks` (private)
   - `winner-media` (public)

### 4. Create Admin Account

1. Start the development server: `npm run dev`
2. Sign up through the UI with your admin email
3. In Supabase, update the user's role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

### 5. Seed Demo Data (Optional)

1. Get your admin user ID from Supabase auth.users table
2. Edit `seed-demo-data.sql` and replace `your-admin-user-id-here`
3. Run the seed script in Supabase SQL Editor

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── legal/             # Legal pages
│   ├── play/              # Game page
│   └── winners/           # Winners page
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── auth/             # Authentication
│   ├── game/             # Game canvas
│   ├── home/             # Homepage
│   ├── ui/               # Base UI components
│   └── winners/          # Winners display
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and config
└── styles/               # Global styles
```

## Key Features Explained

### Game Canvas
- **Pan & Zoom**: Smooth interaction with large images
- **Crosshair Placement**: Pixel-perfect positioning
- **Keyboard Navigation**: Arrow keys for fine adjustments
- **Mobile Support**: Touch-friendly controls

### AI Ball Processing
The `/api/ball-processor` endpoint orchestrates:
1. **Ball Detection**: YOLOv8/Grounding-DINO for object detection
2. **Mask Generation**: SAM for precise segmentation
3. **Inpainting**: LaMa/Stable Diffusion for ball removal

Current implementation uses mock responses. To integrate real AI:
- Uncomment the example code in `ball-processor/route.ts`
- Add your API keys to environment variables
- Configure the specific AI service endpoints

### Admin Workflow
1. **Create Competition**: Set prize, dates, entry price
2. **Upload Raw Photo**: Image with ball visible
3. **Get Coordinates**: AI detects ball position
4. **Review & Adjust**: Manual override if needed
5. **Remove Ball**: AI inpainting creates game image
6. **Set Live**: Competition becomes playable
7. **Judge & Announce**: Calculate winners, publish results

### Database Schema
- **profiles**: User accounts and roles
- **competitions**: Competition details and AI processing status
- **entries**: User submissions with coordinates
- **winners**: Calculated results and rankings

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_SITE_URL=https://www.babawina.co.za
```

## AI Integration

### Current Status
- Mock implementation for development/testing
- Returns realistic sample data
- Simulates processing delays

### Production Integration
To integrate real AI services:

1. **Replicate** (Recommended):
   ```typescript
   // Uncomment the example code in ball-processor/route.ts
   // Add REPLICATE_API_TOKEN to environment
   ```

2. **OpenAI/Azure**:
   ```typescript
   // Custom integration for GPT-4 Vision or Azure Computer Vision
   ```

3. **Google Cloud Vision**:
   ```typescript
   // Integration with Google's ML APIs
   ```

## Security Features

- **Row Level Security**: Supabase RLS policies
- **Role-based Access**: Admin vs user permissions
- **IP Tracking**: Fraud prevention (hashed)
- **Entry Limits**: One entry per user per competition
- **Input Validation**: Zod schemas for all forms

## Performance Optimizations

- **Next.js Image**: Optimized image loading
- **Edge Functions**: Fast API responses
- **Database Indexes**: Optimized queries
- **Lazy Loading**: Components and images
- **Bundle Optimization**: Tree shaking and code splitting

## Legal Compliance

- **Age Verification**: 18+ only enforcement
- **Terms of Service**: Comprehensive legal coverage
- **Privacy Policy**: GDPR/POPIA compliant
- **Responsible Gaming**: Resources and limits

## Support & Maintenance

### Monitoring
- Set up error tracking (Sentry recommended)
- Monitor Supabase usage and performance
- Track Lighthouse scores regularly

### Backups
- Supabase handles database backups
- Consider additional backup strategy for critical data
- Document recovery procedures

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test thoroughly before production deployments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary. All rights reserved.

## Support

For technical support or questions:
- Email: support@babawina.co.za
- Documentation: This README
- Issues: GitHub Issues (if applicable)

---

Built with ❤️ in South Africa 🇿🇦