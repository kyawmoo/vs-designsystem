import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './Button';

afterEach(cleanup);

// The markup of every existing Button combination as it was BEFORE the `accent` emphasis was added (Task 2, 23 Nov 2026).
// Adding a variant must not change any of it.
const BEFORE = {
  btn_primary_sm: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-sm);padding:0 var(--vs-button-pad-x-sm);font-size:var(--vs-button-font-size-sm)\" class=\"vs-btn vs-btn--primary\">Save</button>",
  btn_primary_md: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--primary\">Save</button>",
  btn_primary_lg: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-lg);padding:0 var(--vs-button-pad-x-lg);font-size:var(--vs-button-font-size-lg)\" class=\"vs-btn vs-btn--primary\">Save</button>",
  btn_secondary_sm: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-secondary);border-color:var(--vs-button-secondary);color:#ffffff;border-radius:var(--vs-button-radius);height:var(--vs-button-height-sm);padding:0 var(--vs-button-pad-x-sm);font-size:var(--vs-button-font-size-sm)\" class=\"vs-btn vs-btn--secondary\">Save</button>",
  btn_secondary_md: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-secondary);border-color:var(--vs-button-secondary);color:#ffffff;border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--secondary\">Save</button>",
  btn_secondary_lg: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-secondary);border-color:var(--vs-button-secondary);color:#ffffff;border-radius:var(--vs-button-radius);height:var(--vs-button-height-lg);padding:0 var(--vs-button-pad-x-lg);font-size:var(--vs-button-font-size-lg)\" class=\"vs-btn vs-btn--secondary\">Save</button>",
  btn_tertiary_sm: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-color-surface);border-color:var(--vs-button-tertiary-border);color:var(--vs-button-tertiary-text);border-radius:var(--vs-button-radius-soft);height:var(--vs-button-height-sm);padding:0 var(--vs-button-pad-x-sm);font-size:var(--vs-button-font-size-sm)\" class=\"vs-btn vs-btn--tertiary\">Save</button>",
  btn_tertiary_md: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-color-surface);border-color:var(--vs-button-tertiary-border);color:var(--vs-button-tertiary-text);border-radius:var(--vs-button-radius-soft);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--tertiary\">Save</button>",
  btn_tertiary_lg: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-color-surface);border-color:var(--vs-button-tertiary-border);color:var(--vs-button-tertiary-text);border-radius:var(--vs-button-radius-soft);height:var(--vs-button-height-lg);padding:0 var(--vs-button-pad-x-lg);font-size:var(--vs-button-font-size-lg)\" class=\"vs-btn vs-btn--tertiary\">Save</button>",
  btn_default: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--primary\">Save</button>",
  btn_disabled: "<button type=\"button\" disabled=\"\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:not-allowed;opacity:0.5;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--primary\">Save</button>",
  btn_icon_text: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md)\" class=\"vs-btn vs-btn--primary\"><svg data-i=\"1\"></svg>Save</button>",
  btn_icon_only_primary: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:2px solid var(--vs-color-brand-primary-text);cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:transparent;color:var(--vs-color-brand-primary-text);border-radius:var(--vs-button-radius-icon);width:var(--vs-button-icon-only-md);height:var(--vs-button-icon-only-md);padding:0\" class=\"vs-btn vs-btn--primary vs-btn--icon-only\" aria-label=\"Add\"><svg data-i=\"1\"></svg></button>",
  btn_icon_only_secondary: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid var(--vs-button-secondary);cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:transparent;color:var(--vs-button-secondary);border-radius:var(--vs-button-radius-icon);width:var(--vs-button-icon-only-md);height:var(--vs-button-icon-only-md);padding:0\" class=\"vs-btn vs-btn--secondary vs-btn--icon-only\" aria-label=\"Add\"><svg data-i=\"1\"></svg></button>",
  btn_icon_only_tertiary: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid var(--vs-color-border);cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-color-surface);color:#71717a;border-radius:var(--vs-button-radius-icon);width:var(--vs-button-icon-only-md);height:var(--vs-button-icon-only-md);padding:0\" class=\"vs-btn vs-btn--tertiary vs-btn--icon-only\" aria-label=\"Add\"><svg data-i=\"1\"></svg></button>",
  btn_pass: "<button type=\"button\" style=\"font-family:var(--vs-font-family);font-weight:500;border:1px solid;cursor:pointer;opacity:1;display:inline-flex;align-items:center;justify-content:center;gap:0;box-shadow:var(--vs-shadow-none);line-height:1;box-sizing:border-box;transition:background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;background:var(--vs-button-primary);border-color:var(--vs-button-primary);color:var(--vs-button-primary-text);border-radius:var(--vs-button-radius);height:var(--vs-button-height-md);padding:0 var(--vs-button-pad-x-md);font-size:var(--vs-button-font-size-md);width:120px\" class=\"vs-btn vs-btn--primary x\" data-id=\"a\">Go</button>",
} as const;

