{{--
    VectorSticker Select — wraps .form-select / .form-select-{size}
    (public/themes/basic/assets/css/app.css).

    Props:
      name         required
      options      array|Collection, ['value' => 'Label', ...]
      selected     current value (string|int|null)
      placeholder  string|null — an empty leading disabled option
      label        string|null
      size         md | lg   (default: md)
      required     bool
      disabled     bool
      error        string|null
--}}
@props([
    'name',
    'id' => null,
    'options' => [],
    'selected' => null,
    'placeholder' => null,
    'label' => null,
    'size' => 'md',
    'required' => false,
    'disabled' => false,
    'error' => null,
])

@php
    $fieldId = $id ?? $name;
    $current = old($name, $selected);
@endphp

<div>
    @if ($label)
        <label for="{{ $fieldId }}" class="form-label">{{ $label }}</label>
    @endif
    <select
        name="{{ $name }}"
        id="{{ $fieldId }}"
        @required($required)
        @disabled($disabled)
        {{ $attributes->merge(['class' => "form-select form-select-{$size}" . ($error ? ' is-invalid' : '')]) }}
    >
        @if ($placeholder)
            <option value="" disabled @selected(is_null($current))>{{ $placeholder }}</option>
        @endif
        @foreach ($options as $optionValue => $optionLabel)
            <option value="{{ $optionValue }}" @selected((string) $current === (string) $optionValue)>
                {{ $optionLabel }}
            </option>
        @endforeach
    </select>
    @if ($error)
        <div class="invalid-feedback">{{ $error }}</div>
    @endif
</div>
