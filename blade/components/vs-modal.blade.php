{{--
    VectorSticker Modal — thin wrapper around Bootstrap's own real
    .modal/.modal-dialog/.modal-content markup (vendored bootstrap.min.css,
    audited: .modal-content already gives the border/radius/bg via
    --bs-modal-* variables; Bootstrap's own bundled JS handles open/close
    via data-bs-toggle/data-bs-dismiss, so no custom JS is needed here —
    same reasoning as vs-pagination.blade.php wrapping Laravel's paginator).

    Props:
      id        the modal's DOM id, used by data-bs-target="#{id}" triggers
      title     optional header title
      size      '' | 'sm' | 'lg' | 'xl' (maps to .modal-{size})
--}}
@props([
    'id' => 'vsModal',
    'title' => null,
    'size' => '',
])

<div class="modal fade" id="{{ $id }}" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered {{ $size ? 'modal-' . $size : '' }}">
        <div class="modal-content">
            @if ($title)
                <div class="modal-header">
                    <h5 class="modal-title">{{ $title }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
            @endif
            <div class="modal-body">
                {{ $slot }}
            </div>
            @isset($footer)
                <div class="modal-footer">
                    {{ $footer }}
                </div>
            @endisset
        </div>
    </div>
</div>
