# VectorSticker Design System — Blade components

Server-rendered equivalents of the `react/` package, for vectorsticker.com
(Laravel/Blade). These are thin markup wrappers around CSS that already
exists and is already loaded on the main site — they don't ship their own
stylesheet the way `react/` does, because a Blade view always renders
inside a page that already has the site's CSS.

## Install (on vectorsticker.com)

1. Copy `blade/components/*.blade.php` into `resources/views/components/`.
2. Add `blade/components.css` to the main site's asset pipeline (link it
   after `public/themes/basic/assets/css/app.css`). It only adds the
   `.vs-btn-icon-only` sizing rule — everything else these components use
   (`.btn-primary`, `.btn-soft`, `.badge`, `.bg-orange`, …) is already
   defined and correctly styled by the site's own CSS.
3. Use as `<x-vs-button>` / `<x-vs-badge>` anywhere in a Blade view.

**This has not been copied into vectorsticker.com or run against a live
Laravel app** — per the read-only, main-site-untouched constraint on this
engagement, that install step is deliberately left for Master KMO (or a
session explicitly scoped to that repo) to do and verify.

## Components

### `<x-vs-button>`

```blade
<x-vs-button variant="primary">Save changes</x-vs-button>
<x-vs-button variant="secondary" size="lg" href="/browse">Browse</x-vs-button>
<x-vs-button variant="primary" outline>Cancel</x-vs-button>
<x-vs-button variant="tertiary">Soft action</x-vs-button>
<x-vs-button variant="oauth" href="{{ route('oauth.login', 'google') }}">
    <x-slot:icon><img src="{{ asset('img/google.svg') }}" width="20"></x-slot:icon>
    Continue with Google
</x-vs-button>
<x-vs-button variant="tertiary" icon-only aria-label="Grid view">
    <x-slot:icon><i class="fa-solid fa-grip"></i></x-slot:icon>
</x-vs-button>
```

`variant`: `primary` | `secondary` | `tertiary` (→ `.btn-soft`) | `oauth`
(→ `.btn-social`). `size`: `sm` | `md` | `lg`. `outline`: bool, primary/
secondary only. `iconOnly`: bool — replaces the ad-hoc inline
`style="height:38px;width:38px;padding:0;"` seen in
`grid-buttons.blade.php` with a proper `.vs-btn-icon-only` class.

### `<x-vs-badge>`

```blade
<x-vs-badge item-status="pending">{{ $item->getStatusName() }}</x-vs-badge>
<x-vs-badge tone="success">Verified</x-vs-badge>
```

`itemStatus`: `pending` | `soft-rejected` | `resubmitted` | `approved` |
`hard-rejected` | `deleted` — maps to the exact `bg-orange` / `bg-purple`
/ `bg-blue` / `bg-green` / `bg-red` / `bg-danger` classes already used in
`resources/views/admin/items/index.blade.php`. `tone`: generic Bootstrap
`bg-{tone}` (`success`/`warning`/`danger`/`info`/`secondary`/`light`/
`dark`) for badges outside the item-moderation flow.

### `<x-vs-card>` / `<x-vs-item-badge>`

```blade
<x-vs-card>...</x-vs-card>
<x-vs-card variant="blog">...</x-vs-card>

<x-vs-item-badge type="premium" />
<x-vs-item-badge type="trending">Hot right now</x-vs-item-badge>
```

`vs-card` wraps `.card-v` (generic content panel — blog posts, profile
panels). It intentionally does **not** reproduce the full Item Card from
`resources/views/themes/basic/partials/item.blade.php`: that partial's
price/cart/download logic touches payment and billing, which this
engagement's rules require asking about first rather than silently
re-implementing — so `item.blade.php` stays as application code. Only
the safe, presentational piece — the 4 product badges (Premium/Free/On
Sale/Trending) — was pulled out, as `vs-item-badge`, wrapping the real
`.item-badge-*` classes whose colors are the exact same `color.badge`
tokens as `Badge.tsx`'s `BadgeProductTone` on the reports-site side.

### Form elements (9 types)

```blade
<x-vs-input name="email" type="email" label="Email address" required />
<x-vs-textarea name="bio" label="Bio" rows="5" />
<x-vs-select name="category" label="Category" :options="['a' => 'Category A']" placeholder="Choose..." />
<x-vs-checkbox name="terms">I agree to the terms</x-vs-checkbox>
<x-vs-radio name="plan" value="monthly" checked>Monthly</x-vs-radio>
<x-vs-switch name="notifications" checked>Email notifications</x-vs-switch>
<x-vs-search-input placeholder="Search stickers..." />
<x-vs-file-input name="avatar" accept="image/*" label="Profile photo" />
<x-vs-input-group name="referral_link" :value="$link" readonly onclick="copyLink()">
    <i class="fa fa-copy"></i> Copy
</x-vs-input-group>
```

All 9 wrap the real `.form-control` / `.form-select` / `.form-check-input`
/ `.form-search` / `.input-group.custom` classes from
`public/themes/basic/assets/css/app.css` — no new CSS. Every text-entry
component (`vs-input`, `vs-textarea`, `vs-select`, `vs-checkbox`,
`vs-radio`, `vs-switch`, `vs-file-input`) takes an `error` prop that adds
`.is-invalid` and renders Bootstrap's real `.invalid-feedback` sibling
(shown automatically by Bootstrap's own `is-invalid ~ invalid-feedback`
CSS rule — nothing custom needed), and repopulates its value via
Laravel's `old($name, $value)` on a failed-validation redirect.

## Known gaps — not fixed by this pass

- **Public vs. admin CSS split**: `vs-button`'s classes (`.btn-primary`
  etc.) and the 9 form components' classes are styled by
  `public/themes/basic/assets/css/app.css` (public site). `vs-badge`'s
  item-status classes (`bg-orange` etc.) are styled by
  `public/vendor/admin/css/app.css` (admin panel only). The two
  stylesheets are not both loaded on every page today, so using a
  component styled by one on a page that only loads the other will
  render unstyled — the same "One-System Gap" documented during the
  Stitch prompting phase, still open.
- **`vs-input-group`**: the docked button's click behavior (copy-to-
  clipboard, password-visibility toggle, …) is page-specific. The
  `onclick` prop covers a plain inline-JS handler; Alpine/Livewire
  wiring (`x-on:click`, `wire:click`) isn't a plain string attribute, so
  that needs editing the component file directly for now.

## Still to build

Navigation, Table/Filter/Tab, Modal & Toast — see the design-system
rollout plan.
