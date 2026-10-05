<?php
/**
 * Outgoing mail. WordPress on Cloudways has no usable mail transport and the
 * domain's SPF record does not cover the web server, so everything goes through
 * an authenticated SMTP relay (Brevo) instead.
 *
 * Credentials are never committed. Define them in wp-config.php:
 *   define( 'STG_SMTP_HOST', 'smtp-relay.brevo.com' );
 *   define( 'STG_SMTP_PORT', 587 );
 *   define( 'STG_SMTP_USER', '...' );      // Brevo SMTP login
 *   define( 'STG_SMTP_PASS', '...' );      // Brevo SMTP key
 *   define( 'STG_MAIL_FROM', 'mail@stg-sz.net' );
 *
 * Without those constants this class stays out of the way and WordPress keeps
 * its default transport.
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Mail {

	/** Late priority so we win over plugins that also configure PHPMailer (e.g. comment-email-verify). */
	private const PRIORITY = 99;

	public static function init(): void {
		if ( ! self::configured() ) {
			return;
		}
		add_action( 'phpmailer_init', [ self::class, 'configure' ], self::PRIORITY );
		add_filter( 'wp_mail_from', [ self::class, 'from' ], self::PRIORITY );
		add_filter( 'wp_mail_from_name', [ self::class, 'from_name' ], self::PRIORITY );
	}

	public static function configured(): bool {
		return defined( 'STG_SMTP_HOST' ) && defined( 'STG_SMTP_USER' ) && defined( 'STG_SMTP_PASS' );
	}

	/**
	 * @param PHPMailer\PHPMailer\PHPMailer $mailer
	 */
	public static function configure( $mailer ): void {
		$port = defined( 'STG_SMTP_PORT' ) ? (int) STG_SMTP_PORT : 587;

		$mailer->isSMTP();
		$mailer->Host       = STG_SMTP_HOST;
		$mailer->Port       = $port;
		$mailer->SMTPAuth   = true;
		$mailer->Username   = STG_SMTP_USER;
		$mailer->Password   = STG_SMTP_PASS;
		$mailer->SMTPSecure = 465 === $port ? 'ssl' : 'tls';
		$mailer->CharSet    = 'UTF-8';
		$mailer->Timeout    = 20;

		// Brevo only accepts senders on the authenticated domain, whoever queued the mail.
		$from = self::from( '' );
		if ( $from ) {
			$mailer->setFrom( $from, self::from_name( '' ), false );
			$mailer->Sender = $from;
		}
	}

	public static function from( $email ) {
		return defined( 'STG_MAIL_FROM' ) ? STG_MAIL_FROM : $email;
	}

	public static function from_name( $name ) {
		$blogname = wp_specialchars_decode( (string) get_option( 'blogname' ), ENT_QUOTES );
		return $blogname ?: $name;
	}
}
