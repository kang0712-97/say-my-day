---
name: Say My Day Presentation
description: Scoped visual system extracted from the finished HTML presentation.
colors:
  ink: "#171918"
  paper: "#fff"
  warm: "#f5f4ee"
  soft: "#eeeee8"
  line: "#d3d4cc"
  muted: "#62675f"
  cinema: "#1b1e1b"
  dark: "#1c211c"
  primary-hover: "#3e4638"
  focus: "#69785e"
  progress: "#54604c"
typography:
  display:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "86px"
    fontWeight: 760
    lineHeight: 1.16
    letterSpacing: "-.035em"
  headline:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "72px"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "-.035em"
  title:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "40px"
    fontWeight: 760
    lineHeight: 1.3
    letterSpacing: "-.035em"
  lead:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "35px"
    lineHeight: 1.55
    letterSpacing: "-.02em"
  body:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "27px"
    lineHeight: 1.65
  action:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "24px"
    fontWeight: 650
  source:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "16px"
    lineHeight: 1.4
  mobile-headline:
    fontFamily: 'Day, -apple-system, "Apple SD Gothic Neo", sans-serif'
    fontSize: "clamp(35px,10.77vw,42px)"
    fontWeight: 760
    lineHeight: 1.25
    letterSpacing: "-.035em"
rounded:
  small: "4px"
  control: "8px"
  primary: "12px"
spacing:
  desktop-slide: "60px 76px 78px"
  mobile-slide: "30px 23px 60px"
  primary: "17px 24px"
  text-action: "12px 0"
  dialog: "25px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.primary}"
    padding: "{spacing.primary}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-text:
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    padding: "{spacing.text-action}"
  segmented-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  record-select:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  dialog:
    backgroundColor: "{colors.warm}"
    textColor: "{colors.ink}"
    rounded: "{rounded.primary}"
    padding: "{spacing.dialog}"
---

# Design System: Say My Day Presentation

## Overview

**Creative North Star: "The Illustrated Diary"**

This is a presentation-scoped record of the built Say My Day HTML deck. Its warm paper, actual wordmark and notebook-carrying bird inherit the application's identity. These rules apply inside this presentation and do not establish or change the application's global system.

Large Korean statements, quiet source lines and actual product captures share a mostly flat paper surface. The demonstration and prompt narrative use dark surfaces. The illustrated diary supplies material warmth; controls remain compact and legible.

**Key Characteristics:**
- Warm paper and near-black ink.
- Locally hosted Pretendard with large Korean headings.
- Thin rules, selected-state ink and inspectable product evidence.
- A fitted desktop stage that becomes a scrolling mobile page.

Evidence: ../발표_리디자인.html, style.css, runtime.js; contextual scope from PRODUCT.md and direction.md. Visual samples checked: screens/slide-01.png, screens/slide-09.png and screens/mobile-10.png. The code is authoritative for the current responsive corrections.

## Colors

The palette is neutral with restrained olive undertones in interaction feedback and dark surfaces.

### Primary
- **Ink:** headlines, primary actions, active selectors and strong rules.
- **Olive Ink Hover:** primary-action hover.
- **Focus Olive:** visible keyboard focus.
- **Progress Olive:** the fixed progress line.

### Neutral
- **Paper:** default slide surface and text on ink.
- **Warm Paper:** cover, selected narrative pages, record fields and dialogs.
- **Soft Paper:** segmented-control tray and chart tracks.
- **Paper Line:** shared dividers and control borders.
- **Muted Ink:** supporting explanations, captions and source lines.
- **Cinema Ink:** demonstration background.
- **Narrative Dark:** prompt-history background, a distinct built value rather than an alias for Cinema Ink.

**The Surface Contrast Rule.** Preserve the implemented light text on dark narrative surfaces and ink text on paper; dark sections are whole surfaces, not colored text accents.

## Typography

**Display Font:** locally hosted Pretendard Variable, registered as Day.
**Body Font:** the same Day family with Apple system and sans-serif fallbacks.

The frontmatter records common observed roles, not an exhaustive rigid type ladder. Most explanatory paragraphs vary by context between 24–31px. Cover display overrides the generic h1 size; the closing display is another local variation. General headings share tight tracking, weight 760 and balanced wrapping. Actions are weight 650. Sources and captions are quieter than narrative text.

**The Korean Word Rule.** At the mobile breakpoint, Korean headings and prose keep words intact. Table cells, code and source lines may wrap anywhere; Chinese language spans use normal word breaking with overflow wrapping.

## Layout

Desktop uses a fixed 1600×900 stage fitted proportionally to the viewport above the navigation bar. One absolute slide is active at a time. The shared slide inset is recorded in frontmatter. Common two-column arrangements pair argument text with a portrait capture, media or a second explanatory column; their exact widths are composition-specific.

