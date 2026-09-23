{{--
    VectorSticker Breadcrumb — wraps the real .breadcrumb.custom pattern
    (public/themes/basic/assets/css/app.css: FontAwesome chevron divider
    via --bs-breadcrumb-divider, active item colored brand primary).

    Props:
      items  array of ['label' => string, 'href' => string|null]
             — omit href (or make it the last item) for the current page.
--}}
@props([
    'items' => [],
])

<nav aria-label="breadcrumb">
    <ol class="breadcrumb custom">
        @foreach ($items as $index => $item)
            @php $isLast = $index === count($items) - 1; @endphp
            <li class="breadcrumb-item {{ $isLast || empty($item['href']) ? 'active' : '' }}">
                @if (!$isLast && !empty($item['href']))
                    <a href="{{ $item['href'] }}">{{ $item['label'] }}</a>
                @else
                    {{ $item['label'] }}
                @endif
            </li>
        @endforeach
    </ol>
</nav>
