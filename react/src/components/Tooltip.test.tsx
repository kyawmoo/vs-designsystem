import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TOOLTIP_CLOSE_DELAY, TOOLTIP_OPEN_DELAY, Tooltip } from './Tooltip';

// Testing Library only notices fake timers through a `jest` global, so under vitest its internal setTimeout(0) would
// never fire and every user-event call would hang. This tiny shim lets it advance the fake clock.
(globalThis as Record<string, unknown>).jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };

// jsdom has no layout, so give every element a size and the trigger a rectangle.
let anchorRect = { top: 400, left: 480, width: 40, height: 40 };
const rectFor = () => ({ ...anchorRect, right: anchorRect.left + anchorRect.width, bottom: anchorRect.top + anchorRect.height, x: anchorRect.left, y: anchorRect.top, toJSON: () => ({}) });

beforeEach(() => {
  vi.useFakeTimers();
  anchorRect = { top: 400, left: 480, width: 40, height: 40 };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => rectFor() as DOMRect);
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 120 });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 30 });
  window.innerWidth = 1000;
  window.innerHeight = 800;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight');
});

const user = () => userEvent.setup({ delay: null });
const visible = () => document.querySelector<HTMLElement>('.vs-tooltip');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

function Basic(props: Partial<React.ComponentProps<typeof Tooltip>> & { label?: string }) {
  return (
    <div>
      <Tooltip content="Download as PNG" {...props}>
        <button type="button" aria-label={props.label ?? 'Download'}>
          ⬇
        </button>
      </Tooltip>
      <button type="button">Next control</button>
    </div>
  );
}

describe('Tooltip — structure and accessibility', () => {
  it('renders the trigger unchanged and shows nothing until activated', () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(visible()).toBeNull();
  });

  it('describes the trigger with a role="tooltip" element that holds the text (aria-describedby)', () => {
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Download' });
    const description = document.getElementById(trigger.getAttribute('aria-describedby') as string) as HTMLElement;
    expect(description.getAttribute('role')).toBe('tooltip');
    expect(description.textContent).toBe('Download as PNG');
  });

  it('the description is available to screen readers even while the tooltip is not visible', () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Download' }).getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download' }).getAttribute('aria-description')).toBeNull();
  });

  it('never renames the trigger: the accessible name comes from the control itself', () => {
    render(<Basic label="Download PNG" />);
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Download as PNG/ })).toBeNull();
  });

  it('the visible tooltip is hidden from the accessibility tree (no double reading) and cannot take focus', async () => {
    render(<Basic />);
    await user().hover(screen.getByRole('button', { name: 'Download' }));
    advance(TOOLTIP_OPEN_DELAY);
    const bubble = visible() as HTMLElement;
    expect(bubble.getAttribute('aria-hidden')).toBe('true');
    expect(bubble.hasAttribute('tabindex')).toBe(false);
    expect(bubble.querySelector('a, button, input, [tabindex]')).toBeNull();
  });

  it('keeps an existing aria-describedby of the trigger and appends its own', () => {
    render(
      <>
        <p id="help">Existing help</p>
        <Tooltip content="Tip">
          <button type="button" aria-describedby="help">
            Go
          </button>
        </Tooltip>
      </>,
    );
    const ids = (screen.getByRole('button', { name: 'Go' }).getAttribute('aria-describedby') as string).split(' ');
    expect(ids[0]).toBe('help');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[1])?.textContent).toBe('Tip');
  });

  it('gives every tooltip its own id', () => {
    render(
      <>
        <Tooltip content="One"><button type="button">1</button></Tooltip>
        <Tooltip content="Two"><button type="button">2</button></Tooltip>
      </>,
    );
    const ids = screen.getAllByRole('button').map((b) => b.getAttribute('aria-describedby'));
    expect(new Set(ids).size).toBe(2);
  });
});

