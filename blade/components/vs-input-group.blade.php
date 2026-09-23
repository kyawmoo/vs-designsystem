{{--
    VectorSticker Input Group — wraps .input-group.custom
    (public/themes/basic/assets/css/app.css: a .form-control with an
    absolutely-positioned button docked inside its right edge — used
    for things like "copy referral link" or a password-visibility
    toggle).

    Props: name, value, placeholder, readonly (bool), onclick (plain
    HTML onclick string — for Alpine/Livewire wiring, edit this file's
    <button> directly with x-on:click / wire:click instead, since those
    aren't plain string attributes).
    Slot: the docked button's content (icon and/or label).
--}}
@props([
    'name' => null,
    'value' => null,
    'placeholder' => null,
    'readonly' => false,
    'onclick' => null,
])

<div {{ $attributes->merge(['class' => 'input-group custom']) }}>
    <input
        type="text"
        @if ($name) name="{{ $name }}" @endif
        value="{{ $value }}"
        @if ($placeholder) placeholder="{{ $placeholder }}" @endif
        @readonly($readonly)
        class="form-control form-control-md"
    >
    <button type="button" @if ($onclick) onclick="{{ $onclick }}" @endif class="btn btn-primary btn-sm">
        {{ $slot }}
    </button>
</div>
