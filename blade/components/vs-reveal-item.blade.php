{{--
    VectorSticker RevealItem — one element that enters after the curtain of <x-vs-reveal>.

    The component IS the element (no wrapper): `as` picks the tag. It only sets the `data-vs-reveal` attribute
    that the CSS animates, and only while the parent <x-vs-reveal> is playing. Outside an <x-vs-reveal> it
    plays (the same default as the React component). An item inside another item stays still (CSS rule).

    Props:
      as       div | aside | main | header | footer | section | nav | article | ul | ol | li | p | span
               (default: div; any other value falls back to div, so a tag name can never be injected)
      variant  slide-left | fade | rise (default: fade; any other value falls back to fade)
    Slot: the element's content. Other attributes (class, id, aria-*) are passed to the element.
--}}
@aware(['play' => true])
@props([
    'as' => 'div',
    'variant' => 'fade',
])

@php
    $tag = in_array($as, ['div', 'aside', 'main', 'header', 'footer', 'section', 'nav', 'article', 'ul', 'ol', 'li', 'p', 'span'], true) ? $as : 'div';
    $motion = in_array($variant, ['slide-left', 'fade', 'rise'], true) ? $variant : 'fade';
@endphp

<{{ $tag }} {{ $attributes->merge($play ? ['data-vs-reveal' => $motion] : []) }}>
    {{ $slot }}
</{{ $tag }}>
