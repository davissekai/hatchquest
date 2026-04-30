```markdown
# Design System Strategy: Streetwise Academic

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Scholarly Soul of the Streets."** 

This system rejects the cold, sterile minimalism of Western SaaS in favor of a "Maximalist Precision." We are blending the intellectual prestige of the University of Ghana’s Great Hall with the rhythmic, organic chaos of Makola Market. This is a "Streetwise Academic" aesthetic: it is grounded in tradition but vibrates with modern energy. 

To break the "template" look, we utilize **intentional asymmetry**. Layouts should feel like a well-curated editorial spread—overlapping images, typography that breaks grid lines, and a heavy emphasis on "The Round"—a philosophy where every corner is softened to evoke the warmth of Ghanaian hospitality and the rolling hills of Legon.

---

## 2. Colors & Tonal Depth
Our palette is a dialogue between the "Establishment" (Navy and Amber) and the "Energy" (Terracotta, Green, and Violet).

*   **Primary Hierarchy:** Use `primary` (#524fb2) and `secondary` (#6d5a00) for structural weight.
*   **Vibrant Accents:** Use `tertiary` (#ac2c00 / Terracotta) for calls to action that require heat, and `primary_container` (#9895fd / Electric Violet) for high-energy highlights.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** We do not "box" content; we layer it. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section should sit directly against a `surface` background. The change in tone is the boundary.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials. 
1.  **Base:** `background` (#f7f6f5).
2.  **Sections:** `surface_container_low` (#f1f1f0).
3.  **Interactive Cards:** `surface_container_lowest` (#ffffff) to provide "pop."
4.  **Floating Elements:** Use `surface_bright` with a 15% opacity and a 20px backdrop blur to create a "Glassmorphism" effect, allowing the vibrant street imagery to bleed through the UI.

### Signature Textures
Never use a flat color for a hero section. Apply a subtle linear gradient from `primary` (#524fb2) to `primary_dim` (#4642a5) at a 135-degree angle to give the interface "soul" and a sense of depth that feels expensive and custom.

---

## 3. Typography: The Editorial Mix
We utilize a high-contrast pairing to reflect our "Streetwise Academic" identity.

*   **The Voice (Headers):** `plusJakartaSans` is our bold, friendly sans-serif. It represents the modern, bustling energy of Accra. Use `display_lg` for hero statements with tight letter-spacing (-0.02em) to create a "headline" feel.
*   **The Narrative (Body):** `newsreader` is our clean, modern serif. It brings the prestige of the University. Use `body_lg` for long-form content to ensure the reading experience feels like a high-end journal.
*   **The Accent:** Use `title_lg` in `newsreader` italic for sub-headers or pull-quotes to break the mechanical rhythm of the sans-serif headers.

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a drop-shadow.

*   **The Layering Principle:** Avoid shadows on standard cards. Instead, place a `surface_container_highest` card inside a `surface_container` section. The contrast in value creates a "natural lift."
*   **Ambient Shadows:** If an element must float (like a FAB or a modal), use an ultra-diffused shadow: `offset: 0, 12px; blur: 40px; color: rgba(21, 5, 120, 0.08)`. Note the use of a Navy tint rather than pure black to keep the shadows "warm."
*   **The "Ghost Border" Fallback:** If a container sits on a background of the same color, use `outline_variant` (#adadac) at **12% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The "Pill" Aesthetic
All buttons must use `borderRadius: xl` (3rem). 
*   **Primary:** `primary` background with `on_primary` text. No border.
*   **Secondary:** `secondary_container` background. This provides the "Bright Amber" energy without the harshness of a primary yellow.
*   **Tertiary:** No background. Use `primary` text with an underline that only appears on hover.

### Cards: The Rounded Sanctuary
Cards are the backbone of this system. They must use `borderRadius: xl` (3rem). 
*   **Constraint:** Forbid the use of divider lines within cards. Separate header, body, and footer using `1.5rem` (md) vertical padding or subtle background shifts using `surface_variant`.

### Imagery & Containers
Images should rarely be simple rectangles. Use the `xl` corner radius for all image containers. For hero sections, overlay a `surface_container` card partially over a background image of Legon’s red-roofed architecture to create a layered, "collage" effect.

### Input Fields
Inputs should use `surface_container_high` backgrounds with no borders. The focus state is indicated by a 2px "Ghost Border" in `primary` (#524fb2) and a slight internal glow.

---

## 6. Do's and Don'ts

### Do:
*   **Do** lean into asymmetrical layouts. Let an image be 60% width and the text 40%, then flip it in the next section.
*   **Do** use the `tertiary` (Terracotta) color for micro-interactions, like a notification dot or a "new" tag.
*   **Do** use heavy backdrop blurs on navigation bars to let the "Streetwise" imagery remain visible as the user scrolls.

### Don't:
*   **Don't** use sharp corners. A sharp corner is a failure of the system's "Warmth" attribute.
*   **Don't** use pure black (#000000) for text. Use `on_surface` (#2e2f2f) to maintain the "Academic" softness.
*   **Don't** use standard "line-based" lists. Use spaced-out blocks with `surface_container_low` backgrounds to separate items.

---

## 7. Spacing & Rhythm
We do not use tight, cramped spacing. This system requires "Breathing Room" to feel premium.
*   **Section Gap:** Always use `4rem` or more between major vertical sections.
*   **Component Padding:** Internal padding for cards and modals should never be less than `2rem` (lg). 

This design system is a living celebration of Accra. When in doubt, ask: **"Does this feel like a quiet library, or a vibrant street?"** The answer should always be: **Both.**```