describe('Tooltip — activation', () => {
  it('hover: appears only after the delay', async () => {
    render(<Basic />);
    await user().hover(screen.getByRole('button', { name: 'Download' }));
    expect(visible()).toBeNull();
    advance(TOOLTIP_OPEN_DELAY - 1);
    expect(visible()).toBeNull();
    advance(1);
    expect(visible()?.textContent).toBe('Download as PNG');
  });

  it('leaving before the delay cancels it', async () => {
    render(<Basic />);
    const u = user();
    await u.hover(screen.getByRole('button', { name: 'Download' }));
    advance(100);
    await u.unhover(screen.getByRole('button', { name: 'Download' }));
    advance(1000);
    expect(visible()).toBeNull();
  });

  it('hover out: closes after the short grace period', async () => {
    render(<Basic />);
    const u = user();
    await u.hover(screen.getByRole('button', { name: 'Download' }));
    advance(TOOLTIP_OPEN_DELAY);
    await u.unhover(screen.getByRole('button', { name: 'Download' }));
    expect(visible()).not.toBeNull();
    advance(TOOLTIP_CLOSE_DELAY);
    expect(visible()).toBeNull();
  });

  it('keyboard focus: appears immediately, focus stays on the trigger', async () => {
    render(<Basic />);
    await user().tab();
    expect(visible()?.textContent).toBe('Download as PNG');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
  });

  it('Tab moves on to the next control, never into the tooltip, and the tooltip closes', async () => {
    render(<Basic />);
    const u = user();
    await u.tab();
    await u.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next control' }));
    expect(visible()).toBeNull();
  });

  it('blur closes it', async () => {
    render(<Basic />);
    await user().tab();
    act(() => (document.activeElement as HTMLElement).blur());
    expect(visible()).toBeNull();
  });
});

describe('Tooltip — dismissal', () => {
  it('Escape closes it and focus stays on the trigger', async () => {
    render(<Basic />);
    const u = user();
    await u.tab();
    expect(visible()).not.toBeNull();
    await u.keyboard('{Escape}');
    expect(visible()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Download' }));
  });

  it('Escape works for a hover-opened tooltip too', async () => {
    render(<Basic />);
    const u = user();
    await u.hover(screen.getByRole('button', { name: 'Download' }));
    advance(TOOLTIP_OPEN_DELAY);
    await u.keyboard('{Escape}');
    expect(visible()).toBeNull();
  });

  it('pressing the control closes it so it never covers the action, and it does not pop back up', async () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Save">
        <button type="button" onClick={onClick}>
          Save
        </button>
      </Tooltip>,
    );
    const u = user();
    const button = screen.getByRole('button', { name: 'Save' });
    await u.hover(button);
    advance(TOOLTIP_OPEN_DELAY);
    expect(visible()).not.toBeNull();
    await u.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(visible()).toBeNull();
    advance(2000);
    expect(visible()).toBeNull();
  });

  it('moving the pointer onto the tooltip keeps it open (hoverable); leaving it closes it', async () => {
    render(<Basic />);
    const u = user();
    const trigger = screen.getByRole('button', { name: 'Download' });
    await u.hover(trigger);
    advance(TOOLTIP_OPEN_DELAY);
    await u.unhover(trigger);
    await u.hover(visible() as HTMLElement); // within the grace period
    advance(1000);
    expect(visible()).not.toBeNull();
    await u.unhover(visible() as HTMLElement);
    advance(TOOLTIP_CLOSE_DELAY);
    expect(visible()).toBeNull();
  });

  it('is removed when the component unmounts, and pending timers do not fire afterwards', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<Basic />);
    await user().hover(screen.getByRole('button', { name: 'Download' }));
    unmount();
    advance(5000);
    expect(visible()).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });
});

describe('Tooltip — only one at a time', () => {
  it('opening a second tooltip closes the first (focus on A, then hover B)', async () => {
    render(
      <>
        <Tooltip content="First tip"><button type="button">A</button></Tooltip>
        <Tooltip content="Second tip"><button type="button">B</button></Tooltip>
      </>,
    );
    const u = user();
    await u.tab();
    expect([...document.querySelectorAll('.vs-tooltip')].map((e) => e.textContent)).toEqual(['First tip']);
    await u.hover(screen.getByRole('button', { name: 'B' }));
    advance(TOOLTIP_OPEN_DELAY);
    expect([...document.querySelectorAll('.vs-tooltip')].map((e) => e.textContent)).toEqual(['Second tip']);
  });

  it('closing the open one lets the next open normally (no stale "current tooltip")', async () => {
    render(
      <>
        <Tooltip content="First tip"><button type="button">A</button></Tooltip>
        <Tooltip content="Second tip"><button type="button">B</button></Tooltip>
      </>,
    );
    const u = user();
    await u.tab();
    await u.keyboard('{Escape}');
    expect(document.querySelectorAll('.vs-tooltip')).toHaveLength(0);
    await u.hover(screen.getByRole('button', { name: 'B' }));
    advance(TOOLTIP_OPEN_DELAY);
    expect([...document.querySelectorAll('.vs-tooltip')].map((e) => e.textContent)).toEqual(['Second tip']);
    await u.keyboard('{Escape}');
    expect(document.querySelectorAll('.vs-tooltip')).toHaveLength(0);
  });
});

