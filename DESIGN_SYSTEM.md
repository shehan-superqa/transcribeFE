# Design System Documentation

## Overview

This design system is based on a clean, elegant aesthetic with a focus on clarity, usability, and visual hierarchy. The system emphasizes generous whitespace, subtle shadows, and a purple accent color for interactive elements.

## Core Design Principles

1. **Clean & Elegant**: Minimal visual noise, generous whitespace
2. **Three-Panel Layout**: Left sidebar (details), center (main content), right (actions/checklist)
3. **Purple Accent Color**: Used for interactive elements, status indicators, and active states
4. **Card-Based Design**: Rounded corners, subtle shadows, clear hierarchy
5. **Modern Typography**: Clean sans-serif font (Inter)

## Color Palette

### Primary Colors

- **Purple Accent (Primary)**: `#6b21a8` - Used for interactive elements, tabs, status tags
- **Purple Light**: `#9333ea` - Hover states
- **Purple Dark**: `#581c87` - Active/pressed states

### Purple Scale

```
purple-50:  #faf5ff
purple-100: #f3e8ff
purple-200: #e9d5ff
purple-300: #d8b4fe
purple-400: #c084fc
purple-500: #a855f7
purple-600: #9333ea
purple-700: #7e22ce
purple-800: #6b21a8  // Primary accent
purple-900: #581c87
```

### Neutral Colors

- **Background Primary**: `#f9fafb` - Main background
- **Background Paper**: `#ffffff` - Card/surface background
- **Background Secondary**: `#f3f4f6` - Subtle backgrounds
- **Text Primary**: `#111827` - Main text color
- **Text Secondary**: `#6b7280` - Secondary text, labels
- **Text Tertiary**: `#9ca3af` - Disabled/placeholder text
- **Border**: `#e5e7eb` - Borders and dividers
- **Border Light**: `#d1d5db` - Subtle borders

### Status Colors

- **Awaiting Response**: `#6b21a8` (purple-800)
- **Open**: `#10b981` (green-500)
- **Completed**: `#6b7280` (gray-500)
- **Error**: `#ef4444` (red-500)
- **Warning**: `#f59e0b` (amber-500)
- **Success**: `#10b981` (green-500)

## Typography

### Font Family

- **Primary**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`

### Type Scale

```css
/* Headings */
h1: 2.5rem (40px) - font-weight: 700
h2: 2rem (32px) - font-weight: 600
h3: 1.5rem (24px) - font-weight: 600
h4: 1.25rem (20px) - font-weight: 600
h5: 1.125rem (18px) - font-weight: 600
h6: 1rem (16px) - font-weight: 600

/* Body */
body: 1rem (16px) - font-weight: 400 - line-height: 1.5
small: 0.875rem (14px) - font-weight: 400
caption: 0.75rem (12px) - font-weight: 400
```

### Font Weights

- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System

Based on 4px base unit:

```
xs:  0.25rem (4px)
sm:  0.5rem (8px)
md:  1rem (16px)
lg:  1.5rem (24px)
xl:  2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### Component Spacing

- **Card Padding**: `1.5rem` (24px)
- **Section Gap**: `2rem` (32px)
- **Element Gap**: `1rem` (16px)
- **Panel Gap**: `1.5rem` (24px)

## Border Radius

```
sm:  0.375rem (6px)
md:  0.5rem (8px)
lg:  0.75rem (12px)
xl:  1rem (16px)
full: 9999px (pill shape)
```

## Shadows

