# Devovia Design System

A comprehensive design system for building consistent, beautiful UIs across the Devovia platform.

## Core Components

### 1. GlassCard
Glass morphism card component with backdrop blur effects.

**Variants:**
- `default` - Standard glass card with 80% opacity
- `subtle` - More transparent with border
- `solid` - Fully opaque
- `ghost` - Transparent background

**Props:**
- `variant` - Card style variant
- `rounded` - Border radius (sm, default, lg, xl, full)
- `padding` - Internal padding (none, sm, default, lg)
- `hover` - Hover effect (none, lift, glow)

**Example:**
```tsx
import { GlassCard } from "@repo/ui";

<GlassCard variant="default" hover="lift">
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>
```

### 2. Container
Responsive container with consistent padding and max-width.

**Props:**
- `size` - Container width (sm, default, lg, full)
- `padding` - Horizontal padding (none, sm, default, lg)
- `paddingY` - Vertical padding (none, sm, default, lg)

**Example:**
```tsx
import { Container } from "@repo/ui";

<Container size="default" padding="default" paddingY="default">
  {/* Page content */}
</Container>
```

### 3. Heading
Semantic heading component with gradient support.

**Props:**
- `size` - Heading size (h1, h2, h3, h4, h5, h6)
- `variant` - Style variant (default, gradient, muted)
- `spacing` - Bottom margin (none, sm, default, lg)
- `as` - HTML element to render

**Example:**
```tsx
import { Heading } from "@repo/ui";

<Heading size="h1" variant="gradient" spacing="sm">
  Welcome to Devovia
</Heading>
```

### 4. Text
Flexible text component with semantic variants.

**Props:**
- `size` - Text size (xs, sm, default, lg, xl)
- `variant` - Color variant (default, muted, subtle, primary, success, warning, error)
- `weight` - Font weight (normal, medium, semibold, bold)
- `as` - HTML element (p, span, div, label)

**Example:**
```tsx
import { Text } from "@repo/ui";

<Text variant="muted" size="sm">
  This is a muted text
</Text>
```

### 5. EmptyState
Empty state component for when there's no content to display.

**Props:**
- `icon` - React node for icon/emoji
- `title` - Main heading text
- `description` - Optional description text
- `action` - Optional action button/element

**Example:**
```tsx
import { EmptyState } from "@repo/ui";

<EmptyState
  icon="📝"
  title="No posts yet"
  description="Create your first blog post to get started"
  action={<Button>Create Post</Button>}
/>
```

### 6. IconButton
Icon-only button with glass morphism styling.

**Props:**
- `variant` - Button style (default, ghost, outline, primary)
- `size` - Button size (sm, default, lg)
- `icon` - Icon element to display

**Example:**
```tsx
import { IconButton } from "@repo/ui";
import { IconBell } from "@tabler/icons-react";

<IconButton 
  variant="default" 
  icon={<IconBell className="w-5 h-5" />}
  onClick={handleClick}
/>
```

### 7. Input (Updated)
Enhanced input component with glass variant.

**Props:**
- `variant` - Input style (default, glass)
- All standard HTML input props

**Example:**
```tsx
import { Input } from "@repo/ui";

<Input 
  variant="glass" 
  placeholder="Enter your email"
  type="email"
/>
```

## Design Tokens

### Colors
- **Primary**: Sky (500-600)
- **Secondary**: Indigo (500-600)
- **Accent**: Purple (500-600)
- **Success**: Green (600)
- **Warning**: Amber (600)
- **Error**: Red (600)

### Glass Morphism
- **Background**: `bg-white/80 dark:bg-slate-800/80`
- **Backdrop**: `backdrop-blur-sm`
- **Shadow**: `shadow-lg`
- **Border**: `border-0` or `border border-slate-200 dark:border-slate-700`

### Spacing
- **Container Padding**: `px-4 sm:px-6 lg:px-8`
- **Section Spacing**: `py-8` or `py-12`
- **Card Padding**: `p-6` or `p-8`

### Border Radius
- **Small**: `rounded-lg` (8px)
- **Default**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)
- **Extra Large**: `rounded-3xl` (24px)

## Migration Guide

### Before (Raw Tailwind)
```tsx
<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
    Title
  </h2>
  <p className="text-slate-600 dark:text-slate-300">
    Description
  </p>
</div>
```

### After (Design System)
```tsx
<GlassCard>
  <Heading size="h2" spacing="default">
    Title
  </Heading>
  <Text>
    Description
  </Text>
</GlassCard>
```

## Best Practices

1. **Use semantic components** - Prefer `Heading` over raw `h1` tags
2. **Leverage variants** - Use component variants instead of custom classes
3. **Consistent spacing** - Use the spacing props instead of margin utilities
4. **Glass morphism** - Use `GlassCard` for all card-like containers
5. **Container usage** - Wrap page content in `Container` component
6. **Icon buttons** - Use `IconButton` for icon-only actions

## Component Composition

### Page Layout Pattern
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-900">
  <Container>
    <div className="flex justify-between items-center mb-10">
      <div>
        <Heading size="h1" variant="gradient" spacing="sm">
          Page Title
        </Heading>
        <Text>Page description</Text>
      </div>
      <div className="flex gap-3">
        <Button>Action</Button>
        <IconButton icon={<IconBell />} />
      </div>
    </div>
    
    {/* Page content */}
  </Container>
</div>
```

### Card Grid Pattern
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <GlassCard key={item.id} hover="lift">
      <Heading size="h3" spacing="sm">
        {item.title}
      </Heading>
      <Text variant="muted">
        {item.description}
      </Text>
    </GlassCard>
  ))}
</div>
```

### Empty State Pattern
```tsx
{items.length === 0 ? (
  <EmptyState
    icon="📦"
    title="No items found"
    description="Get started by creating your first item"
    action={
      <Button onClick={handleCreate}>
        Create Item
      </Button>
    }
  />
) : (
  // Render items
)}
```

## Next Steps

1. ✅ Core components created
2. ✅ Dashboard main page migrated
3. 🔄 Migrate runbooks pages
4. 🔄 Migrate blogs pages
5. 🔄 Migrate sessions pages
6. 🔄 Update public pages (blog list, etc.)
