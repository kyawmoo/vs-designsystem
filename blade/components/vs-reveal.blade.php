{{--
    VectorSticker Reveal — page-opening animation (design system ticket #75).

    Wrap the part of the page that should open with the Reveal. It draws the dark curtain (a fixed layer with a
    hole growing from the top-left corner) once per page load. Pages opt in; nothing animates unless this
    component is on the page. The CSS is the `vs-reveal` block of blade/components.css (tokens only); reduced
    motion and JavaScript off are handled there, so no script is needed.

    Props:
      play  bool (default: true) — false renders the slot only: no curtain, and the items inside stay still.
    Slot: the page content, normally containing <x-vs-reveal-item> elements.
--}}
@props([
    'play' => true,
])

@if ($play)
    <div class="vs-reveal-curtain" aria-hidden="true"></div>
@endif
{{ $slot }}
