// Auto-generated manifest for /presentation route

export type PresentationCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
};

export type PresentationVariant = {
  id: string;
  categoryId: string;
  categorySlug: string;
  name: string;
  description: string;
};

export const PRESENTATION_CATEGORIES: PresentationCategory[] = [
  { id: "01-auth", slug: "auth", title: "Auth Forms", description: "Login, signup, magic link, SSO", color: "bg-amber-500" },
  { id: "02-pricing", slug: "pricing", title: "Pricing", description: "Tabelas, tiers, toggles, calculadoras", color: "bg-emerald-500" },
  { id: "03-features-bento", slug: "features", title: "Features & Bento", description: "Grids, bentos, acordeões, tabs", color: "bg-indigo-500" },
  { id: "04-hero", slug: "hero", title: "Hero Sections", description: "Heros animados, split, typography, 3D", color: "bg-orange-500" },
  { id: "05-cta-banners", slug: "cta", title: "CTA Banners", description: "Full-bleed, sticky, email capture, urgência", color: "bg-rose-500" },
  { id: "06-stats-bars", slug: "stats", title: "Stats & Social Proof", description: "Métricas, contadores, logo walls", color: "bg-cyan-500" },
  { id: "07-nav-bars", slug: "nav", title: "Navigation", description: "Navbars, sidebars, command palette, mobile tabs", color: "bg-violet-500" },
  { id: "08-testimonials", slug: "testimonials", title: "Testimonials", description: "Quote grids, marquees, video walls", color: "bg-pink-500" },
  { id: "09-footer", slug: "footer", title: "Footer", description: "Sitemaps, newsletters, minimal", color: "bg-slate-500" },
  { id: "10-faq", slug: "faq", title: "FAQ", description: "Accordions, chat, searchable, categorized", color: "bg-teal-500" },
  { id: "11-onboarding", slug: "onboarding", title: "Onboarding", description: "Checklists, tours, empty states", color: "bg-yellow-500" },
  { id: "12-blog-content", slug: "blog", title: "Blog & Content", description: "Magazine, reading, filters, search", color: "bg-lime-500" },
  { id: "13-contact", slug: "contact", title: "Contact", description: "Forms, channels, maps", color: "bg-sky-500" },
  { id: "14-states", slug: "states", title: "States", description: "404, loading, empty, cookie, errors", color: "bg-red-500" },
];

