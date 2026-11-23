{{--
    VectorSticker RevealText — a title that appears letter by letter after the curtain of <x-vs-reveal>.

    The component IS the element (no wrapper): `as` picks the tag. Each letter rises from below its line and comes
    into focus (CSS only: the `vs-reveal` block of blade/components.css, timing from the --vs-motion-text-* tokens).
    Put it inside the page body: it starts together with the body fade. It only splits the text into letters while the
    parent <x-vs-reveal> is playing (outside one it plays, like the React component); with `play` off it renders the
    plain text and no extra elements. Screen readers read a visually hidden copy; the letters are aria-hidden.
    Only text in scripts that can be split safely (Latin, Greek, Cyrillic, Armenian, Georgian, Hangul, digits, punctuation,
    emoji) is split; Arabic, Hebrew, Burmese, Thai, Indic, Han, Kana and any mix with them stay plain text, unchanged.
    Every piece of the text is escaped.

    Props:
      text  string — the title.
      as    span | div | p | h1 | h2 | h3 | h4 | h5 | h6 (default: span; any other value falls back to span, so a tag
            name can never be injected)
    Other attributes (class, id, aria-*) are passed to the element.
--}}
@aware(['play' => true])
@props([
    'text' => '',
    'as' => 'span',
])

@php
    $tag = in_array($as, ['span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], true) ? $as : 'span';
    $plain = (string) $text;
    // Only scripts that can be split safely (the same rule as RevealText.tsx: check-tokens keeps the two in step); anything else, or text
    // that is not valid UTF-8, stays plain text.
    $splittable = preg_match('/^[\p{Latin}\p{Greek}\p{Cyrillic}\p{Armenian}\p{Georgian}\p{Hangul}\p{Common}\p{Inherited}]*$/u', $plain) === 1;
    $words = preg_split('/\s+/u', trim($plain), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $letter = 0;
@endphp

<{{ $tag }} {{ $attributes->merge($play && $splittable ? ['data-vs-reveal-text' => ''] : []) }}>
@if ($play && $splittable)<span class="vs-reveal-text__sr">{{ $plain }}</span><span class="vs-reveal-text__visual" aria-hidden="true">@foreach ($words as $word)@unless ($loop->first) @endunless<span class="vs-reveal-text__word">@foreach ((preg_match_all('/\X/u', $word, $graphemes) ? $graphemes[0] : []) as $g)<span class="vs-reveal-text__letter" style="--i:{{ min($letter++, 30) }}">{{ $g }}</span>@endforeach</span>@endforeach</span>@else{{ $plain }}@endif
</{{ $tag }}>
