/*
 * VectorSticker Animated Number (Blade companion script for <x-vs-animated-number>).
 * Counts each [data-vs-animated-number] element up from 0 when it first scrolls into view (at once where
 * IntersectionObserver is missing): ease-out, the time from data-duration. No dependency, no jQuery.
 * The server writes the FINAL figure into the markup, so with JavaScript off, for search engines and for reduced motion
 * (prefers-reduced-motion: reduce: this script then changes nothing) the page shows the final figure. At the end the script
 * puts that server text back, so the last figure is exactly the server's, character for character. While it counts, the
 * figure is written with Intl.NumberFormat(data-locale, decimals), default en-US like the server text.
 * Load it once on the page (defer). New elements added later: call VsAnimatedNumber.init(container).
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VsAnimatedNumber = api;
})(typeof window !== 'undefined' ? window : this, function (win) {
  var SELECTOR = '[data-vs-animated-number]';

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function reduced() {
    return typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function settings(el) {
    var target = Number(el.getAttribute('data-value'));
    var decimals = parseInt(el.getAttribute('data-decimals'), 10);
    var duration = Number(el.getAttribute('data-duration'));
    var locale = el.getAttribute('data-locale') || 'en-US';
    if (!isFinite(target)) return null;
    if (!(decimals >= 0 && decimals <= 6)) decimals = 0;
    if (!isFinite(duration)) duration = 1000;
    var format;
    try {
      var nf = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      format = function (v) { return nf.format(v); };
    } catch (e) {
      format = function (v) { return v.toFixed(decimals); };
    }
    return { target: target, decimals: decimals, duration: duration, format: format };
  }

  function run(el, visual, finalText, s) {
    var scale = Math.pow(10, s.decimals);
    var begin = null;
    function step(now) {
      if (begin === null) begin = now;
      var t = (now - begin) / s.duration;
      if (t >= 1) {
        visual.textContent = finalText; // the server's text, exactly
        return;
      }
      var v = s.target * easeOut(t);
      visual.textContent = s.format(s.decimals > 0 ? Math.round(v * scale) / scale : Math.round(v));
      win.requestAnimationFrame(step);
    }
    win.requestAnimationFrame(step);
  }

  function init(container) {
    var scope = container || win.document;
    if (reduced() || typeof win.requestAnimationFrame !== 'function') return;
    var els = scope.querySelectorAll(SELECTOR);
    var observer = null;
    var pending = [];
    if (typeof win.IntersectionObserver === 'function') {
      observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          var item = pending.filter(function (p) { return p.el === entry.target; })[0];
          if (item) run(item.el, item.visual, item.finalText, item.s);
        });
      });
    }
    Array.prototype.forEach.call(els, function (el) {
      if (el.getAttribute('data-vs-animated-number-started') === '1') return;
      var visual = el.querySelector('[aria-hidden="true"]');
      var s = settings(el);
      if (!visual || !s || s.duration <= 0) return;
      el.setAttribute('data-vs-animated-number-started', '1');
      var finalText = visual.textContent;
      visual.textContent = s.format(0);
      if (observer) {
        pending.push({ el: el, visual: visual, finalText: finalText, s: s });
        observer.observe(el);
      } else {
        run(el, visual, finalText, s);
      }
    });
  }

  if (win.document && typeof win.document.addEventListener === 'function') {
    if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', function () { init(); });
    else init();
  }

  return { init: init };
});
