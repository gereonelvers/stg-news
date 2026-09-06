<?php
/**
 * WP-CLI helpers: wp stg-app <command>
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_CLI {

	/** Show device counts. */
	public function devices(): void {
		WP_CLI::print_value( STG_App_Devices::count(), [ 'format' => 'json' ] );
	}

	/**
	 * Send the "new article" push for a post. Use --force to resend.
	 *
	 * <post_id>
	 * [--force]
	 */
	public function push( array $args, array $assoc ): void {
		$summary = STG_App_Push::send_for_post( (int) $args[0], ! empty( $assoc['force'] ) );
		WP_CLI::print_value( $summary, [ 'format' => 'json' ] );
	}

	/**
	 * Send a test notification to a single token.
	 *
	 * <token>
	 * [--title=<title>]
	 * [--body=<body>]
	 */
	public function test( array $args, array $assoc ): void {
		$summary = STG_App_Push::send( [
			'title' => $assoc['title'] ?? '📰 STG Schülerzeitung',
			'body'  => $assoc['body'] ?? 'Testnachricht vom Server.',
			'data'  => [ 'type' => 'test' ],
			'sound' => 'default',
			'channelId' => 'articles',
		], [ $args[0] ] );
		WP_CLI::print_value( $summary, [ 'format' => 'json' ] );
	}

	/** Clear the cached home feed. */
	public function flush(): void {
		delete_transient( 'stg_app_home' );
		WP_CLI::success( 'Home cache cleared.' );
	}

	/** Preview the push message for a post. */
	public function preview( array $args ): void {
		$post = get_post( (int) $args[0] );
		if ( ! $post ) {
			WP_CLI::error( 'No such post.' );
		}
		WP_CLI::print_value( STG_App_Push::message_for( $post ), [ 'format' => 'json' ] );
	}
}

WP_CLI::add_command( 'stg-app', 'STG_App_CLI' );
