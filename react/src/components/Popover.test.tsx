import React, { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from './Popover';
import type { PopoverAlign } from './Popover';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

function stubMatchMedia(narrow: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: narrow,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

/** Real usage: a button that toggles the panel; the page owns `open`. */
function Harness({ align, onClose }: { align?: PopoverAlign; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={ref} onClick={() => setOpen((o) => !o)}>
        Open
      </button>
      <button>Other</button>
      <Popover
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        anchorRef={ref}
        label="Pick a range"
        align={align}
      >
        <button>First</button>
        <button>Last</button>
      </Popover>
    </div>
  );
}

describe('Popover: opening and closing', () => {
  it('renders nothing while closed and a named dialog while open', async () => {
    stubMatchMedia(false);
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByText('Open'));
    const dialog = screen.getByRole('dialog', { name: 'Pick a range' });
    expect(dialog.getAttribute('aria-modal')).toBe('false');
  });

  it('closes on Escape and gives the focus back to the anchor', async () => {
    stubMatchMedia(false);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByText('Open'));
  });

  it('closes on a click outside, without stealing the focus from what was clicked', async () => {
    stubMatchMedia(false);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByText('Other'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByText('Other'));
  });

  it('does not close on a click inside the panel', async () => {
    stubMatchMedia(false);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByText('Last'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('does not call onClose for a click on the anchor (the anchor toggles open itself)', async () => {
    stubMatchMedia(false);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByText('Open')); // anchor's own toggle closes it
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Popover: focus', () => {
  it('moves the focus to the first control inside when it opens', async () => {
    stubMatchMedia(false);
    render(<Harness />);
    await userEvent.click(screen.getByText('Open'));
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('keeps Tab and Shift+Tab inside the panel', async () => {
    stubMatchMedia(false);
    render(<Harness />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('Last'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText('First'));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });
});

describe('Popover: placement', () => {
  function rect(l: number, t: number, w: number, h: number) {
    return { left: l, top: t, width: w, height: h, right: l + w, bottom: t + h, x: l, y: t, toJSON: () => ({}) } as DOMRect;
  }
  function stubRects(anchor: DOMRect, panel: DOMRect) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'dialog' ? panel : anchor;
    });
  }

  it('lines up with the right edge of the anchor and sits below it', async () => {
    stubMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    stubRects(rect(900, 40, 200, 44), rect(0, 0, 400, 300));
    render(<Harness align="end" />);
    await userEvent.click(screen.getByText('Open'));
    const style = screen.getByRole('dialog').style;
    expect(style.left).toBe('700px'); // anchor right (1100) - panel width (400)
    expect(style.top).toBe('92px'); // anchor bottom (84) + 8
  });

  it('stays inside the viewport when the anchor is near the left edge', async () => {
    stubMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    stubRects(rect(20, 40, 100, 44), rect(0, 0, 400, 300));
    render(<Harness align="end" />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog').style.left).toBe('8px'); // would be -280, clamped to the margin
  });

  it('is pulled back from the right edge when its left edge would push it outside', async () => {
    stubMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    stubRects(rect(900, 40, 200, 44), rect(0, 0, 400, 300));
    render(<Harness align="start" />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog').style.left).toBe('792px'); // 1200 - 400 - 8
  });

  it('opens above the anchor when there is no room below', async () => {
    stubMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    stubRects(rect(600, 500, 200, 44), rect(0, 0, 400, 300));
    render(<Harness align="start" />);
    await userEvent.click(screen.getByText('Open'));
    const style = screen.getByRole('dialog').style;
    expect(style.left).toBe('600px'); // `start` = the anchor's left edge
    expect(style.top).toBe('192px'); // anchor top (500) - 8 - panel height (300)
  });
});

describe('Popover: phone (bottom sheet)', () => {
  it('is a modal dialog with a backdrop and locks the page scroll until it closes', async () => {
    stubMatchMedia(true);
    const { container } = render(<Harness />);
    await userEvent.click(screen.getByText('Open'));
    const dialog = screen.getByRole('dialog', { name: 'Pick a range' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.classList.contains('vs-popover--sheet')).toBe(true);
    expect(document.querySelector('.vs-popover-backdrop')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('');
    expect(container.querySelector('.vs-popover-backdrop')).toBeNull();
    expect(document.querySelector('.vs-popover-backdrop')).toBeNull();
  });

  it('closes on a tap on the backdrop', async () => {
    stubMatchMedia(true);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(document.querySelector('.vs-popover-backdrop') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
