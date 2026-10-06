{{--
    VectorSticker Item Card — the listing card for one item (spec v2, docs/components/item-card.html).
    Built to replace resources/views/themes/basic/partials/item.blade.php on vectorsticker.com.

    Presentation only. It does NOT decide what a visitor may do (download, add to cart, own item, external
    seller): the page passes its own forms/links in the `actions` slot, as <x-vs-item-card-action> buttons.
    Every card always gets the view (eye) button. Colours come from --vs-* tokens only (blade/components.css).

    Site contract kept (public/themes/basic/assets/js/app.js):
      - pass the site's own classes in `class`, e.g. class="item" — the grid/list toggle looks for
        `.items .item`, adds/removes `item-inline` on it and `w-100` on its parent, and stores the
        cookie item_view. The card's list layout follows the `item-inline` class, so the toggle keeps working.
      - video/audio previews render the same `.item-video` / `.item-audio-wave` markup the plyr / waveform
        JS looks for (or pass your own markup in the `media` slot).
      - do NOT pass Bootstrap's `border` class: its `!important` border colour would hide the hover border.

    Props:
      title         string   item name (required)
      url           string   item page (title, image and eye button link here) (required)
      external      bool     open links in a new tab with rel="noopener noreferrer nofollow" (external seller)
      previewType   image | video | audio            (default: image)
      image         string|null  preview image; also the video poster
      imageAlt      string|null  default: the title
      previewUrl    string|null  video/audio file for previewType video/audio
      badge         premium | free | sale | trending | null — one badge only; pick it with the site's
                    order Premium > Free > On Sale > Trending
      badgeLabel    string|null  default: translate('Premium') / 'Free' / 'On Sale' / 'Trending'
      category      string|null  category (or sub-category) name; default text translate('Uncategorized')
      categoryUrl   string|null
      showAuthor    bool     show "By author in category" instead of the category only (default: false)
      author        string|null
      authorUrl     string|null
      description   string|null  tags stripped, entities decoded (then escaped on output), cut to 120
                    characters, clamped to 2 lines
      rating        number|null  average stars (shown when not null)
      reviews       int|null     review count, shown as "(12)"
      ratingLabel   string|null  accessible name for the stars (x-vs-rating's default when null)
      free          bool     price shows translate('Free')
      price         string|null  formatted price, e.g. getAmount(...)
      oldPrice      string|null  formatted regular price, shown struck through before the sale price
      stat          string|null  formatted count line, e.g. translate(':count Downloads', [...])
      statType      downloads | sales           (default: downloads) — picks the icon
      showFavorite  bool     heart button (default: false). Behaviour is the page's: hook on
                    .vs-item-card__favorite, or pass your own markup in the `favorite` slot
      favorited     bool     heart filled + aria-pressed="true"
      layout        grid | list   (default: grid). list adds the site's `item-inline` class
      viewLabel, favoriteLabel, oldPriceLabel, playLabel, pauseLabel, muteLabel, fullscreenLabel
                    English defaults; pass translated text. They are not run through translate() here, so
                    rendering the card never adds new keys to the site's translations table.

    Slots:
      media      replaces the built-in image/video/audio preview (the badge still shows)
      actions    the page's download / add-to-cart forms or links (x-vs-item-card-action buttons)
      favorite   replaces the built-in heart button (only when showFavorite)
--}}
@props([
    'title',
    'url',
    'external' => false,
    'previewType' => 'image',
    'image' => null,
    'imageAlt' => null,
    'previewUrl' => null,
    'badge' => null,
    'badgeLabel' => null,
    'category' => null,
    'categoryUrl' => null,
    'showAuthor' => false,
    'author' => null,
    'authorUrl' => null,
    'description' => null,
    'rating' => null,
    'reviews' => null,
    'ratingLabel' => null,
    'free' => false,
    'price' => null,
    'oldPrice' => null,
    'stat' => null,
    'statType' => 'downloads',
    'showFavorite' => false,
    'favorited' => false,
    'layout' => 'grid',
    'viewLabel' => 'View item',
    'favoriteLabel' => 'Add to favorites',
    'oldPriceLabel' => 'Regular price:',
    'playLabel' => 'Play preview',
    'pauseLabel' => 'Pause preview',
    'muteLabel' => 'Mute or unmute',
    'fullscreenLabel' => 'Full screen',
])

@php
    // Only keys the current item partial already uses go through the site's translate(); it is optional so
    // the component also renders outside vectorsticker.com.
    $t = fn (string $key) => function_exists('translate') ? translate($key) : $key;

    $badges = [
        'premium' => ['fa-solid fa-crown', 'Premium'],
        'free' => ['fa-regular fa-heart', 'Free'],
        'sale' => ['fa-solid fa-tag', 'On Sale'],
        'trending' => ['fa-solid fa-bolt', 'Trending'],
    ];
    $badgeInfo = $badges[$badge] ?? null;

    $previewType = in_array($previewType, ['image', 'video', 'audio'], true) ? $previewType : 'image';
    $linkAttrs = $external ? ['target' => '_blank', 'rel' => 'noopener noreferrer nofollow'] : [];
    $hasCategory = filled($category);
    $categoryText = $hasCategory ? $category : $t('Uncategorized');

    // "By :username in :category" — split the translated template on its placeholders and print each
    // text piece escaped, so the author/category links never pass through {!! !!}.
    $metaTokens = ($showAuthor && filled($author))
        ? preg_split('/(:username|:category)/', $t('By :username in :category'), -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY)
        : [':category'];
    $metaParts = array_map(fn ($tok) => match ($tok) {
        ':username' => ['text' => $author, 'url' => filled($authorUrl) ? $authorUrl : null, 'category' => false],
        ':category' => ['text' => $categoryText, 'url' => ($hasCategory && filled($categoryUrl)) ? $categoryUrl : null, 'category' => true],
        default => ['text' => $tok, 'url' => null, 'category' => false],
    }, $metaTokens);

    $desc = filled($description) ? \Illuminate\Support\Str::limit(trim(html_entity_decode(strip_tags((string) $description), ENT_QUOTES | ENT_HTML5, 'UTF-8')), 120) : null;
    $hasStat = filled($stat);
    $hasPrice = $free || filled($price);
@endphp

<div {{ $attributes->class(['vs-item-card', 'item-inline' => $layout === 'list']) }}>
    <div class="vs-item-card__media">
        @if (isset($media) && $media->isNotEmpty())
            {{ $media }}
        @elseif ($previewType === 'video' && filled($previewUrl))
            {{-- Same markup as the site partial: .item-video drives the hover-play / volume / fullscreen JS. --}}
            <a href="{{ $url }}" class="vs-item-card__media-link opacity-100" tabindex="-1" aria-hidden="true" @foreach ($linkAttrs as $k => $v) {{ $k }}="{{ $v }}" @endforeach>
                <div class="item-video">
                    <video class="plyr" @if (filled($image)) poster="{{ $image }}" @endif muted playsinline preload="none">
                        <source src="{{ $previewUrl }}">
                    </video>
                    <div class="item-video-actions d-flex align-items-center justify-content-between gap-1">
                        <div class="item-video-volume item-video-action" title="{{ $muteLabel }}">
                            <i class="fa-solid fa-volume-high"></i>
                            <i class="fa-solid fa-volume-xmark"></i>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <div class="item-video-full item-video-action" title="{{ $fullscreenLabel }}">
                                <i class="fa fa-expand"></i>
                            </div>
                        </div>
                    </div>
                    <div class="item-video-progress"><span></span></div>
                </div>
            </a>
        @elseif ($previewType === 'audio' && filled($previewUrl))
            {{-- Same markup as the site partial: .item-audio-wave drives the WaveSurfer JS. --}}
            <div class="item-audio">
                <a href="{{ $url }}" class="item-audio-link opacity-100" tabindex="-1" aria-hidden="true" @foreach ($linkAttrs as $k => $v) {{ $k }}="{{ $v }}" @endforeach></a>
                <div class="item-audio-wave">
                    <div class="item-audio-actions">
                        <button type="button" class="play-button btn btn-primary btn-sm px-2" aria-label="{{ $playLabel }}">
                            <div class="play-button-icon"><i class="fas fa-play" aria-hidden="true"></i></div>
                        </button>
                        <button type="button" class="pause-button btn btn-primary btn-sm px-2 d-none" aria-label="{{ $pauseLabel }}">
                            <div class="play-button-icon"><i class="fas fa-pause" aria-hidden="true"></i></div>
                        </button>
                    </div>
                    <div class="waveform" data-url="{{ $previewUrl }}" data-waveheight="50"></div>
                    <div class="total-duration">00:00</div>
                </div>
            </div>
        @elseif (filled($image))
            {{-- tabindex -1: the title link right below goes to the same page, so keyboard users get one stop. --}}
            <a href="{{ $url }}" class="vs-item-card__media-link" tabindex="-1" aria-hidden="true" @foreach ($linkAttrs as $k => $v) {{ $k }}="{{ $v }}" @endforeach>
                <img class="vs-item-card__img" src="{{ $image }}" alt="{{ $imageAlt ?? $title }}" loading="lazy" decoding="async" width="1000" height="1000">
            </a>
        @endif

        @if ($badgeInfo)
            <span class="vs-item-card__badge vs-item-card__badge--{{ $badge }}">
                <i class="{{ $badgeInfo[0] }}" aria-hidden="true"></i><span class="vs-item-card__badge-text">{{ $badgeLabel ?? $t($badgeInfo[1]) }}</span>
            </span>
        @endif
    </div>

    <div class="vs-item-card__body">
        <a class="vs-item-card__title" href="{{ $url }}" @foreach ($linkAttrs as $k => $v) {{ $k }}="{{ $v }}" @endforeach>{{ $title }}</a>

        {{-- One line on purpose: no whitespace is added between the pieces of the translated template. --}}
        <p class="vs-item-card__meta">@foreach ($metaParts as $part)<span @class(['vs-item-card__category' => $part['category']])>@if ($part['url'])<a href="{{ $part['url'] }}">{{ $part['text'] }}</a>@else{{ $part['text'] }}@endif</span>@endforeach</p>

        @if ($desc)
            <p class="vs-item-card__desc">{{ $desc }}</p>
        @endif

        @if (! is_null($rating))
            <div class="vs-item-card__rating">
                <x-vs-rating :value="$rating" :label="$ratingLabel" />
                @if (! is_null($reviews))
                    <span class="vs-item-card__reviews">({{ $reviews }})</span>
                @endif
            </div>
        @endif

        <div class="vs-item-card__footer">
            <div class="vs-item-card__purchase">
                @if ($hasPrice)
                    <div class="vs-item-card__price-row">
                        @if ($free)
                            <span class="vs-item-card__price">{{ $t('Free') }}</span>
                        @else
                            @if (filled($oldPrice))
                                <del class="vs-item-card__price-old"><span class="vs-item-card__sr-only">{{ $oldPriceLabel }} </span>{{ $oldPrice }}</del>
                            @endif
                            <span @class(['vs-item-card__price', 'vs-item-card__price--sale' => filled($oldPrice)])>{{ $price }}</span>
                        @endif
                    </div>
                @endif
                @if ($hasStat)
                    <div class="vs-item-card__stat">
                        <i class="{{ $statType === 'sales' ? 'fa-solid fa-cart-shopping' : 'fa-solid fa-download' }}" aria-hidden="true"></i>
                        {{ $stat }}
                    </div>
                @endif
            </div>

            <div class="vs-item-card__actions">
                @if ($showFavorite)
                    @if (isset($favorite) && $favorite->isNotEmpty())
                        {{ $favorite }}
                    @else
                        <x-vs-item-card-action
                            variant="neutral"
                            type="button"
                            :icon="$favorited ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"
                            :label="$favoriteLabel"
                            class="vs-item-card__favorite"
                            aria-pressed="{{ $favorited ? 'true' : 'false' }}"
                        />
                    @endif
                @endif
                {{ $actions ?? '' }}
                <x-vs-item-card-action
                    variant="secondary"
                    icon="fa-regular fa-eye"
                    :label="$viewLabel"
                    :href="$url"
                    :external="$external"
                />
            </div>
        </div>
    </div>
</div>
