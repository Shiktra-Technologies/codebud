# Quick Reference Guide - UI Improvements

## 🎨 Color Palette

### Backgrounds
```css
#0a0a0b          /* Main app background */
#1a1a1f          /* Card background (gradient start) */
#16161a          /* Card background (gradient end) */
rgba(20,20,25,0.8)  /* Input backgrounds */
```

### Purple Accents
```css
#7c3aed          /* Primary purple */
#9333ea          /* Medium purple */
#c084fc          /* Light purple (text gradients) */
rgba(124,58,237,0.1-0.4)  /* Transparent purple (borders, overlays) */
```

### Text Colors
```css
#ffffff          /* Primary text */
#a1a1aa          /* Secondary text */
#71717a          /* Tertiary text/placeholders */
```

---

## 📏 Spacing Scale Quick Reference

```
2px   = var(--spacing-0-5)
4px   = var(--spacing-1)
8px   = var(--spacing-2)
12px  = var(--spacing-3)
16px  = var(--spacing-4)    ← Most common
20px  = var(--spacing-5)
24px  = var(--spacing-6)    ← Section spacing
32px  = var(--spacing-8)
40px  = var(--spacing-10)
48px  = var(--spacing-12)   ← Container padding
64px  = var(--spacing-16)
```

**Rule of Thumb:**
- Tight spacing: `--spacing-1` to `--spacing-3`
- Normal spacing: `--spacing-4` to `--spacing-6`
- Section spacing: `--spacing-8` to `--spacing-12`
- Large spacing: `--spacing-16`+

---

## 🔲 Border Radius

```css
4px   = var(--radius-sm)
6px   = var(--radius-md)
8px   = var(--radius-lg)     ← Most common
12px  = var(--radius-xl)     ← Cards, buttons
16px  = var(--radius-2xl)    ← Large cards
24px  = var(--radius-3xl)    ← Hero sections
9999px = var(--radius-full)  ← Pills, badges
```

---

## 📝 Typography Scale

```css
12px = var(--text-xs)        /* Labels, badges */
14px = var(--text-sm)        /* Body text, inputs */
16px = var(--text-base)      /* Standard text */
18px = var(--text-lg)        /* Emphasis */
20px = var(--text-xl)        /* Subheadings */
24px = var(--text-2xl)       /* Section headings */
30px = var(--text-3xl)       /* Page headings */
36px = var(--text-4xl)       /* Large headings */
48px = var(--text-5xl)       /* Hero headings */
```

**Responsive:**
```css
/* Use clamp() for fluid typography */
font-size: clamp(1rem, 2.5vw, 1.25rem);
/*          min   preferred  max */
```

---

## ✅ Checklist for New Components

- [ ] Use `#0a0a0b` for main background
- [ ] Use gradient for cards: `linear-gradient(135deg, #1a1a1f 0%, #16161a 100%)`
- [ ] Purple borders: `rgba(124, 58, 237, 0.2)`
- [ ] White text: `#ffffff` for primary
- [ ] Spacing multiples of 4px
- [ ] Border radius: `var(--radius-lg)` or `var(--radius-xl)`
- [ ] Transitions: `var(--transition-base)`
- [ ] Hover effects: `translateY(-2px)` or similar
- [ ] Responsive with `clamp()` or media queries
- [ ] Purple shadow on interactive elements

**Remember:** Consistency is key! Always use CSS variables instead of hard-coded values.