describe('Tooltip — touch', () => {
  it('a touch pointer does not open it (the tap must perform the control’s action)', () => {
    render(<Basic />);
    const wrapper = screen.getByRole('button', { name: 'Download' }).parentElement as HTMLElement;
    fireEvent.pointerEnter(wrapper, { pointerType: 'touch' });
    advance(2000);
    expect(visible()).toBeNull();
  });

  it('a tap still triggers the control', async () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Save">
        <button type="button" onClick={onClick}>
          Save
        </button>
      </Tooltip>,
    );
    await user().click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Tooltip — suppression and odd input', () => {
  it('disabled: no tooltip on hover or focus, and no description', async () => {
    render(<Basic disabled />);
    const trigger = screen.getByRole('button', { name: 'Download' });
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    const u = user();
    await u.hover(trigger);
    advance(1000);
    await u.tab();
    expect(visible()).toBeNull();
  });

  it('disabling while open closes it', async () => {
    const { rerender } = render(<Basic />);
    await user().tab();
    expect(visible()).not.toBeNull();
    rerender(<Basic disabled />);
    expect(visible()).toBeNull();
  });

  it('empty or blank content: nothing is shown or described', async () => {
    render(<Basic content="   " />);
    const trigger = screen.getByRole('button', { name: 'Download' });
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    await user().tab();
    expect(visible()).toBeNull();
  });

  it('a child that is not an element is returned as is', () => {
    render(<Tooltip content="x">{'plain text' as unknown as React.ReactElement}</Tooltip>);
    expect(screen.getByText('plain text')).toBeTruthy();
  });

  it('very long unbroken text is rendered whole (CSS wraps it)', async () => {
    const long = 'x'.repeat(500);
    render(<Basic content={long} />);
    await user().tab();
    expect(visible()?.textContent).toBe(long);
  });

  it('plain text only: markup in content is not interpreted', async () => {
    render(<Basic content={'<img src=x onerror=alert(1)>'} />);
    await user().tab();
    expect(visible()?.querySelector('img')).toBeNull();
    expect(visible()?.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('Tooltip — position, flipping and layering', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)('placement %s is used when there is room', async (placement) => {
    render(<Basic placement={placement} />);
    await user().tab();
    expect(visible()?.getAttribute('data-placement')).toBe(placement);
  });

  it('positions with fixed coordinates from the trigger rectangle (top: above, centred)', async () => {
    render(<Basic />);
    await user().tab();
    expect(visible()?.style.top).toBe(`${400 - 30 - 8}px`);
    expect(visible()?.style.left).toBe(`${500 - 60}px`);
  });

  it('flips to the other side near a viewport edge', async () => {
    anchorRect = { top: 4, left: 480, width: 40, height: 40 };
    render(<Basic placement="top" />);
    await user().tab();
    expect(visible()?.getAttribute('data-placement')).toBe('bottom');
  });

  it('slides along the edge instead of leaving the viewport', async () => {
    anchorRect = { top: 400, left: 2, width: 20, height: 20 };
    render(<Basic placement="top" />);
    await user().tab();
    expect(visible()?.style.left).toBe('8px');
  });

  it('follows the trigger when the window is resized or scrolled while open', async () => {
    render(<Basic />);
    await user().tab();
    expect(visible()?.style.top).toBe('362px');
    anchorRect = { ...anchorRect, top: 300 };
    act(() => void window.dispatchEvent(new Event('resize')));
    expect(visible()?.style.top).toBe('262px');
    anchorRect = { ...anchorRect, top: 200 };
    act(() => void document.dispatchEvent(new Event('scroll')));
    act(() => void window.dispatchEvent(new Event('scroll')));
    expect(visible()?.style.top).toBe('162px');
  });

  it('renders in a portal on document.body, so a clipping ancestor cannot cut it off', async () => {
    render(
      <div style={{ overflow: 'hidden', width: 10, height: 10 }}>
        <Basic />
      </div>,
    );
    await user().tab();
    expect(visible()?.parentElement).toBe(document.body);
  });

  it('draws the arrow by default and omits it with arrow={false}', async () => {
    const { unmount } = render(<Basic />);
    await user().tab();
    expect(visible()?.querySelector('.vs-tooltip__arrow')).not.toBeNull();
    unmount();
    render(<Basic arrow={false} />);
    await user().tab();
    expect(visible()?.querySelector('.vs-tooltip__arrow')).toBeNull();
  });

  it('adds a custom class to the surface', async () => {
    render(<Basic className="extra" />);
    await user().tab();
    expect(visible()?.className).toBe('vs-tooltip extra');
  });

  it('does not render any tooltip DOM while closed (no layout impact)', () => {
    render(<Basic />);
    expect(document.querySelector('.vs-tooltip')).toBeNull();
    expect(document.body.querySelectorAll('.vs-tooltip-trigger')).toHaveLength(1);
  });
});
