/*
 * VectorSticker Rewind Reveal (plain JavaScript, no dependency): the days of a calendar appear one after the other, newest first.
 * Today is step 0, each earlier day one step later, days after today are not animated. The animation is CSS (the vs-rewind block in
 * blade/components.css, timed by --vs-motion-rewind-* tokens); this script only gives each day its step number.
 *
 * Markup: put data-vs-rewind-day="YYYY-MM-DD" on each day cell (the cell itself, not a wrapper), then call
 *   VsRewind.apply(container, todayKey [, { maxSteps: 18 }])
 * once the cells are drawn, and again after the grid is redrawn (a new month) to play it again. apply() sets data-vs-rewind and
 * --vs-rewind-i on the cells that take part and removes them from the others, so calling it twice replays the effect.
 * VsRewind.clear(container) takes the animation off. Reduced motion is handled by the CSS (the animation is off, the cells just show).
 * todayKey is the page's own "today" as 'YYYY-MM-DD'; a value that is not a real day throws RangeError (a guessed today would animate the wrong days).
 * The same rule is written in react/src/components/rewindOrder.ts; both are tested against react/src/fixtures-rewind-order.json.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VsRewind = api;
})(typeof window !== 'undefined' ? window : this, function () {
  var DEFAULT_MAX = 18;
  var HARD_MAX = 60;
  var DAY = /^\d{4}-\d{2}-\d{2}$/;

  function isDay(key) {
    if (typeof key !== 'string' || !DAY.test(key)) return false;
    var p = key.split('-');
    var y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
    var t = new Date(Date.UTC(y, m - 1, d));
    return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  }

  function maxOf(maxSteps) {
    return typeof maxSteps === 'number' && isFinite(maxSteps) && Math.floor(maxSteps) === maxSteps && maxSteps >= 1 ? Math.min(maxSteps, HARD_MAX) : DEFAULT_MAX;
  }

  // { 'YYYY-MM-DD': step } for the days to animate (see the rule above).
  function indexByDay(days, today, maxSteps) {
    if (!isDay(today)) throw new RangeError("VsRewind: today must be a real 'YYYY-MM-DD' day, got " + JSON.stringify(today));
    var max = maxOf(maxSteps);
    var seen = {};
    var unique = [];
    (days || []).forEach(function (d) {
      if (isDay(d) && !seen[d]) { seen[d] = true; unique.push(d); }
    });
    var out = {};
    if (seen[today]) out[today] = 0;
    unique
      .filter(function (d) { return d < today; })
      .sort(function (a, b) { return a < b ? 1 : a > b ? -1 : 0; })
      .forEach(function (d, i) { out[d] = Math.min(i + 1, max); });
    return out;
  }

  function cells(container) {
    return container ? Array.prototype.slice.call(container.querySelectorAll('[data-vs-rewind-day]')) : [];
  }

  function clear(container) {
    cells(container).forEach(function (el) {
      el.removeAttribute('data-vs-rewind');
      el.style.removeProperty('--vs-rewind-i');
    });
  }

  // Gives the cells their steps and starts the animation. Returns how many cells take part.
  function apply(container, today, options) {
    var list = cells(container);
    var steps = indexByDay(list.map(function (el) { return el.getAttribute('data-vs-rewind-day'); }), today, options && options.maxSteps);
    clear(container); // so a second call plays the effect again
    if (container && container.offsetWidth !== undefined) void container.offsetWidth; // restart the animation
    var n = 0;
    list.forEach(function (el) {
      var key = el.getAttribute('data-vs-rewind-day');
      if (Object.prototype.hasOwnProperty.call(steps, key)) {
        el.setAttribute('data-vs-rewind', '');
        el.style.setProperty('--vs-rewind-i', String(steps[key]));
        n++;
      }
    });
    return n;
  }

  return { indexByDay: indexByDay, apply: apply, clear: clear };
});
