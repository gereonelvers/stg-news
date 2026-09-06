<?php
/**
 * Plugin Name: STG App API
 * Description: REST API (namespace stg/v1), push notifications and helpers for the STG Schülerzeitung mobile app.
 * Version:     1.0.0
 * Author:      Gereon Elvers
 *
 * Must-use loader: WordPress only auto-loads top-level files in mu-plugins,
 * so this file pulls in the real plugin from the stg-app/ directory.
 */

defined( 'ABSPATH' ) || exit;

define( 'STG_APP_VERSION', '1.0.0' );
define( 'STG_APP_DIR', __DIR__ . '/stg-app/' );

require_once STG_APP_DIR . 'includes/class-stg-app-config.php';
require_once STG_APP_DIR . 'includes/class-stg-app-format.php';
require_once STG_APP_DIR . 'includes/class-stg-app-devices.php';
require_once STG_APP_DIR . 'includes/class-stg-app-push.php';
require_once STG_APP_DIR . 'includes/class-stg-app-api.php';
require_once STG_APP_DIR . 'includes/class-stg-app-links.php';

add_action( 'plugins_loaded', static function () {
	STG_App_Devices::maybe_install();
	STG_App_Push::init();
	STG_App_API::init();
	STG_App_Links::init();
} );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once STG_APP_DIR . 'includes/class-stg-app-cli.php';
}