```
sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
md:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

## Components

### StatusTag

Purple status chips with rounded corners.

**Props:**
- `status`: 'awaiting' | 'open' | 'completed' | 'error' | 'warning' | 'success'
- `children`: ReactNode

**Styling:**
- Background: Purple for awaiting, green for open/success, gray for completed
- Border radius: `0.5rem` (8px)
- Padding: `0.375rem 0.75rem`
- Font size: `0.875rem` (14px)
- Font weight: 500

### ActionButton

Icon + text action buttons with clean styling.

**Props:**
- `icon`: ReactNode (icon component)
- `children`: ReactNode (button text)
- `onClick`: () => void
- `variant?`: 'primary' | 'secondary' | 'outline'
- `disabled?`: boolean

**Styling:**
- Display: flex with gap
- Padding: `0.5rem 1rem`
- Border radius: `0.5rem` (8px)
- Font size: `0.875rem` (14px)
- Font weight: 500
- Transition: all 0.2s ease-in-out

### CollapsibleSection

Expandable sections with chevron indicator.

**Props:**
- `title`: string
- `children`: ReactNode
- `defaultExpanded?`: boolean
- `onToggle?`: (expanded: boolean) => void
- `actionButton?`: ReactNode (e.g., "Manage" button)

**Styling:**
- Header: flex with space-between
- Chevron: rotates on expand
- Content: smooth collapse/expand animation
- Border: bottom border when expanded

### ThreePanelLayout

Layout component for three-column design.

**Props:**
- `leftPanel`: ReactNode
- `centerPanel`: ReactNode
- `rightPanel`: ReactNode
- `leftWidth?`: string (default: '300px')
- `rightWidth?`: string (default: '320px')

**Styling:**
- Display: grid with three columns
- Gap: `1.5rem` (24px)
- Left panel: fixed width, sticky
- Center panel: flexible, main content
- Right panel: fixed width, sticky

### SearchBar

Search input with keyboard shortcut hint.

**Props:**
- `value`: string
- `onChange`: (value: string) => void
- `placeholder?`: string (default: "Search")
- `shortcut?`: string (default: "Ctrl + K")

**Styling:**
- Border radius: `0.5rem` (8px)
- Padding: `0.75rem 1rem`
- Border: `1px solid #e5e7eb`
- Focus: purple border
- Shortcut hint: secondary text color, right-aligned

### SectionCard

Card component with consistent styling.

**Props:**
- `title?`: string
- `children`: ReactNode
- `action?`: ReactNode (e.g., "Edit" button)
- `padding?`: string (default: '1.5rem')

**Styling:**
- Background: white (#ffffff)
- Border radius: `0.75rem` (12px)
- Box shadow: `md` shadow
- Padding: `1.5rem` (24px)
- Border: `1px solid #e5e7eb` (optional)

## Layout Patterns

### Three-Panel Layout

```
┌─────────────┬──────────────────────────┬─────────────┐
│             │                          │             │
│   Left      │      Center              │   Right     │
│   Panel     │      Panel               │   Panel     │
│   (300px)   │      (flexible)          │   (320px)   │
│             │                          │             │
│   Sticky    │      Scrollable          │   Sticky    │
└─────────────┴──────────────────────────┴─────────────┘
```

### Header Layout

```
┌────────────────────────────────────────────────────────┐
│ Logo │ Nav Links │ Search (Ctrl+K) │ Actions │ Profile │
└────────────────────────────────────────────────────────┘
```

## Interaction States

### Buttons

- **Default**: Base color, no shadow
- **Hover**: Slightly darker, subtle shadow
- **Active**: Pressed state, darker color
- **Disabled**: Reduced opacity (0.5), no interaction

### Links

- **Default**: Purple accent color
- **Hover**: Underline or darker shade
- **Visited**: Slightly muted purple

### Form Fields

- **Default**: Light border
- **Hover**: Darker border
- **Focus**: Purple border, subtle shadow
- **Error**: Red border, error message

## Accessibility

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 minimum)
- **Focus States**: Clear focus indicators (purple outline)
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Screen Readers**: Proper ARIA labels and roles

## Responsive Breakpoints

```
sm:  640px   (mobile)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (large desktop)
2xl: 1536px  (extra large)
```

## Dark Mode Support

All components support dark mode with appropriate color adjustments:
- Backgrounds: Dark grays (#121212, #1e1e1e)
- Text: Light grays (#e0e0e0, #a0a0a0)
- Borders: Dark borders (#333333, #444444)
- Accent: Lighter purple for better contrast

