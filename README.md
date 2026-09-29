# 🎨 Taleex Portfolio

A personal portfolio and content-management app built with React 18, TypeScript, Vite, and Supabase. The public portfolio reads editable content from Supabase; the authenticated admin manages that content.

**Created by:** [Taleex](https://github.com/taleex)

Preview: https://taleex.netlify.app/

<img width="1909" height="986" alt="Captura de ecrã 2025-10-03 124617" src="https://github.com/user-attachments/assets/cf51ddd3-1378-4c86-af97-e262a88a7ba9" />

---

## 🌟 Project Concept

The public site and admin CMS are backed by Supabase. Public content is maintained in the database and can be backed up as a versioned JSON snapshot.

### Key Features

- **🎯 Dynamic Content Management**: Edit everything through an intuitive admin panel
- **🔐 Secure Authentication**: Built-in user authentication system
- **📧 Contact System**: Integrated contact form with email notifications
- **💬 Feedback Widget**: Interactive chat widget for visitor feedback
- **🎨 Dark/Light Mode**: Seamless theme switching
- **📱 Fully Responsive**: Optimized for all devices and screen sizes
- **🔍 Search metadata**: Page-level title/description tags and Person JSON-LD
- **🗺️ Sitemap**: Static sitemap for the public routes

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **React Router** - Client-side routing
- **Lucide React** - Icon system
- **React Hook Form + Zod** - Form validation

### Backend

- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Edge Functions
  - Storage

### Additional Tools

- **React Query** - Server state management
- **date-fns** - Date utilities
- **Sonner** - Toast notifications

---

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin panel components
│   ├── about/          # About section components
│   ├── contact/        # Contact form components
│   ├── experience/     # Experience cards
│   ├── hero/           # Hero section components
│   ├── projects/       # Project showcase
│   ├── skills/         # Skills display
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── data/               # Static data files
├── lib/                # Utility functions
├── styles/             # Global styles
├── types/              # TypeScript types
└── integrations/       # Supabase integration

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/taleex/PF_Taleex.git
   cd PF_Taleex
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env`
   - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`

4. **Run database migrations**
   - Apply the checked-in migrations to the Supabase project. Existing table foundations are expected to be present in that project.

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`

---

## 🎨 Customization

### Admin Panel Access

1. Navigate to `/auth`
2. Sign up with your email
3. Access the admin panel at `/admin`
4. Manage all content through the intuitive interface

### Admin Panel Features

- **Profile Editor**: Update personal information, bio, and avatar
- **Projects Manager**: Add, edit, and reorder projects
- **Experience Timeline**: Manage work history
- **Skills Grid**: Organize skills by categories
- **Contact Info**: Update contact details
- **Page Sections**: Edit section titles and descriptions
- **Messages Viewer**: View contact submissions and feedback
- **Education, courses, and languages**: Prepare and reorder background records in Admin; public sections are not wired yet
- **Portfolio Data**: Validate, export, stage a version 2 JSON snapshot, and explicitly publish it to live content

### Styling

The project uses a comprehensive design system:

- Colors are defined in `src/index.css` using CSS variables
- Tailwind config in `tailwind.config.ts`
- Component-specific styles in `src/styles/`

---

## 📊 Database Schema

### Tables

- **profiles**: User profile information
- **projects**: Portfolio projects with tags and links
- **experiences**: Work experience timeline
- **skills**: Technical skills organized by categories
- **skill_categories**: Skill groupings
- **contact_info**: Contact information display
- **contact_submissions**: Messages from contact form
- **feedback_messages**: Chat widget feedback
- **page_sections**: Editable page section content
- **site_content**: General site content
- **site_images**: Managed images
- **education**, **courses**, and **languages**: Background content managed in Admin; the public UI is not connected yet

Content tables use public-read and administrator-write policies. Message and role data are not part of portfolio JSON exports.

---

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase Auth
- Protected admin routes
- Environment variables are read from a local `.env` file; never commit that file
- Input validation with Zod schemas
- XSS protection

### Additional Security Setup

**Enable Password Protection** (recommended):

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Policies → Password
3. Enable "Leaked Password Protection"
4. Set minimum password requirements (min 8 characters, uppercase, lowercase, numbers)

---

## 📧 Email Configuration

The contact form uses Supabase Edge Functions to send emails:

1. Configure your email service in `supabase/functions/send-contact-email/`
2. Set up required secrets in Supabase Dashboard
3. Deploy the edge function

---

## 🚀 Deployment

### Deploy to Lovable (Recommended)

1. Click the "Publish" button in Lovable
2. Your site will be live at `yoursite.lovable.app`
3. Configure custom domain in project settings (paid plans)

### Deploy to Other Platforms

The project can be deployed to:

- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

Build command: `npm run build`  
Output directory: `dist`

---

## 🎯 SEO Optimization

The app updates title, description, keywords, Open Graph, Twitter Card, and canonical tags at runtime. It emits Person JSON-LD and includes a static sitemap and `robots.txt`. These are implementation notes, not Lighthouse or accessibility certification claims.

---

## 📱 Features Walkthrough

### For Visitors

- **Browse Projects**: View detailed project showcases with filters
- **Read About**: Learn about skills, experience, and background
- **Get in Touch**: Use the contact form to send messages
- **Give Feedback**: Use the chat widget for suggestions
- **Responsive Design**: Enjoy on any device

### For Admin (You)

- **Quick Updates**: Change content without redeploying
- **Message Management**: View and respond to inquiries
- **Content Organization**: Drag-and-drop reordering
- **Real-time Preview**: See changes immediately
- **Secure Access**: Protected admin panel

---

## 🤝 Contributing

This is a personal portfolio project, but feel free to:

- Fork it for your own use
- Submit issues for bugs
- Suggest improvements
- Share your customizations

---

## 📄 License

No `LICENSE` file is currently included; use and redistribution rights have not been declared in this repository.

---

## 👨‍💻 About the Creator

**Jorge Matos (Taleex)** - Frontend Developer (React & Next.js)

This repository contains a personal portfolio and its content-management app.

- Focus on clean, maintainable code
- Emphasis on user experience
- Built with scalability in mind
- Designed for easy customization

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Backend by [Supabase](https://supabase.com)

---

## 📞 Support

For questions or support:

- Open an issue on GitHub
- Contact through the portfolio website
- Check the documentation

---

**Made with ❤️ by Taleex**

_Building the web, one component at a time._