At screen widths up to 760px the stage stops scaling, slides enter normal document flow and the viewport scrolls vertically. Shared slide padding switches to the mobile token. Headings use the mobile clamp, with 29px h3 defaults and context overrides; common narrative text becomes approximately 21–23px. Sources and footer notes enter flow. Screenshots retain readable portrait height.

The prompt timeline fits all five steps across the mobile width. Work selectors wrap; appendix selectors form two columns. General tab strips may scroll horizontally. Desktop navigation is 64px tall; mobile navigation is 60px, with chapter text, shortcut hints and fullscreen control hidden. The progress line sits immediately above navigation.

Print restores every slide to a separate 1600×900 page and hides navigation, progress and dialogs.

**The Reading Flow Rule.** Mobile is an active slide with vertical reading flow, never a miniature desktop canvas.

## Elevation & Depth

The deck is predominantly flat. Hairline borders, warm-paper blocks and inverse surfaces organize content. The cover diary sheet is a material exception: its observed shadow is `12px 18px 35px -25px #686b5b`, paired with a five-degree rotation. It is not a general card shadow.

Dialog depth comes from a dark translucent backdrop, `rgba(12,16,11,.65)`, and an ink border. Primary actions rise by 2px on hover. Page entrance combines a small 10px vertical movement with opacity over .38s; metric bars fill over .65s. Reduced-motion preference disables animation and transitions.

## Shapes

Controls use gently rounded corners: the frontmatter records the reused control, small-surface and primary/dialog radii. Scene buttons use a local 10px radius; screenshot frames use 13px and a thin border. The illustrated paper sheet has a nearly square 3px corner. Thin rules define lists, tables and tabs instead of enclosing every argument in a card.

## Components

### Buttons

Primary actions are ink-filled, white-text controls with a thin ink border, 42px internal gap and minimum 62px desktop height. Hover uses the hover token and lifts the control slightly. Text actions use an underline-like bottom border and 18px gap; hover reduces opacity to .65. Mobile primary actions use 19px type, 14px 19px padding and 54px minimum height.

All buttons, links and selects share a 3px focus outline with 5px offset. Disabled buttons fade to .3 opacity.

### Selectors and Tabs

General tabs use muted labels, a shared divider and a 3px ink selection underline. Runtime maintains aria-selected and roving tabindex; arrow keys select neighboring tabs. Segmented before/after controls use a soft tray and an ink-filled selected button. Incident and work selectors use bordered rounded buttons that invert when selected. The dark timeline uses light text and a light active underline. These are contextual variants, not interchangeable global tabs.

### Product Capture

The inspectable figure pairs an object-contained original screenshot with a muted caption and an underlined enlargement cue. Clicking opens the full image in a native dialog. Original image proportions remain intact. Screenshots are evidence assets rather than a newly invented card component.

### Video Scene Controls

A two-column button group selects recorded video scenes. On the cinema surface, unselected controls are outlined and muted; the selected control reverses to warm paper and dark text. The video uses native playback controls, contains its original proportions and can open in a larger dialog. The runtime stops chapter playback at the chosen endpoint.

### Evidence Browser

A warm-paper select chooses records above thin-rule tables. Table labels use warm backgrounds and stronger weight. On mobile, record tables become stacked label/value blocks; the compact comparison table retains table structure. No editable text field is implemented.

### Navigation and Dialogs

A fixed white navigation strip provides previous/next, count, evidence, overview, notes and desktop fullscreen controls. Hover uses Soft Paper, pressed states invert, and unavailable directions are disabled. A narrow progress line tracks slide position.

Native dialogs use warm paper, an ink border and sticky heading controls. Overview rows invert for the current slide. Image, video and notes dialogs specialize dimensions; the video dialog uses its own darker background. The sidebar preview snippets are visual excerpts, not replacements for the working runtime.

## Do's and Don'ts

### Do:
- **Do** retain the actual wordmark, bird and original product captures.
- **Do** preserve selected, disabled and visible keyboard-focus states.
- **Do** use normal mobile reading flow and keep Korean words intact.
- **Do** keep these rules scoped to this presentation.

### Don't:
- **Don't** stretch portrait product evidence to fill a desktop column.
- **Don't** apply the diary sheet's rotation and shadow to ordinary controls or evidence tables.
- **Don't** treat a sampled contextual type size as a mandatory size for every paragraph.

Not canonized or repaired: no craft-floor violation was identified in the sampled surfaces; this documentation does not replace the pending finish review. Contextual size/color exceptions remain local. No tonal ramps are supplied because the artifact defines none and this task forbids invented colors.
