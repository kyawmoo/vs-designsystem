{{--
    VectorSticker Table — thin wrapper around the real
    <table class="table datatable w-100"> pattern used across every
    admin/settings list view (audited: resources/views/admin/blog/
    categories/index.blade.php, admin/settings/levels/index.blade.php).

    Sorting/pagination/search are NOT per-page JS — a single global
    script (public/vendor/admin/js/app.js) auto-selects every
    `.datatable` / `.datatable2` table on the page and initializes
    DataTables with a shared config (pageLength 50, translated
    language strings, pagination-sm styling). `datatable` defaults to
    sorting column 0 descending; `datatable2` uses DataTables' own
    default order. This component only needed to be a thin markup
    wrapper because that JS already exists site-wide — an earlier pass
    assumed this required new per-page JS and skipped it; re-auditing
    public/vendor/admin/js/app.js directly showed that assumption was
    wrong before anything was built on it.

    Props:
      columns    array of ['label' => string, 'width' => '2x'|'3x'|'7x'|null]
                 — width maps to the real tb-w-{N}x utility classes.
      variant    'datatable' (default sort desc on col 0) | 'datatable2'
                 (DataTables' own default order) — matches the real
                 site's two configured variants.
      card       wrap in the real .card chrome (default true, matches
                 every audited usage)

    Slot:
      the <tbody> content — written by the caller with @foreach, same
      as every real usage today, since row markup (badges, dropdown
      actions, icons) varies too much per page to generalize further.
--}}
@props([
    'columns' => [],
    'variant' => 'datatable',
    'card' => true,
])

@if ($card)
<div class="card">
@endif
    <table {{ $attributes->merge(['class' => "table {$variant} w-100"]) }}>
        @if (count($columns))
            <thead>
                <tr>
                    @foreach ($columns as $col)
                        <th class="{{ !empty($col['width']) ? 'tb-w-' . $col['width'] : '' }}">
                            {{ $col['label'] ?? '' }}
                        </th>
                    @endforeach
                </tr>
            </thead>
        @endif
        <tbody>
            {{ $slot }}
        </tbody>
    </table>
@if ($card)
</div>
@endif
