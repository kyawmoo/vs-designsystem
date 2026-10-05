{{--
    VectorSticker Avatar — wraps the REAL .user-avatar classes already styled in
    public/themes/basic/assets/css/app.css (50px default, .user-avatar-lg 72px, .user-avatar-xl 95px,
    image 100% x 100% with an 8px radius). No new CSS. The site class also adds a 12px end margin
    (margin-inline-end); pass class="me-0" where that gap is not wanted, as the existing views do.

    Props:
      src    string   image URL (required: the site has no initials fallback)
      name   string   person's name, used for the alt text
      size   md | lg | xl   (default: md). The React-only `sm` (32px) has no site class.
      href   string|null    renders <a> instead of <div> when set (e.g. the profile link)

    Not included on purpose: the initials fallback and the `circle` shape exist in the React Avatar only.
--}}
@props([
    'src',
    'name' => '',
    'size' => 'md',
    'href' => null,
])

@php
    $classes = 'user-avatar' . match ($size) {
        'lg' => ' user-avatar-lg',
        'xl' => ' user-avatar-xl',
        default => '',
    };
    $tag = $href ? 'a' : 'div';
@endphp

<{{ $tag }} @if ($href) href="{{ $href }}" @endif {{ $attributes->merge(['class' => $classes]) }}>
    <img src="{{ $src }}" alt="{{ $name }}">
</{{ $tag }}>
