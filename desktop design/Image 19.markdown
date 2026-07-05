---
name: Heritage Premium
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#42474d'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#72787e'
  outline-variant: '#c2c7ce'
  surface-tint: '#3b6281'
  primary: '#002940'
  on-primary: '#ffffff'
  primary-container: '#123f5c'
  on-primary-container: '#83aacc'
  inverse-primary: '#a3cbee'
  secondary: '#306382'
  on-secondary: '#ffffff'
  secondary-container: '#a9dbfe'
  on-secondary-container: '#2c617f'
  tertiary: '#1a2544'
  on-tertiary: '#ffffff'
  tertiary-container: '#303b5b'
  on-tertiary-container: '#9aa5cb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cbe6ff'
  primary-fixed-dim: '#a3cbee'
  on-primary-fixed: '#001e30'
  on-primary-fixed-variant: '#204a68'
  secondary-fixed: '#c7e7ff'
  secondary-fixed-dim: '#9bcdf0'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#104c69'
  tertiary-fixed: '#dae1ff'
  tertiary-fixed-dim: '#bac5ec'
  on-tertiary-fixed: '#0e1a38'
  on-tertiary-fixed-variant: '#3b4666'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
  brand-cream: '#f7f5f0'
  dusty-rose: '#aa7478'
  destructive: '#dc2626'
  gold: '#ffd700'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  max-width: 1200px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 20px
  section-padding: 80px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system embodies a premium South African event marketplace, balancing the sophisticated "Old World" charm of Cape Dutch aesthetics with the modern, vibrant energy of contemporary African luxury. The brand personality is authoritative yet welcoming—positioning itself as a trusted curator for high-end celebrations and corporate gatherings.

The design style is **Corporate / Modern** with a **Minimalist** editorial influence. It prioritizes generous whitespace, precise grid alignment, and a refined use of depth to create a sense of exclusivity and calm. The visual language avoids frantic patterns, opting instead for solid color blocks of deep teals and warm creams to evoke a sense of stability and timeless quality.

## Colors

The palette is anchored by a deep, oceanic **Primary Teal**, symbolizing trust and the vast South African landscape. This is complemented by **Brand Cream**, which replaces pure white in structural areas like headers and footers to soften the UI and provide a more "parchment" or "gallery" feel.

**Dusty Rose** and **Light Lavender** are used sparingly as accents for decorative elements or secondary calls to action, preventing the interface from feeling overly cold or corporate. **Gold** is reserved for high-value indicators (e.g., "Premium Vendor" badges or star ratings), while **Destructive Red** is used strictly for critical errors and cancellations. Pure white (#FFFFFF) is reserved for card backgrounds and content surfaces to maximize legibility.

## Typography

The typography strategy employs a classic serif-and-sans-serif pairing. **Playfair Display** provides an editorial, high-fashion headline style that immediately communicates "Premium." **Montserrat** is the workhorse for body and functional text, offering high legibility and a contemporary geometric feel that balances the serif's traditionalism.

- **Headlines:** Use high-contrast sizing to create clear page hierarchy. Ensure letter spacing is slightly tightened for larger display types.
- **Labels:** Always use Montserrat Medium or SemiBold with a subtle letter-spacing increase to ensure professional clarity in navigation and small tags.
- **Body:** Maintain generous line-heights to ensure high readability on long-form vendor descriptions.

## Layout & Spacing

The design system follows a **Fixed Grid** model for desktop, centered within a 1200px container. This constraint ensures that high-resolution photography and editorial layouts remain balanced and do not stretch excessively on wide monitors.

- **The 8px Rhythm:** All spacing (padding, margins, gap) should be multiples of 8px to maintain a rhythmic vertical flow.
- **Desktop Grid:** A 12-column system with 24px gutters.
- **Mobile Grid:** A 4-column system with 16px gutters and 20px side margins.
- **Whitespace:** Use generous vertical padding (80px+) between sections to allow content to "breathe," emphasizing the luxury nature of the marketplace.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a subtle sense of hierarchy without overwhelming the user with heavy 3D effects.

- **Base Layer:** The `brand-cream` is used for global backgrounds and large structural containers like headers.
- **Surface Layer:** White (#FFFFFF) cards sit on top of the cream background, creating a natural lift.
- **Shadows:** 
  - **Standard Cards:** Use a soft `0 2px 8px rgba(0,0,0,0.08)` to provide a gentle edge definition.
  - **Overlays/Modals:** Use `0 4px 16px rgba(0,0,0,0.12)` for higher elevation, accompanied by a 40% opacity dark teal backdrop blur to focus attention.
- **Interactions:** Subtle lift on hover (moving the shadow to a slightly larger spread) is the preferred feedback mechanism.

## Shapes

The shape language is sophisticated and "Soft-Rounded." While the overall layout is structured and grid-bound, the corners are softened to feel approachable.

- **Base Radius (md):** 8px for standard buttons and input fields.
- **Large Radius (lg):** 12px for content cards and image containers.
- **Extra Large Radius (xl):** 16px for large modals and featured hero containers.
- **Small Radius (sm):** 4px reserved for small tags and tooltips.

## Components

### Buttons
- **Primary:** Solid `primary-teal` with white Montserrat SemiBold text. 8px radius.
- **Secondary:** Outlined `primary-teal` (2px border) with teal text.
- **Tertiary/Ghost:** No background, `primary-teal` text with a subtle underline or hover-state cream background.

### Cards
- Always white background with the `lg` (12px) radius. 
- Use subtle shadows for depth. 
- Image aspect ratios should be consistent (e.g., 4:3 for event spaces, 1:1 for vendor profiles).

### Input Fields
- White background with a `brand-cream` or light grey border (1px). 
- 8px radius. 
- Labels should use Montserrat SemiBold (label-md) positioned above the field.

### Chips & Tags
- For categories, use `brand-cream` background with `primary-teal` text. 
- For "Active" or "Featured" status, use a very light tint of `secondary-teal` or `gold`.

### Modals
- 16px corner radius.
- Always include a clear "X" close button in the top right.
- Content should be centered with a maximum width of 600px for readability.