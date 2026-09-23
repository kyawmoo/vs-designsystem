import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SwipeCarouselProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  desktopGridClassName?: string;
  dotsClassName?: string;
}

export function SwipeCarousel({
  children,
  className = '',
  itemClassName = 'w-[84%] sm:w-[70%]',
  desktopGridClassName = 'hidden sm:grid sm:grid-cols-2 gap-3',
  dotsClassName = '',
}: SwipeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const childArray = React.Children.toArray(children).filter(Boolean);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    if (width > 0 && childArray.length > 0) {
      // Find which child index is closest to current scrollLeft
      const scrollRatio = scrollLeft / (el.scrollWidth - width || 1);
      const approxIndex = Math.round(scrollRatio * (childArray.length - 1));
      setActiveIndex(Math.max(0, Math.min(childArray.length - 1, approxIndex)));
    }
  }, [childArray.length]);

  const scrollToSlide = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const childrenNodes = el.children;
    if (childrenNodes[index]) {
      (childrenNodes[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Desktop view */}
      {desktopGridClassName && (
        <div className={desktopGridClassName}>
          {children}
        </div>
      )}

      {/* Mobile Swipeable View */}
      <div className={desktopGridClassName ? 'sm:hidden' : 'block'}>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 px-1 pt-1 scroll-smooth"
        >
          {childArray.map((child, i) => (
            <div
              key={i}
              className={`${itemClassName} shrink-0 snap-center first:pl-0.5 last:pr-0.5`}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        {childArray.length > 1 && (
          <div className={`flex justify-center items-center gap-1.5 mt-2.5 mb-1 ${dotsClassName}`}>
            {childArray.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="transition-all duration-200 rounded-full cursor-pointer"
                style={{
                  width: i === activeIndex ? '20px' : '8px',
                  height: '8px',
                  background: i === activeIndex ? 'var(--vs-color-brand-primary)' : '#d1d5db',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
