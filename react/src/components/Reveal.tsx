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
