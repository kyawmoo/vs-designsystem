/**
 * VectorSticker Design System docs — shared header + sidebar.
 * Single source of truth for the nav list so adding a page later is a
 * one-line edit here, not a find-and-replace across every HTML file.
 */
(function () {
  const NAV = [
    {
      group: 'Overview',
      items: [{ id: 'getting-started', label: 'Getting Started', href: '/', icon: 'rocket' }],
    },
    {
      group: 'Foundations',
      items: [
        { id: 'colors', label: 'Colors', href: '/foundations/colors.html', icon: 'palette' },
        { id: 'typography', label: 'Typography', href: '/foundations/typography.html', icon: 'type' },
        { id: 'spacing-radius', label: 'Spacing & Radius', href: '/foundations/spacing-radius.html', icon: 'panels-top-left' },
        { id: 'shadow', label: 'Shadow', href: '/foundations/shadow.html', icon: 'layers' },
        { id: 'iconography', label: 'Iconography', href: '/foundations/iconography.html', icon: 'shapes' },
      ],
    },
    {
      group: 'Components',
      items: [
        { id: 'button', label: 'Button', href: '/components/button.html', icon: 'square-mouse-pointer' },
        { id: 'badge', label: 'Badge', href: '/components/badge.html', icon: 'tag' },
        { id: 'card', label: 'Card', href: '/components/card.html', icon: 'layout-panel-top' },
        { id: 'table', label: 'Table', href: '/components/table.html', icon: 'table-2' },
        { id: 'breadcrumb', label: 'Breadcrumb', href: '/components/breadcrumb.html', icon: 'chevrons-right' },
        { id: 'pagination', label: 'Pagination', href: '/components/pagination.html', icon: 'ellipsis' },
        { id: 'tabs', label: 'Tabs', href: '/components/tabs.html', icon: 'panel-top' },
        { id: 'filter-bar', label: 'Filter Bar', href: '/components/filter-bar.html', icon: 'filter' },
        { id: 'modal', label: 'Modal', href: '/components/modal.html', icon: 'app-window' },
        { id: 'toast', label: 'Toast', href: '/components/toast.html', icon: 'bell' },
      ],
    },
    {
      group: 'Form Elements',
      items: [
        { id: 'text-input', label: 'Text Input', href: '/components/text-input.html', icon: 'text-cursor-input' },
        { id: 'textarea', label: 'Textarea', href: '/components/textarea.html', icon: 'square-pen' },
        { id: 'select', label: 'Select', href: '/components/select.html', icon: 'square-chevron-down' },
        { id: 'checkbox', label: 'Checkbox', href: '/components/checkbox.html', icon: 'square-check' },
        { id: 'radio', label: 'Radio', href: '/components/radio.html', icon: 'circle-dot' },
        { id: 'switch', label: 'Switch', href: '/components/switch.html', icon: 'toggle-right' },
        { id: 'search-input', label: 'Search Input', href: '/components/search-input.html', icon: 'search' },
        { id: 'file-input', label: 'File Input', href: '/components/file-input.html', icon: 'upload' },
        { id: 'input-group', label: 'Input Group', href: '/components/input-group.html', icon: 'group' },
      ],
    },
  ];

  // Lucide icons (ISC license), lucide-static@0.546.0 — same version as react/.
  const ICONS = {
    'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /> <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /> <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />',
    'palette': '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /> <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /> <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /> <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /> <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />',
    'type': '<path d="M12 4v16" /> <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" /> <path d="M9 20h6" />',
    'panels-top-left': '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 9h18" /> <path d="M9 21V9" />',
    'layers': '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
    'shapes': '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" /> <rect x="3" y="14" width="7" height="7" rx="1" /> <circle cx="17.5" cy="17.5" r="3.5" />',
    'square-mouse-pointer': '<path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" /> <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />',
    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /> <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />',
    'layout-panel-top': '<rect width="18" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" />',
    'table-2': '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />',
    'chevrons-right': '<path d="m6 17 5-5-5-5" /> <path d="m13 17 5-5-5-5" />',
    'ellipsis': '<circle cx="12" cy="12" r="1" /> <circle cx="19" cy="12" r="1" /> <circle cx="5" cy="12" r="1" />',
    'panel-top': '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M3 9h18" />',
    'filter': '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />',
    'app-window': '<rect x="2" y="4" width="20" height="16" rx="2" /> <path d="M10 4v4" /> <path d="M2 8h20" /> <path d="M6 4v4" />',
    'bell': '<path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />',
    'text-cursor-input': '<path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" /> <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" /> <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" /> <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" /> <path d="M9 6v12" />',
    'square-pen': '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /> <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />',
    'square-chevron-down': '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="m16 10-4 4-4-4" />',
    'square-check': '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="m9 12 2 2 4-4" />',
    'circle-dot': '<circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="1" />',
    'toggle-right': '<circle cx="15" cy="12" r="3" /> <rect width="20" height="14" x="2" y="5" rx="7" />',
    'search': '<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',
    'upload': '<path d="M12 3v12" /> <path d="m17 8-5-5-5 5" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
    'group': '<path d="M3 7V5c0-1.1.9-2 2-2h2" /> <path d="M17 3h2c1.1 0 2 .9 2 2v2" /> <path d="M21 17v2c0 1.1-.9 2-2 2h-2" /> <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" /> <rect width="7" height="5" x="7" y="7" rx="1" /> <rect width="7" height="5" x="10" y="12" rx="1" />',
  };

  function icon(name) {
    const body = ICONS[name];
    if (!body) return '';
    return `<svg class="vs-docs-sidebar-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  function renderHeader() {
    const mount = document.getElementById('vs-docs-header-mount');
    if (!mount) return;
    mount.innerHTML = `
      <header class="vs-docs-header">
        <a class="vs-docs-header-brand" href="/" aria-label="VectorSticker Design System — home">
          <img class="vs-docs-header-logo" src="/assets/logo.png" alt="VectorSticker Design System" width="100" height="48">
        </a>
        <nav class="vs-docs-header-links">
          <a href="https://github.com/kyawmoo/vs-designsystem" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </header>
    `;
  }

  function renderSidebar() {
    const mount = document.getElementById('vs-docs-sidebar-mount');
    if (!mount) return;
    const active = document.body.dataset.page;
    const groups = NAV.map((group) => {
      const links = group.items
        .map((item) => {
          const isActive = item.id === active;
          return `<a href="${item.href}" class="${isActive ? 'is-active' : ''}"${isActive ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${item.label}</span></a>`;
        })
        .join('');
      return `<div class="vs-docs-sidebar-group"><p class="vs-docs-sidebar-group-title">${group.group}</p>${links}</div>`;
    }).join('');
    mount.innerHTML = `<nav class="vs-docs-sidebar" aria-label="Design system pages">${groups}</nav>`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderSidebar();
  });
})();
