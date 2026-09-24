{{--
    VectorSticker Tabs — wraps the real .tabs-custom .nav-pills pattern
    (public/themes/basic/assets/css/app.css, audited):
      .tabs-custom .nav-pills { display: flex; gap: 17px; }
      .tabs-custom .nav-pills .nav-link { color: var(--secondary_color); border: 1px solid var(--secondary_color); }
      .tabs-custom .nav-pills .nav-link.active { font-weight: 500; color: #fff; background: var(--primary_color); border-color: var(--primary_color); }

    This is a deliberately DIFFERENT visual pattern from the React
    <Tabs> component (individually bordered pills with gaps, vs. the
    React side's single bordered track with a solid active fill) — see
    docs/components/tabs.html for the full explanation. Not unified,
    because the main site already ships this exact markup/CSS in
    production and there is nothing to fix; unifying would mean
    changing pages that already work, which contradicts "change the
    component, not the page."

    Props:
      tabs      array of ['id' => string, 'label' => string]
      activeId  the currently active tab id
      name      optional id/name prefix for generated anchors (default 'tab')
--}}
@props([
    'tabs' => [],
    'activeId' => null,
    'name' => 'tab',
])

<ul class="nav nav-pills tabs-custom">
    @foreach ($tabs as $tab)
        <li class="nav-item">
            <a
                class="nav-link {{ $activeId === $tab['id'] ? 'active' : '' }}"
                id="{{ $name }}-{{ $tab['id'] }}"
                href="#{{ $name }}-{{ $tab['id'] }}-pane"
                data-bs-toggle="pill"
                role="tab"
                aria-selected="{{ $activeId === $tab['id'] ? 'true' : 'false' }}"
            >{{ $tab['label'] }}</a>
        </li>
    @endforeach
</ul>
