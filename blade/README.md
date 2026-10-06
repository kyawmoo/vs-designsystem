# VectorSticker Design System — Blade components

Server-rendered equivalents of the `react/` package, for vectorsticker.com
(Laravel/Blade). These are thin markup wrappers around CSS that already
exists and is already loaded on the main site — they don't ship their own
stylesheet the way `react/` does, because a Blade view always renders
inside a page that already has the site's CSS.

## Install (on vectorsticker.com)

1. Copy `blade/components/*.blade.php` into `resources/views/components/`.
2. Add `blade/components.css` to the main site's asset pipeline (link it
   after `public/themes/basic/assets/css/app.css` and the tokens). It adds the
   `.vs-btn-icon-only` sizing rule and the item card's own styles —
   everything else these components use (`.btn-primary`, `.btn-soft`,
   `.badge`, `.bg-orange`, …) is already defined and correctly styled by the
   site's own CSS.
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

### `<x-vs-item-card>` / `<x-vs-item-card-action>`

```blade
<x-vs-item-card class="item"
    :title="$item->name" :url="$vsCard->href" :external="$vsCard->external"
    :image="$item->getPreviewImageLink()" :category="$item->category?->name"
    :category-url="$item->category?->getLink()" :description="$item->description"
    :price="getAmount($item->getRegularPrice())" :view-label="translate('View Item')">
    <x-slot:actions>
        <form data-action="{{ route('cart.add-item') }}" class="add-to-cart-form" method="POST">
            <input type="hidden" name="item_id" value="{{ $item->id }}">
            <x-vs-item-card-action icon="fa-solid fa-shopping-cart" :label="translate('Add to Cart')"
                :disabled="authUser()?->id == $item->author_id" />
        </form>
    </x-slot:actions>
</x-vs-item-card>
```

The listing card from card spec v2, to replace `resources/views/themes/basic/partials/item.blade.php`. Unlike
the other components it has **its own CSS** (`blade/components.css`, item-card section) built on `--vs-*`
tokens only, so the site's token adapter carries the admin colours into it. Docs:
`docs/components/item-card.html`.

- **Presentation only.** It never decides what a visitor may do. The page passes its own controls (add to
  cart) in the `actions` slot (`x-vs-item-card-action` draws each as a 40px square icon button with an
  accessible name; `disabled` for the visitor's own item). External-seller items pass `external` and no
  actions. Every card gets the view (eye) button. The spec's "Add" text button is not used.
- **Author** hidden by default (category only); `show-author` prints "By author in category" using the site's
  existing `By :username in :category` translation, each part escaped. **Heart** off by default
  (`show-favorite`, `favorited`); its behaviour is the page's (`.vs-item-card__favorite` hook or the `favorite`
  slot).
- **Media**: `preview-type="image|video|audio"` renders the same `.item-video` / `.item-audio-wave` markup the
  site's plyr / WaveSurfer JS looks for, filling the square preview; or pass your own markup in the `media` slot.
- **Grid and list.** Pass the site's `item` class; the site's toggle adds `item-inline` (list) and `w-100` on the
  parent and sets the `item_view` cookie — the card follows `item-inline`. `layout="list"` adds it server-side.
  From 768px the preview sits left (320px, max 40%); below that the card stays stacked, like the site today.
- **Fluid width** (fills its grid column, no 344.5px); spec v2 text padding (14px), title (16px) and price (18px).
- **Live-card look kept (Master KMO, 6 Oct 2026):** image full card width (no inner padding), edge-ribbon badge
  (25px from the top, uppercase), 8px corners (`--vs-item-card-radius`; `--vs-card-radius` stays 3px for the
  reports dashboard). vectorsticker.com shows **no download button** on listing cards: free items get the eye
  button only.
- Hover: brand border + 4px lift (no lift with reduced motion). Keyboard focus ring on every link and button.
- Do **not** pass Bootstrap's `border` class (the listing pages pass `item_classes => 'border'` today): its
  `!important` colour hides the hover border. The card already has its own border.
- Text: only keys the old partial already uses go through `translate()` (Premium, Free, On Sale, Trending,
  Uncategorized, `By :username in :category`), so rendering a card never adds rows to the translations table.
  The button names (`view-label`, `favorite-label`, …) default to English: pass translated text.
- New tokens: `--vs-card-badge-{premium,sale,free,trending}-text` (badge text that stays ≥ 4.5:1; white was 2.78:1
  on the premium green and 2.4:1 on the sale teal), `--vs-card-list-media-width`, `--vs-item-card-radius`,
  `--vs-item-card-badge-top`.

**Not yet used on vectorsticker.com.** Rollout is a separate, page-group-by-page-group change on that repo; the
old partial stays until Master KMO signs off.

### `<x-vs-avatar>` / `<x-vs-empty-state>`

```blade
<x-vs-avatar :src="$user->getAvatar()" :name="$user->username" size="xl" :href="$user->getProfileLink()" class="me-0" />

<x-vs-empty-state :title="translate('No data found')" size="lg">
    <x-slot:icon>...optional illustration...</x-slot:icon>
</x-vs-empty-state>
```

`vs-avatar` wraps the real `.user-avatar` / `-lg` / `-xl` classes (50 / 72 / 95px; used in 13 places across 12
views). `vs-empty-state` wraps the real `.dashboard-card-empty` (+ `pd` for `size="lg"`) and has the same markup as
the workspace `card-empty` partial. The initials fallback, the `sm` size and the `circle` shape exist in the React
components only. Rendered in a stock Laravel 10 app (all 20 components, with the site's `translate()` helper):
no errors, and name/title values are HTML-escaped.

### `<x-vs-alert>` / `<x-vs-rating>`

```blade
<x-vs-alert tone="danger" :title="translate('KYC Verification Required')" class="mb-0">...</x-vs-alert>
<x-vs-rating :value="$item->avg_rating" :label="translate('Rated :n out of 5', ['n' => $item->avg_rating])" />
```

`vs-alert` wraps the real Bootstrap `.alert .alert-{tone}` markup (10 uses in 6 workspace views) and adds `role="alert"`
(warning, danger) or `role="status"` (info, success); `dismissible` uses Bootstrap's own close button. `vs-rating`
wraps the real `.ratings` / `.rating` / `.rating-active` markup of the `rating-stars` partial (13+ includes in 8 views)
and adds `role="img"` with a label. React has `Alert`; a React `Rating` is not built (no use in the reports dashboard).

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
