import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ListRowProps {
  title: string;
  /** One line under the title; a long one is cut with an ellipsis. */
  description?: string;
  /** An icon, drawn in a 40px tinted tile. */
  icon?: React.ReactNode;
  /** Shown instead of the icon tile, as it is (e.g. an Avatar). */
  avatar?: React.ReactNode;
  /** A small tag after the title, e.g. "NEW". */
  badge?: string;
  /** A short trailing value before the chevron, e.g. "12". */
  value?: React.ReactNode;
  /** The chevron at the end (a row that opens something). Default true. */
  chevron?: boolean;
  /** Red icon and title, e.g. Sign out. */
  danger?: boolean;
  /** With an address the row is a link; otherwise a button that calls `onClick`. */
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * VectorSticker ListRow (issue #71): one tappable row (icon tile or avatar, title, one-line description, optional badge and value,
 * chevron), at least 60px high. Rows placed one after another get a divider between them. Moved from the reports site's approved
 * stand-in (Master KMO, 2026-11-07; spike #67 decision (b)).
 */
export function ListRow({ title, description, icon, avatar, badge, value, chevron = true, danger = false, href, onClick, className }: ListRowProps) {
  const classes = ['vs-list-row', danger ? 'vs-list-row--danger' : '', className ?? ''].filter(Boolean).join(' ');
  const inner = (
    <>
      {avatar ? (
        <span className="vs-list-row__avatar">{avatar}</span>
      ) : icon ? (
        <span className="vs-list-row__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="vs-list-row__text">
        <span className="vs-list-row__title">
          {title}
          {badge ? <span className="vs-list-row__badge">{badge}</span> : null}
        </span>
        {description ? <span className="vs-list-row__desc">{description}</span> : null}
      </span>
      {value !== undefined && value !== null && value !== '' ? <span className="vs-list-row__value">{value}</span> : null}
      {chevron && <ChevronRight className="vs-list-row__chev" width={18} height={18} aria-hidden="true" />}
    </>
  );
  return href ? (
    <a className={classes} href={href} onClick={onClick}>
      {inner}
    </a>
  ) : (
    <button type="button" className={classes} onClick={onClick}>
      {inner}
    </button>
  );
}
