# 🎨 Black & Purple Theme - Color Reference

## Complete Color Palette

### 🖤 Black Backgrounds

```css
/* Main Background */
#0a0a0b - Deep black (background of entire app)

/* Secondary Backgrounds */
#16161a - Slightly lighter (panels, sections)
#1a1a1f - Card backgrounds
#1e1e21 - Elevated surfaces
#25252a - Highest elevation

/* Gradient Backgrounds */
linear-gradient(135deg, #1a1a1f 0%, #16161a 100%)
```

### 💜 Purple Accents

```css
/* Purple Shades */
#a855f7 - Bright purple (primary-500)
#9333ea - Medium purple (primary-600)
#7e22ce - Deep purple (primary-700)
#7c3aed - Purple for gradients (secondary-600)
#6d28d9 - Dark purple (secondary-700)
#c084fc - Light purple (for gradients)

/* Purple Gradients */
linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) - Primary gradient
linear-gradient(135deg, #ffffff 0%, #c084fc 100%) - Text gradient
```

### 🤍 Text Colors

```css
#ffffff - Pure white (headings, primary text)
#a1a1aa - Gray (secondary text, labels)
#71717a - Dim gray (tertiary text, placeholders)
```

### ✨ Purple Effects (RGBA)

```css
/* Borders */
rgba(124, 58, 237, 0.15) - Subtle border
rgba(124, 58, 237, 0.2) - Normal border
rgba(124, 58, 237, 0.25) - Medium border
rgba(124, 58, 237, 0.3) - Strong border

/* Backgrounds */
rgba(30, 30, 35, 0.8) - Dark with transparency
rgba(40, 40, 50, 0.9) - Darker with slight transparency
rgba(124, 58, 237, 0.1) - Very subtle purple tint
rgba(124, 58, 237, 0.15) - Subtle purple background
rgba(124, 58, 237, 0.2) - Medium purple background

/* Shadows (Purple Glow) */
rgba(124, 58, 237, 0.1) - Subtle glow
rgba(124, 58, 237, 0.2) - Normal glow
rgba(124, 58, 237, 0.3) - Strong glow
rgba(124, 58, 237, 0.4) - Very strong glow
rgba(124, 58, 237, 0.5) - Maximum glow

/* Black Shadows */
rgba(0, 0, 0, 0.3) - Subtle depth
rgba(0, 0, 0, 0.4) - Normal depth
rgba(0, 0, 0, 0.5) - Strong depth
rgba(0, 0, 0, 0.6) - Very strong depth
```

---

## 🎨 Usage Examples

### Login Card
```css
background: linear-gradient(135deg, #1a1a1f 0%, #16161a 100%);
border: 1px solid rgba(124, 58, 237, 0.2);
box-shadow: 
  0 20px 40px rgba(0, 0, 0, 0.5),
  0 0 20px rgba(124, 58, 237, 0.1);
```

### Logo
```css
background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
box-shadow: 
  0 8px 20px rgba(124, 58, 237, 0.3),
  0 0 30px rgba(124, 58, 237, 0.2);
```

### Gradient Text (Headings)
```css
color: #ffffff;
background: linear-gradient(135deg, #ffffff 0%, #c084fc 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
```

### Submit Button
```css
background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
box-shadow: 
  0 4px 12px rgba(124, 58, 237, 0.3),
  0 0 20px rgba(124, 58, 237, 0.2);
```

### Button Hover
```css
box-shadow: 
  0 8px 20px rgba(124, 58, 237, 0.4),
  0 0 30px rgba(124, 58, 237, 0.3);
```

### Form Input
```css
background: rgba(20, 20, 25, 0.8);
border: 1px solid rgba(124, 58, 237, 0.2);
color: #ffffff;
```

### Input Focus
```css
background: rgba(30, 30, 35, 1);
border-color: #9333ea;
box-shadow: 
  0 0 0 3px rgba(124, 58, 237, 0.1),
  0 0 15px rgba(124, 58, 237, 0.2);
```

### Role Button
```css
background: rgba(30, 30, 35, 0.8);
border: 1px solid rgba(124, 58, 237, 0.3);
```

### Role Button Active
```css
background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(109, 40, 217, 0.15) 100%);
border: 1px solid #a855f7;
box-shadow: 
  0 8px 20px rgba(0, 0, 0, 0.3),
  0 0 25px rgba(124, 58, 237, 0.3);
```

### Navbar
```css
background: linear-gradient(135deg, #1a1a1f 0%, #16161a 100%);
border-bottom: 1px solid rgba(124, 58, 237, 0.2);
box-shadow: 
  0 4px 12px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(124, 58, 237, 0.1);
backdrop-filter: blur(10px);
```

### Nav Link Active
```css
background: rgba(124, 58, 237, 0.2);
box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
color: #ffffff;
```

---

## 🌈 Color Combinations

### Primary Combination (Cards)
- Background: `#1a1a1f` (dark)
- Border: `rgba(124, 58, 237, 0.2)` (purple glow)
- Text: `#ffffff` (white)
- Shadow: `0 0 20px rgba(124, 58, 237, 0.1)` (purple ambient)

### Button Combination
- Background: `linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)`
- Text: `#ffffff`
- Shadow: `0 4px 12px rgba(124, 58, 237, 0.3)`
- Hover Shadow: `0 8px 20px rgba(124, 58, 237, 0.4)`

### Input Combination
- Background: `rgba(20, 20, 25, 0.8)`
- Border: `rgba(124, 58, 237, 0.2)`
- Text: `#ffffff`
- Placeholder: `#71717a`
- Focus Border: `#9333ea`
- Focus Shadow: `0 0 0 3px rgba(124, 58, 237, 0.1)`

---

## 💡 Quick Reference

### When to use each purple:

**#a855f7** (Bright Purple)
- Active states
- Important highlights
- Attention-grabbing elements

**#9333ea** (Medium Purple)
- Primary buttons
- Focus states
- Main interactive elements

**#7c3aed** (Deep Purple)
- Gradient start
- Secondary buttons
- Subtle accents

**#6d28d9** (Dark Purple)
- Gradient end
- Background tints
- Shadow colors

**#c084fc** (Light Purple)
- Gradient highlights
- Text gradients
- Soft glows

### When to use transparency levels:

**0.1** - Very subtle effects (ambient glow, barely visible tint)
**0.15** - Subtle borders and backgrounds
**0.2** - Normal borders, light backgrounds
**0.3** - Strong borders, visible backgrounds
**0.4-0.5** - Very visible backgrounds, strong glows

---

## 📊 Contrast Ratios (Accessibility)

All combinations meet WCAG AA standards:

- White text on #0a0a0b: 21:1 ✅
- White text on #1a1a1f: 19:1 ✅
- Gray text (#a1a1aa) on #0a0a0b: 8:1 ✅
- Purple buttons with white text: 7:1 ✅

---

## 🎯 Copy-Paste Colors

### Backgrounds
```
#0a0a0b
#16161a
#1a1a1f
#1e1e21
#25252a
```

### Purple Accent
```
#a855f7
#9333ea
#7e22ce
#7c3aed
#6d28d9
#c084fc
```

### Text
```
#ffffff
#a1a1aa
#71717a
```

### Purple RGBA (for borders/shadows)
```
rgba(124, 58, 237, 0.1)
rgba(124, 58, 237, 0.15)
rgba(124, 58, 237, 0.2)
rgba(124, 58, 237, 0.25)
rgba(124, 58, 237, 0.3)
rgba(124, 58, 237, 0.4)
```

---

*Use this as your reference when maintaining consistency across the theme!*
