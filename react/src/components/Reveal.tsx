import React, { createContext, useContext, useEffect, useState } from 'react';

/** How an item appears: from the left edge (side menu), fading in (page body), or fading in while rising (header, card). */
export type RevealVariant = 'slide-left' | 'fade' | 'rise';

export interface RevealProps {
  children?: React.ReactNode;
  /**
   * Whether this opening plays. Read once, when it mounts. Default: yes for the first <Reveal> of the page load, no for
   * any later one, so signing out and in again does not replay it. Pass true or false to decide yourself.
   */
  play?: boolean;
}

export interface RevealItemProps extends React.HTMLAttributes<HTMLElement> {
  /** The element to render (default 'div'). The item IS this element, not a wrapper around it. */
  as?: React.ElementType;
  /** Default 'fade'. */
  variant?: RevealVariant;
}

// Set when the first <Reveal> has mounted. A later one in the same page load does not play unless it is told to.
let alreadyPlayed = false;

// "Is the opening playing now?" Outside a <Reveal> an item still gets its attribute (the CSS then animates it after the curtain delay).
// Inside one it is true while the opening runs and false after it ended, so an item or title that mounts AFTER the opening (a view
// shown again after another tab, a list re-rendered) is plain and never plays again. Items read it once, when they mount.
const RevealContext = createContext(true);

/** A token in milliseconds. A browser reports it in its own unit ("1.05s" for 1050ms), so the unit is read, not assumed. */
function tokenMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return /ms$/.test(raw) ? n : /s$/.test(raw) ? n * 1000 : n;
}

/**
 * When the opening can be over. `first` is when the curtain has ended and the body starts (the earliest the entrances can be done);
 * `max` is the longest it can run: the curtain, then the longer of an entrance (body delay + enter time) and a 30-letter title, plus a
 * little room. Both are read from the tokens, so a changed token changes them. Reduced motion: over at once (0 and 0).
 */
function openingTiming(): { first: number; max: number } {
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { first: 0, max: 0 };
  const curtain = tokenMs('--vs-motion-duration-curtain', 1050);
  const body = tokenMs('--vs-motion-delay-body', 150);
  const enter = tokenMs('--vs-motion-duration-enter', 700);
  const text = tokenMs('--vs-motion-text-duration', 420) + 30 * tokenMs('--vs-motion-text-stagger', 35);
  return { first: curtain + body, max: curtain + body + Math.max(enter, text) + 200 };
}

/**
 * Whether an entrance or a title letter is still waiting or moving. A finished animation is not counted (the curtain's own finished
 * animation is kept on purpose, to hold its visibility, and is finished). Where the browser cannot list animations the answer is "yes",
 * and the opening ends at its longest time instead.
 */
function entrancesRunning(): boolean {
  if (typeof document.getAnimations !== 'function') return true;
  return document.getAnimations().some((a) => {
    const name = (a as CSSAnimation).animationName;
    return typeof name === 'string' && name.startsWith('vs-reveal') && a.playState !== 'finished';
  });
}

/**
 * The page-opening animation: a dark curtain grows from the top-left corner while the items wait, then the side menu
 * slides in and the body fades in or rises. The animation itself is plain CSS (docs: Reveal, rules in styles.css, timing in
 * the --vs-motion-* tokens); this component adds the curtain, decides whether this opening plays, and knows when it is over.
 * It renders no wrapper element: the curtain is a fixed layer, so where it sits in the markup does not matter.
 * Use one per page, around the page shell. Items and titles inside it that mount after the opening ended render plain, so a view
 * that is shown again later does not replay it and the app needs no guard of its own.
 */
export function Reveal({ children, play }: RevealProps) {
  const [shouldPlay] = useState(() => play ?? !alreadyPlayed);
  const [playing, setPlaying] = useState(shouldPlay);
  useEffect(() => {
    alreadyPlayed = true;
  }, []);
  useEffect(() => {
    if (!shouldPlay) return;
    // The opening is over when its entrances and title letters have finished, checked every 100ms from the end of the curtain, and at the
    // latest after its longest time. A short title therefore ends it sooner than the 30-letter worst case, so a view shown again soon after
    // does not replay it.
    const { first, max } = openingTiming();
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      if (Date.now() - startedAt >= max || !entrancesRunning()) setPlaying(false);
      else timer = setTimeout(check, 100);
    };
    timer = setTimeout(check, first);
    return () => clearTimeout(timer);
  }, [shouldPlay]);
  return (
    <RevealContext.Provider value={playing}>
      {shouldPlay && <div className="vs-reveal-curtain" aria-hidden="true" />}
      {children}
    </RevealContext.Provider>
  );
}

