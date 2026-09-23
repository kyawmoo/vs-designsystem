{{--
    VectorSticker Search Input — wraps .form-search (public/themes/basic/
    assets/css/app.css), matching the exact real markup found in
    resources/views/themes/basic/workspace/purchases/index.blade.php:
    a leading icon-button + .form-control. This component is just the
    search box — wrap it in your own <form method="GET"> as the real
    usage does.

    Props: name (default 'search'), value, placeholder, size (md|lg),
    reverse (bool — icon on the right instead of the left, matching
    .form-search-reverse).
--}}
@props([
    'name' => 'search',
    'value' => null,
    'placeholder' => null,
    'size' => 'md',
    'reverse' => false,
])

<div class="form-search{{ $reverse ? ' form-search-reverse' : '' }}">
    <button type="submit" class="icon" aria-label="{{ translate('Search') }}">
        <i class="fa fa-search"></i>
    </button>
    <input
        type="text"
        name="{{ $name }}"
        value="{{ old($name, $value) }}"
        placeholder="{{ $placeholder ?? translate('Search...') }}"
        {{ $attributes->merge(['class' => "form-control form-control-{$size}"]) }}
    >
</div>
