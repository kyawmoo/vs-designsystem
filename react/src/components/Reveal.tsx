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

// Outside a <Reveal> an item still gets its attribute (the CSS then animates it after the curtain delay).
const RevealContext = createContext(true);

/**
 * The page-opening animation: a dark curtain grows from the top-left corner while the items wait, then the side menu
 * slides in and the body fades in or rises. The animation itself is plain CSS (docs: Reveal, rules in styles.css, timing in
 * the --vs-motion-* tokens); this component only adds the curtain and decides whether this opening plays.
 * It renders no wrapper element: the curtain is a fixed layer, so where it sits in the markup does not matter.
 * Use one per page, and put it around the page shell, not around content that is re-rendered later: an item that is
 * inserted again animates again.
 */
export function Reveal({ children, play }: RevealProps) {
  const [shouldPlay] = useState(() => play ?? !alreadyPlayed);
  useEffect(() => {
    alreadyPlayed = true;
  }, []);
  return (
    <RevealContext.Provider value={shouldPlay}>
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
  const play = useContext(RevealContext);
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
  const play = useContext(RevealContext);
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
