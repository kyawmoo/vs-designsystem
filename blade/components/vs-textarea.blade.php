{{--
    VectorSticker Textarea — wraps .form-control / .form-control-{size},
    same styling as vs-input (public/themes/basic/assets/css/app.css
    does not special-case <textarea>).

    Props: name, id, value, label, placeholder, rows (default: 4),
    size (md|lg, default md), required, disabled, error.
--}}
@props([
    'name',
    'id' => null,
    'value' => null,
    'label' => null,
    'placeholder' => null,
    'rows' => 4,
    'size' => 'md',
    'required' => false,
    'disabled' => false,
    'error' => null,
])

@php($fieldId = $id ?? $name)

<div>
    @if ($label)
        <label for="{{ $fieldId }}" class="form-label">{{ $label }}</label>
    @endif
    <textarea
        name="{{ $name }}"
        id="{{ $fieldId }}"
        rows="{{ $rows }}"
        @if ($placeholder) placeholder="{{ $placeholder }}" @endif
        @required($required)
        @disabled($disabled)
        {{ $attributes->merge(['class' => "form-control form-control-{$size}" . ($error ? ' is-invalid' : '')]) }}
    >{{ old($name, $value) }}</textarea>
    @if ($error)
        <div class="invalid-feedback">{{ $error }}</div>
    @endif
</div>
