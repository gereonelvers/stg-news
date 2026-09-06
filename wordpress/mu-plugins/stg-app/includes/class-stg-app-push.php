<?php
/**
 * Sends Expo push notifications when a post is published.
 *
 * Flow: transition_post_status → schedule single cron event (delay lets editors
 * fix a mistaken publish) → stg_app_send_post_push → Expo Push API in chunks.
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Push {

	private const EXPO_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
	private const CHUNK         = 100;
	private const DELAY         = 90; // seconds

	public static function init(): void {
		add_action( 'transition_post_status', [ self::class, 'on_transition' ], 10, 3 );
		add_action( 'stg_app_send_post_push', [ self::class, 'send_for_post' ], 10, 1 );
	}

	public static function on_transition( string $new, string $old, WP_Post $post ): void {
		if ( 'post' !== $post->post_type || 'publish' !== $new || 'publish' === $old ) {
			return;
		}
		if ( get_post_meta( $post->ID, '_stg_app_pushed', true ) ) {
			return;
		}
		if ( get_post_meta( $post->ID, '_stg_app_no_push', true ) ) {
			return;
		}
		// Clear the cached home feed right away so the app sees the new post.
		delete_transient( 'stg_app_home' );
		if ( ! wp_next_scheduled( 'stg_app_send_post_push', [ $post->ID ] ) ) {
			wp_schedule_single_event( time() + self::DELAY, 'stg_app_send_post_push', [ $post->ID ] );
		}
	}

	/** Build the notification payload for a post. */
	public static function message_for( WP_Post $post ): array {
		$card    = STG_App_Format::post_card( $post );
		$primary = $card['primary_category'];
		$emoji   = $primary['emoji'] ?? '📰';
		$name    = $primary['name'] ?? 'Neuer Artikel';
		$title   = trim( $emoji . ' ' . $name );
		$body    = $card['title'];
		if ( $card['author'] && ! empty( $card['author']['name'] ) ) {
			$body .= ' — von ' . $card['author']['name'];
		}
		return [
			'title'      => $title,
			'body'       => $body,
			'subtitle'   => null,
			'data'       => [ 'type' => 'post', 'postId' => $card['id'], 'url' => $card['link'] ],
			'sound'      => 'default',
			'channelId'  => 'articles',
			'categoryId' => 'article',
			'priority'   => 'high',
			'ttl'        => 60 * 60 * 24 * 2,
			'richContent'=> $card['image'] ? [ 'image' => $card['image']['src'] ] : null,
		];
	}

	/** Cron callback. Returns a summary for logging/CLI. */
	public static function send_for_post( int $post_id, bool $force = false ): array {
		$post = get_post( $post_id );
		if ( ! $post || 'publish' !== $post->post_status || 'post' !== $post->post_type ) {
			return [ 'skipped' => 'not published' ];
		}
		if ( ! $force && get_post_meta( $post_id, '_stg_app_pushed', true ) ) {
			return [ 'skipped' => 'already pushed' ];
		}
		$slugs = wp_list_pluck( get_the_category( $post_id ) ?: [], 'slug' );
		if ( array_intersect( $slugs, STG_App_Config::NO_PUSH_CATEGORIES ) ) {
			update_post_meta( $post_id, '_stg_app_pushed', 'skipped-category' );
			return [ 'skipped' => 'category excluded' ];
		}

		$cat_ids = array_map( 'intval', wp_list_pluck( get_the_category( $post_id ) ?: [], 'term_id' ) );
		$devices = STG_App_Devices::enabled();
		$targets = [];
		foreach ( $devices as $token => $cats ) {
			if ( null === $cats || array_intersect( $cats, $cat_ids ) ) {
				$targets[] = $token;
			}
		}
		update_post_meta( $post_id, '_stg_app_pushed', current_time( 'mysql', true ) );
		$summary = self::send( self::message_for( $post ), $targets );
		update_option( 'stg_app_last_push', [ 'post' => $post_id, 'time' => time(), 'summary' => $summary ], false );
		return $summary;
	}

	/** Send one message to many tokens. */
	public static function send( array $message, array $tokens ): array {
		$summary = [ 'targets' => count( $tokens ), 'sent' => 0, 'errors' => 0, 'disabled' => 0, 'batches' => 0 ];
		if ( ! $tokens ) {
			return $summary;
		}
		$message = array_filter( $message, static fn( $v ) => null !== $v );
		foreach ( array_chunk( $tokens, self::CHUNK ) as $chunk ) {
			$summary['batches']++;
			$payload = array_map( static fn( $t ) => [ 'to' => $t ] + $message, $chunk );
			$res     = wp_remote_post( self::EXPO_ENDPOINT, [
				'timeout' => 20,
				'headers' => [ 'Accept' => 'application/json', 'Content-Type' => 'application/json', 'Accept-Encoding' => 'gzip, deflate' ],
				'body'    => wp_json_encode( $payload ),
			] );
			if ( is_wp_error( $res ) ) {
				$summary['errors'] += count( $chunk );
				$summary['last_error'] = $res->get_error_message();
				continue;
			}
			$body = json_decode( wp_remote_retrieve_body( $res ), true );
			$data = $body['data'] ?? [];
			foreach ( $chunk as $i => $token ) {
				$ticket = $data[ $i ] ?? null;
				if ( $ticket && 'ok' === ( $ticket['status'] ?? '' ) ) {
					$summary['sent']++;
				} else {
					$summary['errors']++;
					$err = $ticket['details']['error'] ?? ( $ticket['message'] ?? 'unknown' );
					if ( 'DeviceNotRegistered' === $err ) {
						STG_App_Devices::disable( $token, $err );
						$summary['disabled']++;
					}
					$summary['last_error'] = is_string( $err ) ? $err : wp_json_encode( $err );
				}
			}
		}
		return $summary;
	}
}
