@AGENTS.md

# Frontend Rules

## Code Separation

### Services
- All API calls must live in a dedicated service file: `utils/services/<feature>.service.ts` inside the feature's folder.
- Services import only from `@/lib/api` (`apiFetch`, `apiFetchAuth`) and their own interface files — never call `fetch` directly in a page or component.
- Export named async functions only. No default exports from service files.

### Interfaces
- All TypeScript types and interfaces for a feature go in `utils/interfaces/<feature>.interface.ts` alongside its service file.
- Shared app-wide types go in `src/types/`.

### Components
- Reusable UI components go in `src/components/shared/`. Feature-specific ones go in `src/components/<feature>/`.
- Each component gets its own folder: `ComponentName/ComponentName.tsx` + `ComponentName.module.css`.
- Pages (`page.tsx`) must only orchestrate: import services, pass data to components. No inline business logic or raw fetch calls in `page.tsx`.

### File naming
- Components: PascalCase (`EventCard.tsx`)
- Services and interfaces: camelCase with suffix (`event.service.ts`, `event.interface.ts`)
- CSS Modules: match component name (`EventCard.module.css`)

---

## CSS Variables

**Never use hardcoded color, font, size, shadow, or transition values in CSS.** Always reference a variable from `src/styles/variables.css`.

### Colors
```css
/* Primary */
--color-primary-500        /* #3B6FD4 — main blue */
--color-primary-800        /* #1A2D6E — dark blue */
--color-primary-500-10     /* primary at 10% opacity */
--color-primary-500-15     /* primary at 15% opacity */

/* Secondary */
--color-secondary-500      /* #F4C200 — yellow */
--color-secondary-800      /* #E8A020 — dark yellow */

/* KTR Brand */
--color-ktr-navy           /* #0A1128 */
--color-ktr-yellow         /* #FFD600 */
--color-ktr-ink            /* #0F1014 */
--color-ktr-blue           /* #0055FF */
--color-ktr-ice            /* #EFF3FF */
--color-ktr-crimson        /* #E11D48 */

/* Neutral scale */
--color-neutral-50         /* #FFFFFF */
--color-neutral-100        /* #F8FAFC */
--color-neutral-150        /* #E2E8F0 */
--color-neutral-200        /* #E8E6E3 */
--color-neutral-300        /* #CBD5E1 */
--color-neutral-400        /* #94A3B8 */
--color-neutral-500        /* #7c7a7a */
--color-neutral-600        /* #475569 */
--color-neutral-700        /* #334155 */
--color-neutral-800        /* #171717 */

/* Semantic */
--color-semantic-red       /* #C0392B */
--color-semantic-red-10
--color-semantic-red-15

/* Status */
--color-status-green       /* #10B981 */
--color-status-red         /* #E11D48 */
--color-status-yellow      /* #FFD600 */
--color-status-blue        /* #0055FF */
--color-custom-light-purple
--color-custom-black-hover

/* Status badges */
--color-status-warning-bg / --color-status-warning-text
--color-status-pending-bg  / --color-status-pending-text
--color-status-rejected-bg / --color-status-rejected-text

/* Role badges */
--color-role-student-bg  / --color-role-student-text
--color-role-clublead-bg / --color-role-clublead-text
--color-role-admin-bg    / --color-role-admin-text
```

### Typography
```css
--font-heading             /* heading font */
--font-body                /* body font */

--weight-regular / --weight-normal   /* 400 */
--weight-medium                      /* 500 */
--weight-semibold                    /* 600 */
--weight-bold                        /* 700 */

--text-h1-size / --text-h1-height
--text-h2-size / --text-h2-height
--text-h3-size / --text-h3-height
--text-body-size / --text-body-height
--text-small-size / --text-small-height
--text-link-size / --text-link-height
--text-caption-size / --text-caption-height

--letter-spacing-tight     /* 0.04em */
```

### Effects & Sizing
```css
--shadow-card              /* 0px 4px 20px rgba(0,0,0,0.15) */
--popup-background         /* #00000099 */

--transition-veryfast      /* 0.2s ease */
--transition-fast          /* 0.4s ease */
--transition-medium        /* 0.6s ease */
--transition-slow          /* 0.8s ease */

--button-height-md         /* 48px */
--text-display-size        /* 160px */
--radius-sm                /* 0.375rem */
```

### Example — correct usage
```css
.card {
  background: var(--color-neutral-100);
  color: var(--color-neutral-800);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-card);
  font-size: var(--text-body-size);
  line-height: var(--text-body-height);
  transition: background var(--transition-fast);
}
```
