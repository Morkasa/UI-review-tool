# Morkasa Dark Canvas Design System

This project uses a dark, tool-first interface inspired by Framer's canvas UI: black workspace, compact panels, restrained dividers, visible controls, and a bottom/tool-surface feeling without decorative marketing layout.

## Design Direction

- Primary brand color: `#002FA7`.
- Dark-first workspace: `#050507` background, `#0D0F14` panels, and subtle 1px dividers.
- Brand blue appears as the action fill, active state, focus ring, guide glow, and design-side accent.
- Text does not use raw brand blue on black. It uses `#F7F8FF`, `#A8AFBF`, and `#71798A` for accessible hierarchy.
- Border radius is capped at `8px` for a compact product-tool feel.
- No decorative blobs, hero sections, or broad gradients. Depth comes from borders, black surfaces, and small blue glows.

## Tokens

The canonical token source is `design-tokens.json`. CSS variables in `src/styles.css` mirror those values:

- `--brand-blue`: `#002FA7`
- `--bg`: `#050507`
- `--panel`: `#0D0F14`
- `--panel-muted`: `#11141B`
- `--ink`: `#F7F8FF`
- `--muted`: `#A8AFBF`
- `--faint`: `#71798A`
- `--border`: `rgba(255,255,255,0.10)`

## Component Rules

- Buttons use the brand blue only for primary actions and selected segmented controls.
- Secondary buttons remain dark neutral with white borders.
- Panels use 1px borders, `8px` radius, and compact padding.
- Inputs match the canvas: black fill, white text, subtle border, blue focus ring.
- Status colors are reserved for comparison states: success, review, fail.
- The comparison frame should feel like a canvas surface, not a website card.

## Framer Reference Cues

Framer's current documentation describes light/dark canvas theme switching and uses a dark interface with tool controls and zoom in the canvas menu. Their developer docs also expose UI color roles such as background, divider, text, secondary text, tertiary text, and tint. This design borrows those structural cues while keeping Morkasa's brand blue.

## Audit Notes

- Color consistency: centralized tokens now control the dark UI.
- Typography hierarchy: page title, section titles, labels, metrics, and table text have distinct sizes.
- Spacing rhythm: compact `6/8/10/12/14/16` spacing drives controls and panels.
- Dark mode: the entire application is dark-first, not a partial theme.
- AI slop check: removed the previous light green SaaS palette and avoided purple/blue gradients, glass cards, and oversized hero treatment.
