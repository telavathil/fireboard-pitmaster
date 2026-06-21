---
name: Ember & Char
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#e6beb2'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#ad897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59e'
  primary: '#ffb59e'
  on-primary: '#5e1700'
  primary-container: '#ff571a'
  on-primary-container: '#521300'
  inverse-primary: '#ae3200'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#c8c6c6'
  on-tertiary: '#303030'
  tertiary-container: '#919090'
  on-tertiary-container: '#292a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#e4e2e2'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474747'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 72px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  title-lg:
    fontFamily: Source Sans 3
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
This design system is built on the raw, primal energy of open-flame cooking and the precision of professional pitmasters. It evokes a sense of intensity, heat, and craftsmanship. The brand personality is rugged and authoritative, yet premium—akin to high-end cast iron cookware and blackened steel.

The design style is **High-Contrast / Bold** with elements of **Tactile** textures. It moves away from the clinical "tech" look toward a "forged" aesthetic. Key visual drivers include:
- **Radiance:** Elements should feel like they are emitting heat rather than just reflecting light.
- **Intensity:** Deep blacks provide the canvas for vibrant, high-energy accents.
- **Utility:** A focus on legibility and "heavy-duty" UI controls that feel substantial and reliable.

## Colors
The palette is dominated by the **Charred Wood Black** (#0A0A0B), serving as the foundation for the entire interface. 

- **Primary (Ember Orange):** Used for primary actions, critical alerts, and "active" states where heat is most concentrated.
- **Secondary (Flame Yellow):** Used for highlighting, secondary status indicators, and subtle gradients that transition from the primary orange.
- **Neutral (Smoke Gray):** Used for secondary text, disabled states, and dividing lines.
- **Surface:** A slightly lifted black (#121214) to create depth against the pure black background, mimicking the varied texture of charcoal.

## Typography
Typography is a study in contrast. Headlines are tall, aggressive, and impactful using **Bebas Neue**, mimicking the bold signage of a smokehouse. This is balanced by **Source Sans 3**, which provides high legibility for menus and recipes. 

For technical data, such as temperatures and timers, **JetBrains Mono** is used to provide a "instrumental" feel, suggesting the precision required in low-and-slow cooking. All caps should be used sparingly for headlines and labels to maintain a commanding presence.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure on desktop and a 4-column structure on mobile. The spacing rhythm is tight and intentional, using a 4px baseline.

Margins are generous on the outer edges to focus the user’s eye on the "hearth" (the central content area). Elements should feel dense and powerful, with minimal padding inside components to maintain a "heavy-duty" industrial feel. Breakpoints are set at 600px (mobile to tablet) and 1024px (tablet to desktop).

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Radiant Glows** rather than traditional soft shadows.

- **The Forge Floor:** The base background is pure black.
- **The Grate:** Secondary surfaces (cards, containers) are slightly lifted with a dark gray hex (#121214) and a 1px solid border (#262626).
- **The Glow:** Active or "Hot" elements feature an inner shadow/glow of Ember Orange (#FF4D00). Use a low-blur, high-intensity glow (e.g., `0 0 12px rgba(255, 77, 0, 0.4)`) to simulate the heat of burning coals.
- **Brushed Metal:** Apply a subtle noise or vertical linear gradient to large surfaces to mimic the texture of cold-rolled steel or cast iron.

## Shapes
The shape language is **Soft (0.25rem)**, leaning toward the sharper side to evoke a "forged" or "machined" feel. Avoid large circular rounds; instead, use tight corners that feel precise and industrial. 

- **Standard Buttons/Inputs:** 4px radius.
- **Large Cards:** 8px radius.
- **Indicators:** Use sharp-edged diamonds or 45-degree angled cuts for status flags to reinforce the "rugged" aesthetic.

## Components

### Buttons
- **Primary:** Ember Orange background with bold black Bebas Neue text. On hover, the orange should brighten and gain a subtle outer glow.
- **Secondary:** Transparent with a 2px Flame Yellow border. Text is Flame Yellow.
- **Ghost:** Smoke gray text with no border, turning white on hover.

### Cards
- Surfaces use the "Surface" hex with a very subtle inner top-light (a 1px line of 10% white) to simulate a metallic edge. 
- When a card is "Active" or "Cooking," the border changes to Ember Orange with an inner glow.

### Input Fields
- Dark backgrounds (#0A0A0B) with a subtle 1px border (#4A4A4A). Focus states should snap to a Flame Yellow border with no transition delay, feeling mechanical and responsive.
- Labels use the monospace font for a technical look.

### Chips & Indicators
- Use small, rectangular chips with 0px radius for "Live" or "Hot" statuses.
- Use high-contrast color combinations (Yellow on Black) for maximum visibility.

### Progress Bars (The "Heat Gauge")
- Progress bars should use a gradient from Ember Orange to Flame Yellow. The "empty" track should be a dark, textured gray.