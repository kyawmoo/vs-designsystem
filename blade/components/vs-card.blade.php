{{--
    VectorSticker Card — generic content-panel container.

    Wraps the REAL .card-v class already styled in
    public/themes/basic/assets/css/app.css (padding 35px / 45px≥1200px,
    border-radius 0.375rem, white background). Does not include the
    Item Card's price/cart/download logic — that stays in
    resources/views/themes/basic/partials/item.blade.php as application
    code; this component is only the presentational shell used for
    generic content cards (blog posts, profile panels, etc.), plus the
    `blog` variant (.card-blog: extra padding + border) already defined.

    Props:
      variant  blog | null   (default: null)
    Slot: card content.
--}}
@props([
    'variant' => null,
])

<div {{ $attributes->merge(['class' => 'card-v' . ($variant === 'blog' ? ' card-blog' : '')]) }}>
    {{ $slot }}
</div>
