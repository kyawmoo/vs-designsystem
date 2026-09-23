{{--
    VectorSticker Button — one component, all button usages on the main site.

    Wraps the REAL classes already styled in public/themes/basic/assets/css/app.css
    (.btn, .btn-primary, .btn-secondary, .btn-soft, .btn-social, .btn-outline-*),
    so no new CSS is needed for colors/hover/focus — this component only
    standardizes markup + the variant/size API so a future style change is a
    one-file edit here, not a find-and-replace across every Blade view.

    Props:
      variant   primary | secondary | tertiary | oauth   (default: primary)
                tertiary  -> .btn-soft (white bg, border_color border — matches
                             the React Button's "tertiary" emphasis)
                oauth     -> .btn-social (used for "Continue with Google" etc.)
      size      sm | md | lg                              (default: md)
      outline   bool — only applies to primary/secondary   (default: false)
      iconOnly  bool — square button, no visible label      (default: false)
      href      string|null — renders <a> instead of <button> when set
      type      button | submit | reset                    (default: button)
      disabled  bool                                        (default: false)

    Slots:
      default   button label (omit when iconOnly)
      icon      icon markup (an <i> or <svg>), shown before the label
--}}
{{-- 'icon' is intentionally not declared here — pass it as a named slot
     (<x-slot:icon>...</x-slot:icon>), which Blade exposes as $icon without
     needing a @props default. Declaring it as a prop too would shadow that
     and break slot content. --}}
@props([
    'variant' => 'primary',
    'size' => 'md',
    'outline' => false,
    'iconOnly' => false,
    'href' => null,
    'type' => 'button',
    'disabled' => false,
])

@php
    $classes = ['btn', "btn-{$size}"];

    if ($variant === 'tertiary') {
        $classes[] = 'btn-soft';
    } elseif ($variant === 'oauth') {
        $classes[] = 'btn-social';
    } else {
        $classes[] = $outline ? "btn-outline-{$variant}" : "btn-{$variant}";
    }

    if ($iconOnly) {
        $classes[] = 'vs-btn-icon-only';
    }

    $classString = implode(' ', $classes);
@endphp

@if ($href)
    <a
        href="{{ $href }}"
        {{ $attributes->merge(['class' => $classString]) }}
        @if ($disabled) aria-disabled="true" tabindex="-1" @endif
    >
        @isset($icon){{ $icon }}@endisset
        @unless ($iconOnly){{ $slot }}@endunless
    </a>
@else
    <button
        type="{{ $type }}"
        @disabled($disabled)
        {{ $attributes->merge(['class' => $classString]) }}
    >
        @isset($icon){{ $icon }}@endisset
        @unless ($iconOnly){{ $slot }}@endunless
    </button>
@endif
