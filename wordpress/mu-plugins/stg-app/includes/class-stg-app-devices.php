<?php
/**
 * Push-notification device registry (custom table {prefix}stg_devices).
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Devices {

	private const DB_VERSION = '1';

	public static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'stg_devices';
	}

	public static function maybe_install(): void {
		if ( get_option( 'stg_app_db_version' ) === self::DB_VERSION ) {
			return;
		}
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table   = self::table();
		$charset = $wpdb->get_charset_collate();
		dbDelta( "CREATE TABLE {$table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			token varchar(191) NOT NULL,
			platform varchar(16) NOT NULL DEFAULT '',
			app_version varchar(32) NOT NULL DEFAULT '',
			locale varchar(16) NOT NULL DEFAULT '',
			categories text NULL,
			enabled tinyint(1) NOT NULL DEFAULT 1,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			last_error varchar(191) NOT NULL DEFAULT '',
			PRIMARY KEY  (id),
			UNIQUE KEY token (token),
			KEY enabled (enabled)
		) {$charset};" );
		update_option( 'stg_app_db_version', self::DB_VERSION, false );
	}

	public static function is_valid_token( string $token ): bool {
		return (bool) preg_match( '/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/', $token );
	}

	/**
	 * Insert or update a device.
	 *
	 * @param array{token:string,platform?:string,app_version?:string,locale?:string,categories?:array|null,enabled?:bool} $data
	 */
	public static function upsert( array $data ): array {
		global $wpdb;
		$now   = current_time( 'mysql', true );
		$token = $data['token'];
		$cats  = null;
		if ( isset( $data['categories'] ) && is_array( $data['categories'] ) ) {
			$cats = wp_json_encode( array_values( array_unique( array_map( 'intval', $data['categories'] ) ) ) );
		}
		$row = [
			'token'       => $token,
			'platform'    => substr( sanitize_key( $data['platform'] ?? '' ), 0, 16 ),
			'app_version' => substr( sanitize_text_field( $data['app_version'] ?? '' ), 0, 32 ),
			'locale'      => substr( sanitize_text_field( $data['locale'] ?? '' ), 0, 16 ),
			'categories'  => $cats,
			'enabled'     => isset( $data['enabled'] ) ? (int) (bool) $data['enabled'] : 1,
			'updated_at'  => $now,
			'last_error'  => '',
		];
		$existing = self::get( $token );
		if ( $existing ) {
			$wpdb->update( self::table(), $row, [ 'token' => $token ] );
		} else {
			$row['created_at'] = $now;
			$wpdb->insert( self::table(), $row );
		}
		return self::get( $token );
	}

	public static function get( string $token ): ?array {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE token = %s', $token ), ARRAY_A );
		return $row ? self::format( $row ) : null;
	}

	public static function delete( string $token ): bool {
		global $wpdb;
		return (bool) $wpdb->delete( self::table(), [ 'token' => $token ] );
	}

	public static function disable( string $token, string $error = '' ): void {
		global $wpdb;
		$wpdb->update( self::table(), [ 'enabled' => 0, 'last_error' => substr( $error, 0, 191 ), 'updated_at' => current_time( 'mysql', true ) ], [ 'token' => $token ] );
	}

	/** All enabled devices as [token => categories|null]. */
	public static function enabled(): array {
		global $wpdb;
		$rows = $wpdb->get_results( 'SELECT token, categories FROM ' . self::table() . ' WHERE enabled = 1', ARRAY_A ) ?: [];
		$out  = [];
		foreach ( $rows as $r ) {
			$out[ $r['token'] ] = $r['categories'] ? json_decode( $r['categories'], true ) : null;
		}
		return $out;
	}

	public static function count(): array {
		global $wpdb;
		$t = self::table();
		return [
			'total'   => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t}" ),
			'enabled' => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE enabled = 1" ),
			'ios'     => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE enabled = 1 AND platform = 'ios'" ),
			'android' => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE enabled = 1 AND platform = 'android'" ),
		];
	}

	private static function format( array $row ): array {
		return [
			'token'       => $row['token'],
			'platform'    => $row['platform'],
			'app_version' => $row['app_version'],
			'locale'      => $row['locale'],
			'categories'  => $row['categories'] ? json_decode( $row['categories'], true ) : null,
			'enabled'     => (bool) $row['enabled'],
			'updated_at'  => $row['updated_at'],
		];
	}
}
