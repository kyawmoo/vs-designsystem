{{--
    VectorSticker Empty State — wraps the REAL .dashboard-card-empty class already styled in
    public/themes/basic/assets/css/app.css (centered column; `.pd` adds 8rem top and bottom padding).
    Same markup as resources/views/themes/basic/workspace/partials/card-empty.blade.php, so it can
    replace that partial and the 12 copies of `<div class="dashboard-card-empty pd">`.

    Props:
      title   string   short message (default: none; pass the translated text)
      size    md | lg  lg adds the `pd` padding class (default: md = no extra padding)

    Slots:
      icon        optional illustration or icon (decorative; hidden from screen readers)
      description optional second line
      (default)   optional extra content, e.g. a call-to-action button

    Colours: the site uses .text-muted for the whole block. That muted grey is about 2.8:1 on white,
    so the title and description here use the normal text colour; only the icon is muted.
--}}
@props([
    'title',
    'size' => 'md',
])

<div {{ $attributes->merge(['class' => 'dashboard-card-empty' . ($size === 'lg' ? ' pd' : '')]) }} role="status">
    @isset($icon)
        <div class="mb-3 text-muted" aria-hidden="true">{{ $icon }}</div>
    @endisset
    <h5 class="fw-light mb-0">{{ $title }}</h5>
    @isset($description)
        <p class="mt-2 mb-0">{{ $description }}</p>
    @endisset
    @if (trim((string) $slot) !== '')
        <div class="mt-3">{{ $slot }}</div>
    @endif
</div>