const icon = <svg data-i="1" />;

describe('Button: existing output is unchanged', () => {
  it('text buttons: every emphasis x size', () => {
    for (const e of ['primary', 'secondary', 'tertiary'] as const) {
      for (const s of ['sm', 'md', 'lg'] as const) {
        expect(renderToStaticMarkup(<Button emphasis={e} size={s}>Save</Button>), `${e} ${s}`).toBe(BEFORE[`btn_${e}_${s}` as keyof typeof BEFORE]);
      }
    }
  });

  it('defaults, disabled, icon + text, pass-through props', () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).toBe(BEFORE.btn_default);
    expect(renderToStaticMarkup(<Button disabled>Save</Button>)).toBe(BEFORE.btn_disabled);
    expect(renderToStaticMarkup(<Button icon={icon}>Save</Button>)).toBe(BEFORE.btn_icon_text);
    expect(renderToStaticMarkup(<Button className="x" style={{ width: 120 }} data-id="a">Go</Button>)).toBe(BEFORE.btn_pass);
  });

  it('icon-only: every emphasis', () => {
    for (const e of ['primary', 'secondary', 'tertiary'] as const) {
      expect(renderToStaticMarkup(<Button emphasis={e} iconOnly icon={icon} aria-label="Add" />), e).toBe(BEFORE[`btn_icon_only_${e}` as keyof typeof BEFORE]);
    }
  });
});

describe('Button: accent emphasis (lime pill, opt-in)', () => {

  it('is lime with dark text, round, weight 700, all from tokens', () => {
    const html = renderToStaticMarkup(<Button emphasis="accent">Sign Up</Button>);
    expect(html).toContain('class="vs-btn vs-btn--accent"');
    expect(html).toContain('background:var(--vs-button-accent)');
    expect(html).toContain('color:var(--vs-button-accent-text)');
    expect(html).toContain('border-radius:var(--vs-radius-full)');
    expect(html).toContain('font-weight:var(--vs-button-accent-font-weight)');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('keeps the size tokens, so lg is the 48px site button', () => {
    expect(renderToStaticMarkup(<Button emphasis="accent" size="lg">Go</Button>)).toContain('height:var(--vs-button-height-lg)');
  });

  it('icon-only is a filled lime circle (the other icon-only buttons keep their 8px square)', () => {
    const accent = renderToStaticMarkup(<Button emphasis="accent" iconOnly icon={icon} aria-label="Search" />);
    expect(accent).toContain('border-radius:var(--vs-radius-full)');
    expect(accent).toContain('background:var(--vs-button-accent)');
    expect(accent).toContain('vs-btn--icon-only');
    expect(renderToStaticMarkup(<Button emphasis="primary" iconOnly icon={icon} aria-label="Add" />)).toContain('border-radius:var(--vs-button-radius-icon)');
  });

  it('the default emphasis is still primary (nothing becomes lime by accident)', () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).toContain('vs-btn--primary');
    expect(renderToStaticMarkup(<Button>Save</Button>)).not.toContain('accent');
  });

  it('clicks like any button; disabled does not click and keeps the 0.5 opacity', async () => {
    let clicks = 0;
    render(<><Button emphasis="accent" onClick={() => clicks++}>Pay</Button><Button emphasis="accent" disabled onClick={() => clicks++}>Off</Button></>);
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));
    await userEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(clicks).toBe(1);
    const off = screen.getByRole('button', { name: 'Off' }) as HTMLButtonElement;
    expect(off.disabled).toBe(true);
    expect(off.style.opacity).toBe('0.5');
  });
});
