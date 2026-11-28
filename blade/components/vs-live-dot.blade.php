{{--
    VectorSticker Live dot (Animation & Effects, 27 Nov 2026): a small dot with a soft ripple that grows and fades on repeat,
    for "live" / "online" / "newest" marks next to a label or an avatar. Same CSS as the React LiveDot and the chart dot
    (.vs-live-dot block in blade/components.css). Reduced motion: the dot stays, no ripple.

    Props:
      color   a design token as var(--vs-...), or a hex colour (#rgb, #rgba, #rrggbb, #rrggbbaa). Anything else is ignored
              and the default is used (the brand green), so no other text can reach the style attribute.
      size    sm (5px) | md (8px, default) | lg (12px); anything else: md
      ripple  true (default) | false
      label   what the dot means, for screen readers (e.g. "Live"). Without it the dot is aria-hidden: put the meaning in the
              text next to it.

    Other attributes (class, id, data-*) are passed to the span.
--}}
@props([
    'color' => null,
    'size' => 'md',
    'ripple' => true,
    'label' => null,
])

@php
    $classes = 'vs-live-dot vs-live-dot--inline';
    if ($size === 'sm' || $size === 'lg') {
        $classes .= ' vs-live-dot--' . $size;
    }
    // false, "false", "0", "off", "no": no ripple; anything else keeps it.
    if ($ripple !== null && filter_var($ripple, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === false) {
        $classes .= ' vs-live-dot--still';
    }
    $safeColor = is_string($color)
        && preg_match('/^(var\(--vs-[a-z0-9-]+\)|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))$/', $color) === 1
        ? $color
        : null;
    $hasLabel = is_string($label) && trim($label) !== '';
    $merge = ['class' => $classes];
    if ($safeColor !== null) {
        $merge['style'] = '--vs-live-dot-color: ' . $safeColor . ';'; // ends in ';' so a style attribute of the caller can follow it
    }
    $a11y = $hasLabel ? ['role' => 'img', 'aria-label' => $label] : ['aria-hidden' => 'true'];
@endphp

<span {{ $attributes->merge($merge)->merge($a11y) }}></span>
