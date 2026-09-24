/**
 * VectorSticker Design System docs — shared header + sidebar.
 * Single source of truth for the nav list so adding a page later is a
 * one-line edit here, not a find-and-replace across every HTML file.
 */
(function () {
  const NAV = [
    {
      group: 'Overview',
      items: [{ id: 'getting-started', label: 'Getting Started', href: '/' }],
    },
    {
      group: 'Foundations',
      items: [
        { id: 'colors', label: 'Colors', href: '/foundations/colors.html' },
        { id: 'typography', label: 'Typography', href: '/foundations/typography.html' },
        { id: 'spacing-radius', label: 'Spacing & Radius', href: '/foundations/spacing-radius.html' },
        { id: 'shadow', label: 'Shadow', href: '/foundations/shadow.html' },
        { id: 'iconography', label: 'Iconography', href: '/foundations/iconography.html' },
      ],
    },
    {
      group: 'Components',
      items: [
        { id: 'button', label: 'Button', href: '/components/button.html' },
        { id: 'badge', label: 'Badge', href: '/components/badge.html' },
        { id: 'card', label: 'Card', href: '/components/card.html' },
        { id: 'table', label: 'Table', href: '/components/table.html' },
        { id: 'breadcrumb', label: 'Breadcrumb', href: '/components/breadcrumb.html' },
        { id: 'pagination', label: 'Pagination', href: '/components/pagination.html' },
        { id: 'tabs', label: 'Tabs', href: '/components/tabs.html' },
        { id: 'filter-bar', label: 'Filter Bar', href: '/components/filter-bar.html' },
        { id: 'modal', label: 'Modal', href: '/components/modal.html' },
        { id: 'toast', label: 'Toast', href: '/components/toast.html' },
      ],
    },
    {
      group: 'Form Elements',
      items: [
        { id: 'text-input', label: 'Text Input', href: '/components/text-input.html' },
        { id: 'textarea', label: 'Textarea', href: '/components/textarea.html' },
        { id: 'select', label: 'Select', href: '/components/select.html' },
        { id: 'checkbox', label: 'Checkbox', href: '/components/checkbox.html' },
        { id: 'radio', label: 'Radio', href: '/components/radio.html' },
        { id: 'switch', label: 'Switch', href: '/components/switch.html' },
        { id: 'search-input', label: 'Search Input', href: '/components/search-input.html' },
        { id: 'file-input', label: 'File Input', href: '/components/file-input.html' },
        { id: 'input-group', label: 'Input Group', href: '/components/input-group.html' },
      ],
    },
  ];

  function renderHeader() {
    const mount = document.getElementById('vs-docs-header-mount');
    if (!mount) return;
    mount.innerHTML = `
      <header class="vs-docs-header">
        <a class="vs-docs-header-brand" href="/">
          <span class="vs-docs-header-logo">VS</span>
          VectorSticker Design System
          <span class="vs-docs-header-version">v0.1.0</span>
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
        .map(
          (item) =>
            `<a href="${item.href}" class="${item.id === active ? 'is-active' : ''}">${item.label}</a>`
        )
        .join('');
      return `<div class="vs-docs-sidebar-group"><p class="vs-docs-sidebar-group-title">${group.group}</p>${links}</div>`;
    }).join('');
    mount.innerHTML = `<nav class="vs-docs-sidebar">${groups}</nav>`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    renderSidebar();
  });
})();
