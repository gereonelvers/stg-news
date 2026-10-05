<?php
/**
 * Comment policy for the app and the website.
 *
 * - Every new comment starts held, whatever core's discussion settings say.
 *   Editors who may moderate are exempt, so the team can still write directly.
 * - Authors with a school address get a verification mail; following the link
 *   publishes their comment immediately.
 * - Every other address waits for an editor in wp-admin, and deliberately gets
 *   no mail: the public form attracts bots, and mailing made-up addresses would
 *   bounce and spoil the sending reputation of the relay.
 * - App users can delete their own comment. The token for that is handed out
 *   once, in the response to the request that created the comment, and is a
 *   keyed hash of the comment itself, so nothing extra is stored.
 * - Anyone can report a comment; enough reports take it off the site again.
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Comments {

	private const VERIFY_META  = '_stg_verify_token';
	private const SOURCE_META  = '_stg_source';
	private const REPORTS_META = '_stg_reports';

	/** A published comment goes back into moderation once this many installs reported it. */
	private const REPORT_LIMIT = 2;

	public static function init(): void {
		add_filter( 'pre_comment_approved', [ self::class, 'hold_new_comment' ], 99 );
		add_action( 'wp_insert_comment', [ self::class, 'after_insert' ], 10, 2 );
		add_filter( 'notify_moderator', [ self::class, 'notify_moderator' ], 10, 2 );
		add_action( 'template_redirect', [ self::class, 'maybe_verify' ] );
		add_action( 'rest_api_init', [ self::class, 'register_routes' ] );
	}

	/** The one domain that may publish without an editor reading it first. */
	public static function verification_domain(): string {
		return (string) apply_filters( 'stg_app_verification_domain', STG_App_Config::EMAIL_DOMAIN );
	}

	public static function is_verification_domain( string $email ): bool {
		$at = strrpos( $email, '@' );
		return false !== $at && strtolower( substr( $email, $at + 1 ) ) === strtolower( self::verification_domain() );
	}

	/* ------------------------------- gate -------------------------------- */

	/** Nothing publishes itself – not even an author who was approved before. */
	public static function hold_new_comment( $approved ) {
		if ( 'spam' === $approved || 'trash' === $approved ) {
			return $approved; // leave a spam verdict alone
		}
		if ( current_user_can( 'moderate_comments' ) ) {
			return $approved;
		}
		return 0;
	}

	/**
	 * @param int        $id
	 * @param WP_Comment $comment
	 */
	public static function after_insert( $id, $comment ): void {
		$type = (string) $comment->comment_type;
		if ( '' !== $type && 'comment' !== $type ) {
			return; // pingbacks and trackbacks are none of our business
		}
		if ( '' !== self::install_id() ) {
			update_comment_meta( (int) $id, self::SOURCE_META, 'app' );
		}
		if ( '1' === (string) $comment->comment_approved ) {
			return;
		}
		if ( self::is_verification_domain( (string) $comment->comment_author_email ) ) {
			self::send_verification_mail( (int) $id, $comment );
		}
	}

	/** Spare the editors a mail for every bot comment, but never miss an app one. */
	public static function notify_moderator( $notify, $comment_id ) {
		$comment = get_comment( (int) $comment_id );
		if ( ! $comment ) {
			return $notify;
		}
		if ( 'app' === get_comment_meta( (int) $comment_id, self::SOURCE_META, true ) ) {
			return true;
		}
		$has_link = preg_match( '#https?://#i', (string) $comment->comment_content )
			|| '' !== (string) $comment->comment_author_url;
		return $has_link ? false : $notify;
	}

	/* --------------------------- verification ---------------------------- */

	private static function send_verification_mail( int $id, $comment ): void {
		$token = wp_generate_password( 24, false );
		update_comment_meta( $id, self::VERIFY_META, $token );

		$blogname = self::blogname();
		$title    = get_the_title( (int) $comment->comment_post_ID );
		$link     = add_query_arg( [ 'stg_verify' => $id, 'k' => $token ], home_url( '/' ) );

		$body = sprintf(
			"Hallo %s,\n\ndu hast einen Kommentar zu „%s“ geschrieben.\nBestätige hier kurz deine E-Mail-Adresse, dann wird er sofort veröffentlicht:\n\n%s\n\nWarst das nicht du? Dann ignoriere diese Mail einfach – ohne Bestätigung wird nichts veröffentlicht.\n\nViele Grüße\n%s",
			$comment->comment_author ?: 'du',
			$title ?: $blogname,
			$link,
			$blogname
		);

		wp_mail(
			(string) $comment->comment_author_email,
			sprintf( '[%s] Bitte bestätige deinen Kommentar', $blogname ),
			$body
		);
	}

	/** Handles the link from the verification mail. */
	public static function maybe_verify(): void {
		if ( ! isset( $_GET['stg_verify'], $_GET['k'] ) ) {
			return;
		}
		$id      = (int) $_GET['stg_verify'];
		$given   = sanitize_text_field( wp_unslash( (string) $_GET['k'] ) );
		$comment = get_comment( $id );
		$stored  = (string) get_comment_meta( $id, self::VERIFY_META, true );

		if ( ! $comment || '' === $stored || ! hash_equals( $stored, $given ) ) {
			wp_die(
				'Dieser Bestätigungslink gilt nicht mehr. Vielleicht hast du deinen Kommentar schon bestätigt? <a href="' . esc_url( home_url( '/' ) ) . '">Zur Startseite</a>',
				'Kommentar bestätigen',
				[ 'response' => 403 ]
			);
		}

		delete_comment_meta( $id, self::VERIFY_META );
		wp_set_comment_status( $id, 'approve' );

		$link = get_comment_link( $id );
		wp_die(
			'Danke! Dein Kommentar ist jetzt öffentlich. <a href="' . esc_url( $link ) . '">Zum Kommentar</a>',
			'Kommentar veröffentlicht',
			[ 'response' => 200 ]
		);
	}

	/* ------------------------------ routes ------------------------------- */

	public static function register_routes(): void {
		register_rest_route( STG_App_API::NS, '/comments/(?P<id>\d+)', [
			'methods'             => WP_REST_Server::DELETABLE,
			'callback'            => [ self::class, 'delete_comment' ],
			'permission_callback' => '__return_true',
			'args'                => [ 'token' => [ 'required' => true, 'type' => 'string' ] ],
		] );

		register_rest_route( STG_App_API::NS, '/comments/(?P<id>\d+)/report', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ self::class, 'report_comment' ],
			'permission_callback' => '__return_true',
			'args'                => [ 'reason' => [ 'type' => 'string' ] ],
		] );

		// The author learns their delete token exactly once: in the response to
		// the request that created the comment.
		register_rest_field( 'comment', 'stg_delete_token', [
			'get_callback' => static function ( $data, $field, $request ) {
				if ( ! $request instanceof WP_REST_Request || 'POST' !== $request->get_method() ) {
					return null;
				}
				return self::delete_token( (int) ( $data['id'] ?? 0 ) );
			},
			'schema'       => [ 'type' => 'string', 'readonly' => true, 'context' => [ 'view', 'edit' ] ],
		] );
	}

	/** Keyed hash over the comment's own identity – no storage, stable over time. */
	public static function delete_token( int $id ): string {
		$comment = get_comment( $id );
		if ( ! $comment ) {
			return '';
		}
		return hash_hmac(
			'sha256',
			$id . '|' . $comment->comment_author_email . '|' . $comment->comment_date_gmt,
			wp_salt( 'auth' )
		);
	}

	public static function delete_comment( WP_REST_Request $r ) {
		$id      = (int) $r['id'];
		$comment = get_comment( $id );
		if ( ! $comment ) {
			return new WP_Error( 'stg_comment_not_found', 'Kommentar nicht gefunden.', [ 'status' => 404 ] );
		}
		$token = (string) $r->get_param( 'token' );
		if ( '' === $token || ! hash_equals( self::delete_token( $id ), $token ) ) {
			return new WP_Error( 'stg_comment_not_yours', 'Dieser Kommentar gehört nicht zu diesem Gerät.', [ 'status' => 403 ] );
		}
		wp_delete_comment( $id, true );
		return rest_ensure_response( [ 'deleted' => true, 'id' => $id ] );
	}

	public static function report_comment( WP_REST_Request $r ) {
		$id      = (int) $r['id'];
		$comment = get_comment( $id );
		if ( ! $comment ) {
			return new WP_Error( 'stg_comment_not_found', 'Kommentar nicht gefunden.', [ 'status' => 404 ] );
		}

		$who = self::install_id() ?: (string) ( $_SERVER['REMOTE_ADDR'] ?? 'anon' );
		$key = 'stg_report_' . md5( $id . '|' . $who );
		if ( get_transient( $key ) ) {
			return rest_ensure_response( [ 'reported' => true, 'counted' => false ] );
		}
		set_transient( $key, 1, WEEK_IN_SECONDS );

		$count = (int) get_comment_meta( $id, self::REPORTS_META, true ) + 1;
		update_comment_meta( $id, self::REPORTS_META, $count );

		$hidden = false;
		if ( $count >= self::REPORT_LIMIT && '1' === (string) $comment->comment_approved ) {
			wp_set_comment_status( $id, 'hold' );
			$hidden = true;
		}

		self::mail_editors( $comment, sanitize_textarea_field( (string) $r->get_param( 'reason' ) ), $count, $hidden );

		return rest_ensure_response( [ 'reported' => true, 'counted' => true, 'hidden' => $hidden ] );
	}

	/* ------------------------------ helpers ------------------------------ */

	private static function mail_editors( $comment, string $reason, int $count, bool $hidden ): void {
		$blogname = self::blogname();
		$body     = sprintf(
			"Ein Kommentar wurde gemeldet (%d. Meldung%s).\n\nArtikel: %s\nAutor:in: %s <%s>\n\n%s\n\n%sIn der Verwaltung ansehen: %s",
			$count,
			$hidden ? ', der Kommentar ist jetzt nicht mehr öffentlich' : '',
			get_the_title( (int) $comment->comment_post_ID ),
			$comment->comment_author,
			$comment->comment_author_email,
			$comment->comment_content,
			'' !== $reason ? "Begründung: {$reason}\n\n" : '',
			admin_url( 'comment.php?action=editcomment&c=' . (int) $comment->comment_ID )
		);
		wp_mail( (string) get_option( 'admin_email' ), sprintf( '[%s] Kommentar gemeldet', $blogname ), $body );
	}

	private static function install_id(): string {
		$raw = $_SERVER['HTTP_X_STG_INSTALL'] ?? '';
		return '' === $raw ? '' : sanitize_text_field( wp_unslash( (string) $raw ) );
	}

	private static function blogname(): string {
		return wp_specialchars_decode( (string) get_option( 'blogname' ), ENT_QUOTES );
	}
}
