{{--
    VectorSticker Badge — item moderation status + generic semantic badges.

    Wraps the REAL admin badge classes already styled in
    public/vendor/admin/css/app.css (.badge + the bg-orange/bg-purple/
    bg-blue/bg-green/bg-red utility classes audited from
    resources/views/admin/items/index.blade.php's status column) plus
    Bootstrap's own bg-{success|warning|info|danger|secondary|light|dark}
    utilities for general use elsewhere on the site. No new CSS needed —
    text color comes from Bootstrap's base .badge rule already loaded
    site-wide.

    Props:
      itemStatus  pending | soft-rejected | resubmitted | approved |
                  hard-rejected | deleted
                  — takes priority over `tone` when set; matches the same
                  6 states as $item->isPending() etc. and the Badge.tsx
                  BadgeItemStatusTone union on the reports-site side.
      tone        success | warning | danger | info | secondary | light | dark
                  (default: secondary) — used when itemStatus is not set.

    Slot: badge label text.
--}}
@props([
    'itemStatus' => null,
    'tone' => 'secondary',
])

@php
    $itemStatusMap = [
        'pending' => 'bg-orange',
        'soft-rejected' => 'bg-purple',
        'resubmitted' => 'bg-blue',
        'approved' => 'bg-green',
        'hard-rejected' => 'bg-red',
        'deleted' => 'bg-danger',
    ];

    $bgClass = $itemStatus
        ? ($itemStatusMap[$itemStatus] ?? 'bg-secondary')
        : "bg-{$tone}";

    $classString = "badge {$bgClass} rounded-2 fw-light px-3 py-2";
@endphp

<div {{ $attributes->merge(['class' => $classString]) }}>
    {{ $slot }}
</div>
