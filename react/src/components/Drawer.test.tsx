import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Drawer, DRAWER_WIDTH } from './Drawer';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

/** A page with a button that opens the drawer, like a table row's "View" button. */
function Page({ onClose, ...props }: Partial<React.ComponentProps<typeof Drawer>>) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>View</button>
      <Drawer
        open={open}
        title="User details"
        {...props}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <button type="button">First</button>
        <input aria-label="Search" />
        {props.children}
      </Drawer>
    </div>
  );
}

const openPage = (props: Partial<React.ComponentProps<typeof Drawer>> = {}) => {
  render(<Page {...props} />);
  const opener = screen.getByRole('button', { name: 'View' });
  opener.focus();
  fireEvent.click(opener);
  return opener;
};

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(<Drawer open={false} onClose={() => {}} title="Hidden">body</Drawer>);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.textContent).not.toContain('body');
  });

  it('is a modal dialog named by its title, with the default md width', () => {
    openPage();
    const dialog = screen.getByRole('dialog', { name: 'User details' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { name: 'User details' })).toBeTruthy();
    expect(dialog.style.width).toBe(DRAWER_WIDTH.md);
  });

  it('uses the sm width and falls back to md for an unknown width', () => {
    const { rerender } = render(<Drawer open onClose={() => {}} title="T" width="sm" />);
    expect(screen.getByRole('dialog').style.width).toBe('400px');
    rerender(<Drawer open onClose={() => {}} title="T" width={'xl' as never} />);
    expect(screen.getByRole('dialog').style.width).toBe('520px');
  });

  it('shows a custom header instead of the title heading, and the title still names the dialog', () => {
    openPage({ header: <div>member4 · Active</div> });
    expect(screen.getByRole('dialog', { name: 'User details' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'User details' })).toBeNull();
    expect(screen.getByText('member4 · Active')).toBeTruthy();
  });

  it('renders the footer only when given', () => {
    const { rerender, container } = render(<Drawer open onClose={() => {}} title="T">x</Drawer>);
    expect(container.ownerDocument.querySelector('.vs-drawer-footer')).toBeNull();
    rerender(<Drawer open onClose={() => {}} title="T" footer={<span>Page 1 of 25</span>}>x</Drawer>);
    expect(document.querySelector('.vs-drawer-footer')?.textContent).toBe('Page 1 of 25');
  });

  it('closes on Escape, on the close button and on the overlay, but not on a click inside', () => {
    for (const close of [
      () => fireEvent.keyDown(document, { key: 'Escape' }),
      () => fireEvent.click(screen.getByRole('button', { name: 'Close' })),
      () => fireEvent.click(document.querySelector('.vs-drawer-overlay') as Element),
    ]) {
      const onClose = vi.fn();
      openPage({ onClose });
      fireEvent.click(screen.getByRole('dialog'));
      fireEvent.click(screen.getByRole('button', { name: 'First' }));
      expect(onClose).not.toHaveBeenCalled();
      close();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
      cleanup();
    }
  });

  it('moves focus into the panel and back to the opener on close', () => {
    const opener = openPage();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(opener);
  });

  it('keeps Tab and Shift+Tab inside the panel', () => {
    openPage();
    const close = screen.getByRole('button', { name: 'Close' });
    const search = screen.getByRole('textbox', { name: 'Search' });

    search.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    close.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(search);

    // focus somewhere outside the panel is pulled back in
    (screen.getByRole('button', { name: 'View', hidden: true }) as HTMLElement).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });

  it('locks the page scroll while open and restores the previous value', () => {
    document.body.style.overflow = 'scroll';
    openPage();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('does not steal focus again when the parent re-renders with a new onClose', () => {
    function Rerendering() {
      const [n, setN] = useState(0);
      return (
        <Drawer open onClose={() => setN(n + 1)} title="T">
          <button type="button" onClick={() => setN((v) => v + 1)}>Count {n}</button>
        </Drawer>
      );
    }
    render(<Rerendering />);
    const count = screen.getByRole('button', { name: /Count/ });
    count.focus();
    fireEvent.click(count);
    expect(screen.getByRole('button', { name: 'Count 1' })).toBe(document.activeElement);
  });

  it('ignores keys other than Escape and Tab', () => {
    const onClose = vi.fn();
    openPage({ onClose });
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
