{{--
    VectorSticker Text Input — wraps .form-control / .form-control-{size}
    (public/themes/basic/assets/css/app.css). Covers any single-line
    HTML input type that shares .form-control styling (text, email,
    password, tel, number, date, url, …) — they're visually identical
    in the real CSS, so one component covers all of them via `type`.

    Props:
      name        required
      type        text | email | password | tel | number | date | url | …  (default: text)
      value       string|null
      label       string|null — renders a .form-label above the input
      placeholder string|null
      size        md | lg                                                  (default: md)
      required    bool                                                     (default: false)
      disabled    bool                                                     (default: false)
      error       string|null — adds .is-invalid + renders the message
                  in .invalid-feedback (Bootstrap's real is-invalid ~
                  invalid-feedback sibling rule shows it automatically)

    Uses old($name, $value) to repopulate on a failed validation
    redirect — standard Laravel form behavior.
--}}
@props([
    'name',
    'id' => null,
    'type' => 'text',
    'value' => null,
    'label' => null,
    'placeholder' => null,
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
    <input
        type="{{ $type }}"
        name="{{ $name }}"
        id="{{ $fieldId }}"
        value="{{ old($name, $value) }}"
        @if ($placeholder) placeholder="{{ $placeholder }}" @endif
        @required($required)
        @disabled($disabled)
        {{ $attributes->merge(['class' => "form-control form-control-{$size}" . ($error ? ' is-invalid' : '')]) }}
    >
    @if ($error)
        <div class="invalid-feedback">{{ $error }}</div>
    @endif
</div>