export const PRESENTATION_VARIANTS: PresentationVariant[] = [
  { id: "01a-split-screen", categoryId: "01-auth", categorySlug: "auth", name: "Split Screen", description: "Split Screen" },
  { id: "01b-centered-card", categoryId: "01-auth", categorySlug: "auth", name: "Centered Card", description: "Centered Card" },
  { id: "01c-full-bleed-image", categoryId: "01-auth", categorySlug: "auth", name: "Full Bleed Image", description: "Full Bleed Image" },
  { id: "01d-multi-step-wizard", categoryId: "01-auth", categorySlug: "auth", name: "Multi Step Wizard", description: "Multi Step Wizard" },
  { id: "01e-magic-link-only", categoryId: "01-auth", categorySlug: "auth", name: "Magic Link Only", description: "Magic Link Only" },
  { id: "01f-social-first", categoryId: "01-auth", categorySlug: "auth", name: "Social First", description: "Social First" },
  { id: "02a-classic-3-tier", categoryId: "02-pricing", categorySlug: "pricing", name: "Classic 3 Tier", description: "Classic 3 Tier" },
  { id: "02b-comparison-table", categoryId: "02-pricing", categorySlug: "pricing", name: "Comparison Table", description: "Comparison Table" },
  { id: "02c-single-tier-hero", categoryId: "02-pricing", categorySlug: "pricing", name: "Single Tier Hero", description: "Single Tier Hero" },
  { id: "02d-usage-slider", categoryId: "02-pricing", categorySlug: "pricing", name: "Usage Slider", description: "Usage Slider" },
  { id: "02e-credit-pack-grid", categoryId: "02-pricing", categorySlug: "pricing", name: "Credit Pack Grid", description: "Credit Pack Grid" },
  { id: "02f-monthly-annual-toggle", categoryId: "02-pricing", categorySlug: "pricing", name: "Monthly Annual Toggle", description: "Monthly Annual Toggle" },
  { id: "02g-enterprise-contact-card", categoryId: "02-pricing", categorySlug: "pricing", name: "Enterprise Contact Card", description: "Enterprise Contact Card" },
  { id: "02h-stacked-mobile-first", categoryId: "02-pricing", categorySlug: "pricing", name: "Stacked Mobile First", description: "Stacked Mobile First" },
  { id: "03a-icon-grid-3x3", categoryId: "03-features-bento", categorySlug: "features", name: "Icon Grid 3x3", description: "Icon Grid 3x3" },
  { id: "03b-bento-asymmetric", categoryId: "03-features-bento", categorySlug: "features", name: "Bento Asymmetric", description: "Bento Asymmetric" },
  { id: "03c-alternating-rows", categoryId: "03-features-bento", categorySlug: "features", name: "Alternating Rows", description: "Alternating Rows" },
  { id: "03d-accordion-list", categoryId: "03-features-bento", categorySlug: "features", name: "Accordion List", description: "Accordion List" },
  { id: "03e-tab-switcher", categoryId: "03-features-bento", categorySlug: "features", name: "Tab Switcher", description: "Tab Switcher" },
  { id: "03f-comparison-vs", categoryId: "03-features-bento", categorySlug: "features", name: "Comparison Vs", description: "Comparison Vs" },
  { id: "03g-video-showcase", categoryId: "03-features-bento", categorySlug: "features", name: "Video Showcase", description: "Video Showcase" },
  { id: "03h-interactive-preview", categoryId: "03-features-bento", categorySlug: "features", name: "Interactive Preview", description: "Interactive Preview" },
  { id: "04a-centered-text", categoryId: "04-hero", categorySlug: "hero", name: "Centered Text", description: "Centered Text" },
  { id: "04b-split-text-image", categoryId: "04-hero", categorySlug: "hero", name: "Split Text Image", description: "Split Text Image" },
  { id: "04c-animated-gradient", categoryId: "04-hero", categorySlug: "hero", name: "Animated Gradient", description: "Animated Gradient" },
  { id: "04d-typography-giant", categoryId: "04-hero", categorySlug: "hero", name: "Typography Giant", description: "Typography Giant" },
  { id: "04e-product-screenshot-below", categoryId: "04-hero", categorySlug: "hero", name: "Product Screenshot Below", description: "Product Screenshot Below" },
  { id: "04f-social-proof-inline", categoryId: "04-hero", categorySlug: "hero", name: "Social Proof Inline", description: "Social Proof Inline" },
  { id: "04g-video-autoplay-bg", categoryId: "04-hero", categorySlug: "hero", name: "Video Autoplay Bg", description: "Video Autoplay Bg" },
  { id: "04h-3d-hero-interactive", categoryId: "04-hero", categorySlug: "hero", name: "3d Hero Interactive", description: "3d Hero Interactive" },
  { id: "05a-full-bleed-gradient", categoryId: "05-cta-banners", categorySlug: "cta", name: "Full Bleed Gradient", description: "Full Bleed Gradient" },
  { id: "05b-sticky-bottom-bar", categoryId: "05-cta-banners", categorySlug: "cta", name: "Sticky Bottom Bar", description: "Sticky Bottom Bar" },
  { id: "05c-email-capture-inline", categoryId: "05-cta-banners", categorySlug: "cta", name: "Email Capture Inline", description: "Email Capture Inline" },
  { id: "05d-split-cta-image", categoryId: "05-cta-banners", categorySlug: "cta", name: "Split Cta Image", description: "Split Cta Image" },
  { id: "05e-centered-quote-cta", categoryId: "05-cta-banners", categorySlug: "cta", name: "Centered Quote Cta", description: "Centered Quote Cta" },
  { id: "05f-countdown-urgency", categoryId: "05-cta-banners", categorySlug: "cta", name: "Countdown Urgency", description: "Countdown Urgency" },
  { id: "05g-multi-step-cta", categoryId: "05-cta-banners", categorySlug: "cta", name: "Multi Step Cta", description: "Multi Step Cta" },
  { id: "06a-horizontal-row", categoryId: "06-stats-bars", categorySlug: "stats", name: "Horizontal Row", description: "Horizontal Row" },
  { id: "06b-animated-counter", categoryId: "06-stats-bars", categorySlug: "stats", name: "Animated Counter", description: "Animated Counter" },
  { id: "06c-card-based", categoryId: "06-stats-bars", categorySlug: "stats", name: "Card Based", description: "Card Based" },
  { id: "06d-logo-wall", categoryId: "06-stats-bars", categorySlug: "stats", name: "Logo Wall", description: "Logo Wall" },
  { id: "06e-vs-comparison", categoryId: "06-stats-bars", categorySlug: "stats", name: "Vs Comparison", description: "Vs Comparison" },
  { id: "06f-animated-sparkline", categoryId: "06-stats-bars", categorySlug: "stats", name: "Animated Sparkline", description: "Animated Sparkline" },
  { id: "06g-impact-paragraph", categoryId: "06-stats-bars", categorySlug: "stats", name: "Impact Paragraph", description: "Impact Paragraph" },
  { id: "07a-logo-links-cta", categoryId: "07-nav-bars", categorySlug: "nav", name: "Logo Links Cta", description: "Logo Links Cta" },
  { id: "07b-mega-menu", categoryId: "07-nav-bars", categorySlug: "nav", name: "Mega Menu", description: "Mega Menu" },
  { id: "07c-sidebar-fixed", categoryId: "07-nav-bars", categorySlug: "nav", name: "Sidebar Fixed", description: "Sidebar Fixed" },
  { id: "07d-floating-pill", categoryId: "07-nav-bars", categorySlug: "nav", name: "Floating Pill", description: "Floating Pill" },
  { id: "07e-command-palette", categoryId: "07-nav-bars", categorySlug: "nav", name: "Command Palette", description: "Command Palette" },
  { id: "07f-mobile-bottom-tabs", categoryId: "07-nav-bars", categorySlug: "nav", name: "Mobile Bottom Tabs", description: "Mobile Bottom Tabs" },
  { id: "07g-transparent-hover-solid", categoryId: "07-nav-bars", categorySlug: "nav", name: "Transparent Hover Solid", description: "Transparent Hover Solid" },
  { id: "07h-breadcrumb-nav", categoryId: "07-nav-bars", categorySlug: "nav", name: "Breadcrumb Nav", description: "Breadcrumb Nav" },
  { id: "08a-quote-card-grid", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Quote Card Grid", description: "Quote Card Grid" },
  { id: "08b-marquee-scroll", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Marquee Scroll", description: "Marquee Scroll" },
  { id: "08c-masonry-grid", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Masonry Grid", description: "Masonry Grid" },
  { id: "08d-video-grid", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Video Grid", description: "Video Grid" },
  { id: "08e-tweet-wall", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Tweet Wall", description: "Tweet Wall" },
  { id: "08f-single-featured-hero", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Single Featured Hero", description: "Single Featured Hero" },
  { id: "08g-logo-wall-plus-quote", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Logo Wall Plus Quote", description: "Logo Wall Plus Quote" },
  { id: "08h-carousel-pagination", categoryId: "08-testimonials", categorySlug: "testimonials", name: "Carousel Pagination", description: "Carousel Pagination" },
  { id: "09a-multi-column-sitemap", categoryId: "09-footer", categorySlug: "footer", name: "Multi Column Sitemap", description: "Multi Column Sitemap" },
  { id: "09b-newsletter-first", categoryId: "09-footer", categorySlug: "footer", name: "Newsletter First", description: "Newsletter First" },
  { id: "09c-status-indicator", categoryId: "09-footer", categorySlug: "footer", name: "Status Indicator", description: "Status Indicator" },
  { id: "09d-minimal-copyright", categoryId: "09-footer", categorySlug: "footer", name: "Minimal Copyright", description: "Minimal Copyright" },
  { id: "09e-big-logo-brand", categoryId: "09-footer", categorySlug: "footer", name: "Big Logo Brand", description: "Big Logo Brand" },
  { id: "10a-accordion-vertical", categoryId: "10-faq", categorySlug: "faq", name: "Accordion Vertical", description: "Accordion Vertical" },
  { id: "10b-chat-bubble", categoryId: "10-faq", categorySlug: "faq", name: "Chat Bubble", description: "Chat Bubble" },
  { id: "10c-searchable", categoryId: "10-faq", categorySlug: "faq", name: "Searchable", description: "Searchable" },
  { id: "10d-categorized-tabs", categoryId: "10-faq", categorySlug: "faq", name: "Categorized Tabs", description: "Categorized Tabs" },
  { id: "10e-two-column-static", categoryId: "10-faq", categorySlug: "faq", name: "Two Column Static", description: "Two Column Static" },
  { id: "11a-checklist-progress", categoryId: "11-onboarding", categorySlug: "onboarding", name: "Checklist Progress", description: "Checklist Progress" },
  { id: "11b-guided-tour-tooltip", categoryId: "11-onboarding", categorySlug: "onboarding", name: "Guided Tour Tooltip", description: "Guided Tour Tooltip" },
  { id: "11c-video-modal-intro", categoryId: "11-onboarding", categorySlug: "onboarding", name: "Video Modal Intro", description: "Video Modal Intro" },
  { id: "11d-empty-state-cta", categoryId: "11-onboarding", categorySlug: "onboarding", name: "Empty State Cta", description: "Empty State Cta" },
  { id: "12a-magazine-grid", categoryId: "12-blog-content", categorySlug: "blog", name: "Magazine Grid", description: "Magazine Grid" },
  { id: "12b-reading-layout", categoryId: "12-blog-content", categorySlug: "blog", name: "Reading Layout", description: "Reading Layout" },
  { id: "12c-filtered-cards", categoryId: "12-blog-content", categorySlug: "blog", name: "Filtered Cards", description: "Filtered Cards" },
  { id: "12d-search-first", categoryId: "12-blog-content", categorySlug: "blog", name: "Search First", description: "Search First" },
  { id: "13a-form-plus-details", categoryId: "13-contact", categorySlug: "contact", name: "Form Plus Details", description: "Form Plus Details" },
  { id: "13b-channel-cards", categoryId: "13-contact", categorySlug: "contact", name: "Channel Cards", description: "Channel Cards" },
  { id: "13c-map-embedded", categoryId: "13-contact", categorySlug: "contact", name: "Map Embedded", description: "Map Embedded" },
  { id: "14a-404-with-search", categoryId: "14-states", categorySlug: "states", name: "404 With Search", description: "404 With Search" },
  { id: "14b-loading-skeleton", categoryId: "14-states", categorySlug: "states", name: "Loading Skeleton", description: "Loading Skeleton" },
  { id: "14c-empty-state-illustration", categoryId: "14-states", categorySlug: "states", name: "Empty State Illustration", description: "Empty State Illustration" },
  { id: "14d-cookie-banner-gdpr", categoryId: "14-states", categorySlug: "states", name: "Cookie Banner Gdpr", description: "Cookie Banner Gdpr" },
  { id: "14e-error-boundary-card", categoryId: "14-states", categorySlug: "states", name: "Error Boundary Card", description: "Error Boundary Card" },
];

export function getVariant(id: string): PresentationVariant | undefined {
  return PRESENTATION_VARIANTS.find((v) => v.id === id);
}

export function getVariantsByCategory(categoryId: string): PresentationVariant[] {
  return PRESENTATION_VARIANTS.filter((v) => v.categoryId === categoryId);
}

export function getCategory(id: string): PresentationCategory | undefined {
  return PRESENTATION_CATEGORIES.find((c) => c.id === id || c.slug === id);
}

export function getVariantsBySlug(slug: string): PresentationVariant[] {
  return PRESENTATION_VARIANTS.filter((v) => v.categorySlug === slug);
}
