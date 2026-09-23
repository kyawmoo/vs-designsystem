{{--
    VectorSticker File Upload — wraps .form-control[type="file"]
    (public/themes/basic/assets/css/app.css has a dedicated
    .form-control[type="file"].form-control-md rule for the native
    file-selector button).

    Props: name, accept, multiple (bool), label, disabled, error.
--}}
@props([
    'name',
    'id' => null,
    'accept' => null,
    'multiple' => false,
    'label' => null,
    'disabled' => false,
    'error' => null,
])

@php($fieldId = $id ?? $name)

<div>
    @if ($label)
        <label for="{{ $fieldId }}" class="form-label">{{ $label }}</label>
    @endif
    <input
        type="file"
        name="{{ $name }}{{ $multiple ? '[]' : '' }}"
        id="{{ $fieldId }}"
        @if ($accept) accept="{{ $accept }}" @endif
        @if ($multiple) multiple @endif
        @disabled($disabled)
        {{ $attributes->merge(['class' => 'form-control form-control-md' . ($error ? ' is-invalid' : '')]) }}
    >
    @if ($error)
        <div class="invalid-feedback">{{ $error }}</div>
    @endif
</div>
