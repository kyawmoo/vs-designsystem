{{--
    VectorSticker Pagination — thin wrapper around Laravel's own
    paginator view, which already renders real .page-item/.page-link
    markup styled by the site's own CSS (audited: radius 5px !important,
    padding 6px 15px, hover/active fill solid brand primary + white —
    all already correct via the real classes, no override needed here).

    Props:
      paginator  a LengthAwarePaginator (or Paginator) instance,
                 e.g. from Model::paginate().
--}}
@props([
    'paginator' => null,
])

@if ($paginator && $paginator->hasPages())
    {{ $paginator->links() }}
@endif
