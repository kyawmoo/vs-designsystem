{{--
    VectorSticker Switch/Toggle — wraps .form-switch .form-check-input
    (public/themes/basic/assets/css/app.css, custom unchecked-focus dot
    icon already defined there).

    Props: name, value (default '1'), checked, label, disabled, error.
    Slot: label content (overrides the `label` prop when provided).
--}}
@props([
    'name',
    'id' => null,
    'value' => '1',
    'checked' => false,
    'label' => null,
    'disabled' => false,
    'error' => null,
])

@php($fieldId = $id ?? $name)

<div class="form-check form-switch">
    <input
        type="checkbox"
        role="switch"
        name="{{ $name }}"
        id="{{ $fieldId }}"
        value="{{ $value }}"
        @checked(old($name, $checked))
        @disabled($disabled)
        {{ $attributes->merge(['class' => 'form-check-input' . ($error ? ' is-invalid' : '')]) }}
    >
    @if ($slot->isNotEmpty() || $label)
        <label class="form-check-label" for="{{ $fieldId }}">{{ $slot->isNotEmpty() ? $slot : $label }}</label>
    @endif
    @if ($error)
        <div class="invalid-feedback">{{ $error }}</div>
    @endif
</div>