/**
 * One element that takes part in the opening: it carries data-vs-reveal, which the CSS animates. It is the element
 * itself (use `as` for aside, main, header, ...), so sticky and flex layouts keep working. To animate a component of
 * your own, pass it as `as`; it must put the extra props (data-vs-reveal, className) on its root element.
 * An item inside another item does not animate by itself (the CSS ignores it).
 */
export function RevealItem({ as: Tag = 'div', variant = 'fade', ...rest }: RevealItemProps) {
  const [play] = useState(useContext(RevealContext)); // read once: an item that mounts after the opening is plain
  return <Tag {...rest} data-vs-reveal={play ? variant : undefined} />;
}

export interface RevealTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The title. It is split into letters only while the opening plays; otherwise it is rendered as plain text. */
  text: string;
  /** The element to render (default 'span'; use 'h1' for a page title). The title IS this element, not a wrapper. */
  as?: React.ElementType;
}

/**
 * Scripts whose letters can safely be split into inline-block spans: alphabets that use spaces and do not join or reorder
 * (Latin, Greek, Cyrillic, Armenian, Georgian, Hangul), plus Common (digits, punctuation, spaces, emoji) and Inherited (combining
 * marks, joiners, variation selectors). Anything else (Arabic, Hebrew, Burmese, Thai, Indic, Han, Kana, Mongolian, ...) would lose
 * its joining, shaping or ordering, or could not wrap, so the text is kept as it is. Measured: Arabic grows by 41% and loses its
 * joins when split. The same rule is in blade/components/vs-reveal-text.blade.php (check-tokens keeps the two in step).
 */
const SPLITTABLE = /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Armenian}\p{Script=Georgian}\p{Script=Hangul}\p{Script=Common}\p{Script=Inherited}]*$/u;

/** Whether `text` may be written letter by letter (see SPLITTABLE). */
export function canSplitIntoLetters(text: string): boolean {
  return SPLITTABLE.test(text);
}

/** Letters after this one start together with it, so a long title never waits for seconds. */
const REVEAL_TEXT_MAX_INDEX = 30;

/** The visible letters (grapheme clusters, so a letter with combining marks, as in Burmese, is never cut in two). */
function splitGraphemes(word: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(word), (x) => x.segment);
  return Array.from(word);
}

/**
 * A title that appears letter by letter from the left after the curtain, each letter rising from below its line and
 * coming into focus (docs: Reveal). The animation is plain CSS (data-vs-reveal-text, timing from the --vs-motion-text-*
 * tokens). Put it inside the page body: it starts together with the body fade. Only while the opening plays (inside a
 * playing <Reveal>); with play off or on a later mount it renders the plain text and no extra elements.
 * Screen readers get the real text once: a visually hidden copy; the letters are aria-hidden.
 * Only for scripts that can be split safely (canSplitIntoLetters); any other text is rendered as plain text.
 */
export function RevealText({ text, as: Tag = 'span', ...rest }: RevealTextProps) {
  const [play] = useState(useContext(RevealContext)); // read once: a title that mounts after the opening is plain text
  if (!play || !canSplitIntoLetters(text)) return <Tag {...rest}>{text}</Tag>;
  let index = 0;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag {...rest} data-vs-reveal-text="">
      <span className="vs-reveal-text__sr">{text}</span>
      <span className="vs-reveal-text__visual" aria-hidden="true">
        {words.map((word, w) => (
          <React.Fragment key={w}>
            {w > 0 && ' '}
            <span className="vs-reveal-text__word">
              {splitGraphemes(word).map((letter, l) => {
                const i = Math.min(index++, REVEAL_TEXT_MAX_INDEX);
                return (
                  <span key={l} className="vs-reveal-text__letter" style={{ '--i': i } as React.CSSProperties}>
                    {letter}
                  </span>
                );
              })}
            </span>
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
