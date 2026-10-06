# 🎨 Taleex Portfolio

A modern, full-stack personal portfolio website built with React, TypeScript, and Supabase. This project showcases a complete portfolio solution with dynamic content management, user authentication, and an intuitive admin panel.

**Created by:** [Taleex](https://github.com/taleex)

Preview: https://taleex.netlify.app/

<img width="1909" height="986" alt="Captura de ecrã 2025-10-03 124617" src="https://github.com/user-attachments/assets/cf51ddd3-1378-4c86-af97-e262a88a7ba9" />

---

## 🌟 Project Concept

This portfolio website is designed to be more than just a static showcase—it's a fully dynamic, database-driven application that allows complete control over content without touching code. Built with modern web technologies and best practices, it demonstrates the perfect blend of aesthetic design and functional excellence.

### Key Features

- **🎯 Dynamic Content Management**: Edit everything through an intuitive admin panel
- **🔐 Secure Authentication**: Built-in user authentication system
- **📧 Contact System**: Integrated contact form with email notifications
- **💬 Feedback Widget**: Interactive chat widget for visitor feedback
- **🎨 Dark/Light Mode**: Seamless theme switching
- **📱 Fully Responsive**: Optimized for all devices and screen sizes
- **⚡ Performance Optimized**: Fast loading with modern bundling
- **🔍 SEO Ready**: Comprehensive meta tags and structured data
- **♿ Accessible**: WCAG compliant with semantic HTML

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

- Node.js 18+ or Bun
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Update `src/integrations/supabase/client.ts` with your credentials

4. **Run database migrations**
   - The project includes all necessary table schemas
   - Tables are automatically created in your Supabase project

5. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
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

All tables include Row Level Security (RLS) policies for data protection.

---

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase Auth
- Protected admin routes
- Environment variable management
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

The portfolio includes comprehensive SEO features:
- Dynamic meta tags per page
- Open Graph tags for social sharing
- Structured data (JSON-LD)
- Semantic HTML5 elements
- Optimized images with alt text
- Sitemap ready
- robots.txt configured

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

This project is open source and available under the MIT License.

---

## 👨‍💻 About the Creator

**Taleex** - Full-Stack Developer

This portfolio was created to demonstrate modern web development practices and to serve as a comprehensive template for other developers looking to build their own dynamic portfolio websites.

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

*Building the web, one component at a time.*
