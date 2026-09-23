{{--
    VectorSticker Radio — wraps .form-check + .form-check-input
    type="radio" (public/themes/basic/assets/css/app.css). Render
    several with the same `name` and different `value`s to form a group.

    Props: name, value, checked, label, disabled, error.
    Slot: label content (overrides the `label` prop when provided).
--}}
@props([
    'name',
    'id' => null,
    'value',
    'checked' => false,
    'label' => null,
    'disabled' => false,
    'error' => null,
])

@php($fieldId = $id ?? "{$name}-{$value}")

<div class="form-check">
    <input
        type="radio"
        name="{{ $name }}"
        id="{{ $fieldId }}"
        value="{{ $value }}"
        @checked((string) old($name, $checked ? $value : null) === (string) $value)
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
