# NIRVI — Handcrafted Fashion Studio

A modern e-commerce web application for NIRVI, a fashion startup dedicated to creating customized, handcrafted products that blend street culture with artisanal craftsmanship.

## Tech Stack

- **React 18** with JavaScript (JSX)
- **Vite** — build tool & dev server
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component library
- **Framer Motion** — animations & scroll interactions
- **React Router** — client-side routing

## Features

- 🎬 Apple-style scroll-based hero animation (240 frame image sequence)
- 🛍️ Product catalog with category filtering
- 🛒 Shopping cart with quantity management
- ❤️ Wishlist functionality
- 👤 User authentication (login/signup)
- 📱 Fully responsive & mobile-optimized
- 🎨 Full-width fluid layout design

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/         # shadcn/ui components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── HeroCanvas.jsx
│   └── ProductCard.jsx
├── context/        # React context providers
├── data/           # Product data
├── hooks/          # Custom hooks
├── lib/            # Utilities
└── pages/          # Route pages
```

## License

© 2026 NIRVI. All rights reserved.
