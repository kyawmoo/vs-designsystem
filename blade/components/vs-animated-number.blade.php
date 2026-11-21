{{--
    VectorSticker Animated Number — a figure that counts up when it first scrolls into view (a text effect).

    The server writes the FINAL figure, so the page is right with JavaScript off, for search engines and for reduced
    motion. blade/animated-number.js (load it once on the page, defer) counts the figure up from 0 and puts this text
    back at the end. Screen readers get the final figure once (a visually hidden copy; the moving text is aria-hidden).

    Props:
      value     number | null — null (or anything that is not a finite number) shows `fallback` and nothing moves.
      decimals  0 to 6 (default 0): digits after the decimal point; the figure moves in steps of 10^-decimals.
      duration  ms (default 1000); 0 shows the final figure at once.
      fallback  text shown when there is no number (default —). Escaped.
      locale    default en-US: the language tag used for the separators while it counts (the server text uses , and .).
    Other attributes (class, id) are passed to the element. Every piece of text is escaped.
--}}
@props([
    'value' => null,
    'decimals' => 0,
    'duration' => 1000,
    'fallback' => '—',
    'locale' => 'en-US',
])

@php
    $has = is_numeric($value) && is_finite((float) $value);
    $places = is_numeric($decimals) ? max(0, min(6, (int) $decimals)) : 0;
    $ms = is_numeric($duration) ? max(0, (int) $duration) : 1000;
    $tag = preg_match('/^[A-Za-z0-9-]{2,35}$/', (string) $locale) ? (string) $locale : 'en-US';
    $text = $has ? number_format((float) $value, $places, '.', ',') : null;
@endphp

@if ($has)
<span {{ $attributes }} data-vs-animated-number data-value="{{ (float) $value }}" data-decimals="{{ $places }}" data-duration="{{ $ms }}" data-locale="{{ $tag }}" ><span class="vs-animated-number__sr">{{ $text }}</span><span aria-hidden="true">{{ $text }}</span></span>
@else
<span {{ $attributes }}>{{ $fallback }}</span>
@endif
