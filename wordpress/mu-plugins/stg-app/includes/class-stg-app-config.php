<?php
/**
 * Static configuration for the app: category theming, home sections, contact data.
 * Editors can override the category theme via the `stg_app_category_theme` option
 * (array keyed by category slug with `color`, `emoji`, `icon` keys).
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Config {

	/** Brand colours (mirrored in the app's theme). */
	public const BRAND_PRIMARY = '#99183F';

	/**
	 * Default theme per category slug.
	 * color  = accent colour used for chips/section headers
	 * emoji  = playful marker used in push notifications and empty states
	 * icon   = SF Symbol name (iOS) – the app maps it to Material on Android
	 */
	public const CATEGORY_THEME = [
		'schule'              => [ 'color' => '#99183F', 'emoji' => '🏫', 'icon' => 'building.columns' ],
		'wissen'              => [ 'color' => '#1D5FBF', 'emoji' => '🔬', 'icon' => 'lightbulb' ],
		'kultur'              => [ 'color' => '#7A3EAF', 'emoji' => '🎭', 'icon' => 'theatermasks' ],
		'sport'               => [ 'color' => '#178A4C', 'emoji' => '⚽', 'icon' => 'figure.run' ],
		'meinung'             => [ 'color' => '#E0721A', 'emoji' => '💭', 'icon' => 'bubble.left.and.text.bubble.right' ],
		'interviews'          => [ 'color' => '#0E8A8A', 'emoji' => '🎤', 'icon' => 'mic' ],
		'gaming'              => [ 'color' => '#5B4BDB', 'emoji' => '🎮', 'icon' => 'gamecontroller' ],
		'politik'             => [ 'color' => '#2C3E7A', 'emoji' => '🗳️', 'icon' => 'building.2' ],
		'umwelt'              => [ 'color' => '#4E8F1E', 'emoji' => '🌱', 'icon' => 'leaf' ],
		'kreatives-schreiben' => [ 'color' => '#D4457E', 'emoji' => '✍️', 'icon' => 'pencil.and.scribble' ],
		'kunst'               => [ 'color' => '#C0397A', 'emoji' => '🎨', 'icon' => 'paintpalette' ],
		'social-media'        => [ 'color' => '#E1306C', 'emoji' => '📱', 'icon' => 'iphone' ],
		'damals'              => [ 'color' => '#8A6A3A', 'emoji' => '🕰️', 'icon' => 'clock.arrow.circlepath' ],
		'lehrer'              => [ 'color' => '#4A6B8A', 'emoji' => '🧑‍🏫', 'icon' => 'person.text.rectangle' ],
		'sv'                  => [ 'color' => '#B8322E', 'emoji' => '📣', 'icon' => 'megaphone' ],
		'fahrten'             => [ 'color' => '#0F7FA8', 'emoji' => '🚌', 'icon' => 'bus' ],
		'ausserschulisch'     => [ 'color' => '#D9931B', 'emoji' => '🌍', 'icon' => 'globe.europe.africa' ],
		'projektwoche-2019'   => [ 'color' => '#6C8E1F', 'emoji' => '🛠️', 'icon' => 'hammer' ],
		'unser-redaktionsteam'=> [ 'color' => '#99183F', 'emoji' => '📰', 'icon' => 'person.3' ],
		'eilmeldung'          => [ 'color' => '#D11A2A', 'emoji' => '🚨', 'icon' => 'bolt' ],
		'filme'               => [ 'color' => '#7A3EAF', 'emoji' => '🎬', 'icon' => 'film' ],
		'musik'               => [ 'color' => '#7A3EAF', 'emoji' => '🎵', 'icon' => 'music.note' ],
		'das-jahr-2023'       => [ 'color' => '#8A6A3A', 'emoji' => '📅', 'icon' => 'calendar' ],
		'datenschutz'         => [ 'color' => '#6B7280', 'emoji' => '🔒', 'icon' => 'lock' ],
	];

	/** Fallback palette for categories without an explicit theme (picked by hash). */
	public const FALLBACK_COLORS = [ '#99183F', '#1D5FBF', '#7A3EAF', '#178A4C', '#E0721A', '#0E8A8A', '#5B4BDB', '#D4457E' ];

	/** Category slugs that get a section on the home screen, in order. */
	public const HOME_SECTIONS = [ 'schule', 'wissen', 'kultur', 'sport', 'meinung', 'interviews', 'gaming', 'kreatives-schreiben' ];

	/** Order used to pick a post's "primary" category when it has several. */
	public const PRIMARY_ORDER = [ 'eilmeldung', 'interviews', 'sport', 'gaming', 'kultur', 'filme', 'musik', 'kunst', 'kreatives-schreiben', 'meinung', 'politik', 'umwelt', 'wissen', 'social-media', 'damals', 'lehrer', 'sv', 'fahrten', 'ausserschulisch', 'projektwoche-2019', 'schule', 'das-jahr-2023', 'unser-redaktionsteam', 'datenschutz' ];

	/** Categories that should never trigger a push notification. */
	public const NO_PUSH_CATEGORIES = [ 'datenschutz' ];

	/** Slug of the breaking-news category. */
	public const BREAKING_SLUG = 'eilmeldung';

	public static function category_theme( string $slug, string $name = '' ): array {
		$override = get_option( 'stg_app_category_theme', [] );
		$theme    = self::CATEGORY_THEME[ $slug ] ?? null;
		if ( is_array( $override ) && isset( $override[ $slug ] ) && is_array( $override[ $slug ] ) ) {
			$theme = array_merge( $theme ?? [], $override[ $slug ] );
		}
		if ( ! $theme ) {
			$idx   = crc32( $slug ) % count( self::FALLBACK_COLORS );
			$theme = [ 'color' => self::FALLBACK_COLORS[ $idx ], 'emoji' => '📰', 'icon' => 'newspaper' ];
		}
		return [
			'color' => $theme['color'] ?? self::BRAND_PRIMARY,
			'emoji' => $theme['emoji'] ?? '📰',
			'icon'  => $theme['icon'] ?? 'newspaper',
		];
	}

	public static function app_config(): array {
		return [
			'site'          => [
				'name'        => html_entity_decode( get_bloginfo( 'name' ), ENT_QUOTES, 'UTF-8' ) ?: 'STG Schülerzeitung',
				'tagline'     => 'Schüler texten Gedanken',
				'description' => html_entity_decode( get_bloginfo( 'description' ), ENT_QUOTES, 'UTF-8' ),
				'url'         => home_url( '/' ),
				'school_url'  => 'https://stg-segeberg.de',
				'instagram'   => 'https://www.instagram.com/stg_schuelerzeitung/',
				'contact_email' => get_option( 'admin_email' ),
				'email_domain'  => 'stg-segeberg.de',
				'timezone'    => wp_timezone_string(),
				'language'    => get_locale(),
			],
			'pages'         => [
				'about'   => 'ueber-uns',
				'privacy' => 'datenschutzerklaerung',
			],
			'brand'         => [ 'primary' => self::BRAND_PRIMARY ],
			'home_sections' => self::HOME_SECTIONS,
			'breaking_category' => self::BREAKING_SLUG,
			'comments'      => [
				'enabled'            => 'open' === get_option( 'default_comment_status' ),
				'moderated'          => (bool) get_option( 'comment_moderation' ),
				'email_verification' => class_exists( 'comment_email_verify' ),
				'require_name_email' => (bool) get_option( 'require_name_email' ),
				'threaded'           => (bool) get_option( 'thread_comments' ),
			],
			'push'          => [ 'enabled' => true ],
			'min_app_version' => '2.0.0',
			'api_version'   => STG_APP_VERSION,
		];
	}
}
