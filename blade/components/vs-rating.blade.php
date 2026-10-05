{{--
    VectorSticker Rating — display-only stars. Same markup and classes as the site's
    resources/views/themes/basic/partials/rating-stars.blade.php (`.ratings`, `.rating`, `.rating-active`, Font
    Awesome star), which 8 views include 13+ times, so it looks the same. It adds the accessible name the partial
    lacks: the wrapper is role="img" with a label and the stars are hidden from screen readers.
    React: not built (the reports dashboard shows no star ratings).

    Props:
      value   number   how many stars are filled; a star is filled when value > its index, exactly like the
                       partial's `$stars > $i`
      max     int      number of stars (default 5)
      label   string   accessible name; pass a translated string such as translate('Rated 4 out of 5').
                       Default (English): "Rated {value} out of {max}"
    Extra classes pass through (the partial's $ratings_classes).
--}}
@props([
    'value' => 0,
    'max' => 5,
    'label' => null,
])

@php
    $max = max(1, (int) $max);
    $label = $label ?? 'Rated ' . rtrim(rtrim(number_format((float) $value, 1, '.', ''), '0'), '.') . ' out of ' . $max;
@endphp

<div {{ $attributes->merge(['class' => 'row row-cols-auto flex-nowrap g-1 ratings', 'role' => 'img', 'aria-label' => $label]) }}>
    @for ($i = 0; $i < $max; $i++)
        <div class="col rating {{ $value > $i ? 'rating-active' : '' }}" aria-hidden="true">
            <i class="fa fa-star"></i>
        </div>
    @endfor
</div>
