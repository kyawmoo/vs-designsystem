{{--
    VectorSticker Item Card Action — one square icon button in the item card footer (spec v2).
    Use it inside <x-vs-item-card>'s `actions` slot for the page's own download / add-to-cart controls,
    so they all look the same and always have an accessible name. Styles: .vs-item-card__action in
    blade/components.css (tokens only).

    Props:
      icon      string   Font Awesome classes, e.g. "fa-solid fa-download" (required)
      label     string   accessible name (aria-label + tooltip); pass translated text (required)
      variant   primary | secondary | neutral   (default: primary)
                primary   filled brand colour — the main action (download, add to cart)
                secondary outlined dark — the view (eye) button
                neutral   outlined light — the heart
      href      string|null   renders <a> instead of <button> when set
      external  bool     with href: target="_blank" rel="noopener noreferrer nofollow"
      type      submit | button   (default: submit — the usual case inside the site's <form>)
      disabled  bool     e.g. add to cart on the visitor's own item. On a link: no href, aria-disabled.
    Extra attributes (data-*, aria-pressed, class, form, …) pass through to the <a>/<button>.
--}}
@props([
    'icon',
    'label',
    'variant' => 'primary',
    'href' => null,
    'external' => false,
    'type' => 'submit',
    'disabled' => false,
])

@php
    $variant = in_array($variant, ['primary', 'secondary', 'neutral'], true) ? $variant : 'primary';
    $classes = "vs-item-card__action vs-item-card__action--{$variant}";
@endphp

@if (filled($href))
    <a
        @unless ($disabled) href="{{ $href }}" @endunless
        @if ($external && ! $disabled) target="_blank" rel="noopener noreferrer nofollow" @endif
        @if ($disabled) aria-disabled="true" role="link" @endif
        aria-label="{{ $label }}"
        title="{{ $label }}"
        {{ $attributes->merge(['class' => $classes]) }}
    ><i class="{{ $icon }}" aria-hidden="true"></i></a>
@else
    <button
        type="{{ $type === 'button' ? 'button' : 'submit' }}"
        aria-label="{{ $label }}"
        title="{{ $label }}"
        @disabled($disabled)
        {{ $attributes->merge(['class' => $classes]) }}
    ><i class="{{ $icon }}" aria-hidden="true"></i></button>
@endif
