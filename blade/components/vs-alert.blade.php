{{--
    VectorSticker Alert — wraps the REAL Bootstrap `.alert .alert-{tone}` markup the workspace views use today
    (workspace/layouts/app.blade.php, withdrawals, discount, edit, changelogs: 10 uses in 6 views), so it looks
    the same, and adds what they lack: role="alert" (warning, danger) or role="status" (info, success) so a
    screen reader announces it. Dismiss uses Bootstrap's own JS (data-bs-dismiss), no custom JS.

    Props:
      tone         success | warning | danger | info   (default: info)
      title        string|null   rendered as <h4 class="alert-heading"> like the existing views
      dismissible  bool          adds a Bootstrap close button (default: false)
    Slot: the message.   Extra classes pass through (e.g. class="mb-0").
--}}
@props([
    'tone' => 'info',
    'title' => null,
    'dismissible' => false,
])

@php
    $tone = in_array($tone, ['success', 'warning', 'danger', 'info'], true) ? $tone : 'info';
    $role = in_array($tone, ['warning', 'danger'], true) ? 'alert' : 'status';
    $classes = "alert alert-{$tone}" . ($dismissible ? ' alert-dismissible fade show' : '');
@endphp

<div {{ $attributes->merge(['class' => $classes, 'role' => $role]) }}>
    @if ($title)
        <h4 class="alert-heading">{{ $title }}</h4>
    @endif
    {{ $slot }}
    @if ($dismissible)
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    @endif
</div>
