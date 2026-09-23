{{--
    VectorSticker Item Badge — the 4 product badges from
    resources/views/themes/basic/partials/item.blade.php (Premium/Free/
    On Sale/Trending), wrapping the real .item-badge / .item-badge-* CSS
    (public/themes/basic/assets/css/app.css) whose colors are the exact
    color.badge tokens (trending #0074E4, sale #0BBE9A, free #743CEE,
    premium = brand primary #4CAF50) — same values as Badge.tsx's
    BadgeProductTone on the reports-site side.

    Props:
      type  premium | free | sale | trending   (default: premium)
    Slot: label override (defaults to the real translate() label used
          on the item card, e.g. translate('Premium')).
--}}
@props([
    'type' => 'premium',
])

@php
    $icon = match ($type) {
        'premium' => 'fa-solid fa-crown',
        'free' => 'fa-regular fa-heart',
        'sale' => 'fa-solid fa-tag',
        'trending' => 'fa-solid fa-bolt',
        default => 'fa-solid fa-crown',
    };

    $defaultLabel = match ($type) {
        'premium' => translate('Premium'),
        'free' => translate('Free'),
        'sale' => translate('On Sale'),
        'trending' => translate('Trending'),
        default => '',
    };
@endphp

<div {{ $attributes->merge(['class' => "item-badge item-badge-{$type}"]) }}>
    <i class="{{ $icon }} me-1"></i>{{ $slot->isNotEmpty() ? $slot : $defaultLabel }}
</div>
