<?php
/**
 * Serves /.well-known/apple-app-site-association with the JSON content type
 * Apple requires (the host's Nginx would otherwise send application/octet-stream).
 * Android's assetlinks.json is a plain static file in /.well-known/.
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Links {

	public const APPLE_TEAM_ID = 'DAJ8YV54YV';
	public const IOS_BUNDLE_ID = 'net.stg-sz.app';

	public static function init(): void {
		add_action( 'init', [ self::class, 'maybe_serve' ], 0 );
	}

	public static function maybe_serve(): void {
		$path = wp_parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH );
		if ( '/.well-known/apple-app-site-association' !== $path && '/apple-app-site-association' !== $path ) {
			return;
		}
		$body = [
			'applinks' => [
				'details' => [
					[
						'appIDs'     => [ self::APPLE_TEAM_ID . '.' . self::IOS_BUNDLE_ID ],
						'components' => [
							[ '/' => '/posts/*', 'comment' => 'Artikel' ],
							[ '/' => '/category/*', 'comment' => 'Ressorts' ],
							[ '/' => '/author/*', 'comment' => 'Autor:innen' ],
							[ '/' => '/ueber-uns/', 'comment' => 'Über uns' ],
						],
					],
				],
			],
		];
		status_header( 200 );
		nocache_headers();
		header( 'Content-Type: application/json; charset=utf-8' );
		header( 'Cache-Control: public, max-age=3600' );
		echo wp_json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		exit;
	}
}
