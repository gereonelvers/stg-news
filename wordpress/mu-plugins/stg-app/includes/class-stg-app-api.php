<?php
/**
 * REST controller: /wp-json/stg/v1/…
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_API {

	public const NS = 'stg/v1';

	private const HOME_TTL = 5 * MINUTE_IN_SECONDS;

	public static function init(): void {
		add_action( 'rest_api_init', [ self::class, 'register_routes' ] );
		// Keep the cached home feed fresh.
		foreach ( [ 'save_post_post', 'deleted_post', 'trashed_post', 'edited_category', 'created_category', 'delete_category' ] as $hook ) {
			add_action( $hook, static fn() => delete_transient( 'stg_app_home' ) );
		}
	}

	/* ---------------------------------------------------------------------
	 * Routes
	 * ------------------------------------------------------------------ */

	public static function register_routes(): void {
		$get = static fn( string $route, callable $cb, array $args = [] ) => register_rest_route( self::NS, $route, [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => $cb,
			'permission_callback' => '__return_true',
			'args'                => $args,
		] );

		$get( '/config', [ self::class, 'get_config' ] );
		$get( '/home', [ self::class, 'get_home' ] );
		$get( '/posts', [ self::class, 'get_posts' ], self::list_args() );
		$get( '/posts/(?P<id>\d+)', [ self::class, 'get_post' ] );
		$get( '/posts/(?P<id>\d+)/related', [ self::class, 'get_related' ] );
		$get( '/categories', [ self::class, 'get_categories' ] );
		$get( '/authors', [ self::class, 'get_authors' ] );
		$get( '/authors/(?P<id>\d+)', [ self::class, 'get_author' ] );
		$get( '/pages/(?P<slug>[a-z0-9-]+)', [ self::class, 'get_page' ] );
		$get( '/search', [ self::class, 'get_search' ], [ 'q' => [ 'required' => true, 'type' => 'string' ] ] );
		$get( '/resolve', [ self::class, 'get_resolve' ], [ 'url' => [ 'required' => true, 'type' => 'string' ] ] );

		register_rest_route( self::NS, '/posts/(?P<id>\d+)/view', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ self::class, 'post_view' ],
			'permission_callback' => '__return_true',
		] );

		register_rest_route( self::NS, '/devices', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ self::class, 'register_device' ],
			'permission_callback' => '__return_true',
		] );
		register_rest_route( self::NS, '/devices/(?P<token>[A-Za-z0-9_\[\]-]+)', [
			[
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => [ self::class, 'delete_device' ],
				'permission_callback' => '__return_true',
			],
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ self::class, 'get_device' ],
				'permission_callback' => '__return_true',
			],
		] );
	}

	private static function list_args(): array {
		return [
			'page'     => [ 'type' => 'integer', 'default' => 1, 'minimum' => 1 ],
			'per_page' => [ 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50 ],
			'category' => [ 'type' => 'integer' ],
			'author'   => [ 'type' => 'integer' ],
			'tag'      => [ 'type' => 'integer' ],
			'search'   => [ 'type' => 'string' ],
			'include'  => [ 'type' => 'string' ], // comma separated ids
			'exclude'  => [ 'type' => 'string' ],
			'orderby'  => [ 'type' => 'string', 'default' => 'date', 'enum' => [ 'date', 'views', 'comments', 'modified', 'relevance' ] ],
			'before'   => [ 'type' => 'string' ],
			'after'    => [ 'type' => 'string' ],
		];
	}

	/* ---------------------------------------------------------------------
	 * Handlers
	 * ------------------------------------------------------------------ */

	public static function get_config(): WP_REST_Response {
		return self::respond( STG_App_Config::app_config(), 600 );
	}

	public static function get_home(): WP_REST_Response {
		$cached = get_transient( 'stg_app_home' );
		if ( is_array( $cached ) ) {
			return self::respond( $cached, 120 );
		}

		$used = [];
		$pick = static function ( array $args, int $n ) use ( &$used ): array {
			$q = new WP_Query( array_merge( [
				'post_type'           => 'post',
				'post_status'         => 'publish',
				'posts_per_page'      => $n,
				'post__not_in'        => $used,
				'ignore_sticky_posts' => true,
				'no_found_rows'       => true,
			], $args ) );
			foreach ( $q->posts as $p ) {
				$used[] = $p->ID;
			}
			return array_map( [ STG_App_Format::class, 'post_card' ], $q->posts );
		};

		// Breaking news: a post in the "Eilmeldung" category from the last 3 days.
		$breaking = null;
		$bterm    = get_term_by( 'slug', STG_App_Config::BREAKING_SLUG, 'category' );
		if ( $bterm ) {
			$b = $pick( [ 'cat' => $bterm->term_id, 'date_query' => [ [ 'after' => '3 days ago' ] ] ], 1 );
			$breaking = $b[0] ?? null;
		}

		// Hero: a sticky post (if it is reasonably fresh) or the newest post.
		$hero    = null;
		$sticky  = array_filter( array_map( 'intval', (array) get_option( 'sticky_posts' ) ) );
		if ( $sticky ) {
			$h = $pick( [ 'post__in' => $sticky, 'orderby' => 'date', 'date_query' => [ [ 'after' => '60 days ago' ] ] ], 1 );
			$hero = $h[0] ?? null;
		}
		if ( ! $hero ) {
			$h    = $pick( [], 1 );
			$hero = $h[0] ?? null;
		}

		$latest = $pick( [], 12 );

		$sections = [];
		foreach ( STG_App_Config::HOME_SECTIONS as $slug ) {
			$term = get_term_by( 'slug', $slug, 'category' );
			if ( ! $term || (int) $term->count < 3 ) {
				continue;
			}
			$posts = $pick( [ 'cat' => $term->term_id ], 5 );
			if ( count( $posts ) >= 2 ) {
				$sections[] = [ 'category' => STG_App_Format::category( $term, true ), 'posts' => $posts ];
			}
		}

		$popular_q = new WP_Query( [
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => 6,
			'meta_key'            => '_post_views',
			'orderby'             => 'meta_value_num',
			'order'               => 'DESC',
			'date_query'          => [ [ 'after' => '18 months ago' ] ],
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		] );
		$popular = array_map( [ STG_App_Format::class, 'post_card' ], $popular_q->posts );

		$data = [
			'generated_at' => gmdate( DATE_ATOM ),
			'breaking'     => $breaking,
			'hero'         => $hero,
			'latest'       => $latest,
			'sections'     => $sections,
			'popular'      => $popular,
			'counts'       => [
				'posts'      => (int) wp_count_posts( 'post' )->publish,
				'categories' => (int) wp_count_terms( [ 'taxonomy' => 'category', 'hide_empty' => true ] ),
			],
		];
		set_transient( 'stg_app_home', $data, self::HOME_TTL );
		return self::respond( $data, 120 );
	}

	public static function get_posts( WP_REST_Request $r ): WP_REST_Response {
		$args = [
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => (int) $r['per_page'],
			'paged'               => (int) $r['page'],
			'ignore_sticky_posts' => true,
		];
		if ( $r['category'] ) {
			$args['cat'] = (int) $r['category'];
		}
		if ( $r['author'] ) {
			$args['author'] = (int) $r['author'];
		}
		if ( $r['tag'] ) {
			$args['tag_id'] = (int) $r['tag'];
		}
		if ( $r['search'] ) {
			$args['s'] = sanitize_text_field( $r['search'] );
		}
		if ( $r['include'] ) {
			$ids = array_filter( array_map( 'intval', explode( ',', $r['include'] ) ) );
			if ( $ids ) {
				$args['post__in'] = $ids;
				$args['orderby']  = 'post__in';
			}
		}
		if ( $r['exclude'] ) {
			$args['post__not_in'] = array_filter( array_map( 'intval', explode( ',', $r['exclude'] ) ) );
		}
		if ( $r['before'] || $r['after'] ) {
			$dq = [];
			if ( $r['before'] ) {
				$dq['before'] = sanitize_text_field( $r['before'] );
			}
			if ( $r['after'] ) {
				$dq['after'] = sanitize_text_field( $r['after'] );
			}
			$args['date_query'] = [ $dq ];
		}
		switch ( $r['orderby'] ) {
			case 'views':
				$args['meta_key'] = '_post_views';
				$args['orderby']  = 'meta_value_num';
				$args['order']    = 'DESC';
				break;
			case 'comments':
				$args['orderby'] = 'comment_count';
				break;
			case 'modified':
				$args['orderby'] = 'modified';
				break;
			case 'relevance':
				if ( $r['search'] ) {
					$args['orderby'] = 'relevance';
				}
				break;
		}

		$q = new WP_Query( $args );
		return self::respond( [
			'items'       => array_map( [ STG_App_Format::class, 'post_card' ], $q->posts ),
			'page'        => (int) $r['page'],
			'per_page'    => (int) $r['per_page'],
			'total'       => (int) $q->found_posts,
			'total_pages' => (int) $q->max_num_pages,
		], 60 );
	}

	public static function get_post( WP_REST_Request $r ) {
		$post = get_post( (int) $r['id'] );
		if ( ! $post || 'post' !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'stg_not_found', 'Artikel nicht gefunden.', [ 'status' => 404 ] );
		}
		return self::respond( STG_App_Format::post_full( $post ), 120 );
	}

	public static function get_related( WP_REST_Request $r ) {
		$post = get_post( (int) $r['id'] );
		if ( ! $post ) {
			return new WP_Error( 'stg_not_found', 'Artikel nicht gefunden.', [ 'status' => 404 ] );
		}
		return self::respond( [ 'items' => STG_App_Format::related( $post, 6 ) ], 300 );
	}

	public static function get_categories(): WP_REST_Response {
		$terms = get_terms( [ 'taxonomy' => 'category', 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC' ] );
		$items = [];
		$used  = []; // image ids already shown as another Ressort's cover
		foreach ( $terms as $term ) {
			$cat = STG_App_Format::category( $term, true );
			// Cover image: the newest post in this category whose image no other Ressort uses yet.
			$q = new WP_Query( [ 'cat' => $term->term_id, 'posts_per_page' => 8, 'post_status' => 'publish', 'no_found_rows' => true, 'ignore_sticky_posts' => true ] );
			$cat['cover'] = null;
			$cat['latest'] = null;
			$fallback = null;
			foreach ( $q->posts as $p ) {
				if ( ! $cat['latest'] ) {
					$cat['latest'] = STG_App_Format::iso_date( $p );
				}
				$img = STG_App_Format::post_image( $p );
				if ( ! $img ) {
					continue;
				}
				$key = $img['id'] ?: $img['src'];
				if ( ! isset( $used[ $key ] ) ) {
					$cat['cover'] = $img;
					$used[ $key ] = true;
					break;
				}
				$fallback = $fallback ?? $img;
			}
			if ( ! $cat['cover'] && $fallback ) {
				$cat['cover'] = $fallback;
			}
			$items[] = $cat;
		}
		return self::respond( [ 'items' => $items ], 300 );
	}

	public static function get_authors( WP_REST_Request $r ): WP_REST_Response {
		$users = get_users( [
			'has_published_posts' => [ 'post' ],
			'orderby'             => 'post_count',
			'order'               => 'DESC',
			'number'              => 200,
		] );
		$items = [];
		foreach ( $users as $u ) {
			$a = STG_App_Format::author( $u, true );
			$latest = get_posts( [ 'author' => $u->ID, 'posts_per_page' => 1, 'post_status' => 'publish', 'no_found_rows' => true ] );
			$a['latest'] = $latest ? STG_App_Format::iso_date( $latest[0] ) : null;
			$items[] = $a;
		}
		return self::respond( [ 'items' => $items ], 600 );
	}

	public static function get_author( WP_REST_Request $r ) {
		$u = get_userdata( (int) $r['id'] );
		if ( ! $u || ! count_user_posts( $u->ID, 'post', true ) ) {
			return new WP_Error( 'stg_not_found', 'Autor:in nicht gefunden.', [ 'status' => 404 ] );
		}
		$a = STG_App_Format::author( $u, true );
		$q = new WP_Query( [ 'author' => $u->ID, 'posts_per_page' => 20, 'post_status' => 'publish', 'ignore_sticky_posts' => true ] );
		$a['posts'] = [
			'items'       => array_map( [ STG_App_Format::class, 'post_card' ], $q->posts ),
			'page'        => 1,
			'per_page'    => 20,
			'total'       => (int) $q->found_posts,
			'total_pages' => (int) $q->max_num_pages,
		];
		return self::respond( $a, 300 );
	}

	public static function get_page( WP_REST_Request $r ) {
		$page = get_page_by_path( sanitize_title( $r['slug'] ), OBJECT, 'page' );
		if ( ! $page || 'publish' !== $page->post_status ) {
			return new WP_Error( 'stg_not_found', 'Seite nicht gefunden.', [ 'status' => 404 ] );
		}
		return self::respond( STG_App_Format::page( $page ), 600 );
	}

	public static function get_search( WP_REST_Request $r ): WP_REST_Response {
		$q = sanitize_text_field( $r['q'] );
		if ( mb_strlen( $q ) < 2 ) {
			return self::respond( [ 'query' => $q, 'posts' => [], 'authors' => [], 'categories' => [], 'total' => 0 ], 0 );
		}
		$pq = new WP_Query( [
			'post_type'           => 'post',
			'post_status'         => 'publish',
			's'                   => $q,
			'posts_per_page'      => 20,
			'orderby'             => 'relevance',
			'ignore_sticky_posts' => true,
		] );
		$authors = get_users( [ 'search' => '*' . $q . '*', 'search_columns' => [ 'display_name', 'user_nicename' ], 'has_published_posts' => [ 'post' ], 'number' => 8 ] );
		$cats    = get_terms( [ 'taxonomy' => 'category', 'hide_empty' => true, 'search' => $q, 'number' => 6 ] );
		return self::respond( [
			'query'      => $q,
			'posts'      => array_map( [ STG_App_Format::class, 'post_card' ], $pq->posts ),
			'total'      => (int) $pq->found_posts,
			'authors'    => array_values( array_filter( array_map( static fn( $u ) => STG_App_Format::author( $u, true ), $authors ) ) ),
			'categories' => array_map( static fn( $t ) => STG_App_Format::category( $t, true ), is_array( $cats ) ? $cats : [] ),
		], 60 );
	}

	/** Resolve a website URL (deep link) to an app entity. */
	public static function get_resolve( WP_REST_Request $r ) {
		$url = esc_url_raw( $r['url'] );
		$id  = url_to_postid( $url );
		if ( $id ) {
			$post = get_post( $id );
			if ( $post && 'publish' === $post->post_status ) {
				return self::respond( [ 'type' => $post->post_type, 'id' => $id, 'slug' => $post->post_name ], 3600 );
			}
		}
		$path = trim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
		if ( preg_match( '#^category/([^/]+)#', $path, $m ) ) {
			$t = get_term_by( 'slug', $m[1], 'category' );
			if ( $t ) {
				return self::respond( [ 'type' => 'category', 'id' => (int) $t->term_id, 'slug' => $t->slug ], 3600 );
			}
		}
		if ( preg_match( '#^author/([^/]+)#', $path, $m ) ) {
			$u = get_user_by( 'slug', $m[1] );
			if ( $u ) {
				return self::respond( [ 'type' => 'author', 'id' => (int) $u->ID, 'slug' => $u->user_nicename ], 3600 );
			}
		}
		return new WP_Error( 'stg_not_found', 'Kein passender Inhalt.', [ 'status' => 404 ] );
	}

	public static function post_view( WP_REST_Request $r ) {
		$post = get_post( (int) $r['id'] );
		if ( ! $post || 'publish' !== $post->post_status ) {
			return new WP_Error( 'stg_not_found', 'Artikel nicht gefunden.', [ 'status' => 404 ] );
		}
		// One count per install (or IP) per post per day.
		$install = sanitize_text_field( (string) $r->get_header( 'x-stg-install' ) );
		$who     = $install ?: ( $_SERVER['REMOTE_ADDR'] ?? 'anon' );
		$key     = 'stg_view_' . md5( $post->ID . '|' . $who . '|' . gmdate( 'Y-m-d' ) );
		if ( ! get_transient( $key ) ) {
			set_transient( $key, 1, DAY_IN_SECONDS );
			$views = (int) get_post_meta( $post->ID, '_post_views', true );
			update_post_meta( $post->ID, '_post_views', $views + 1 );
		}
		return self::respond( [ 'id' => $post->ID, 'views' => (int) get_post_meta( $post->ID, '_post_views', true ) ], 0 );
	}

	public static function register_device( WP_REST_Request $r ) {
		$token = (string) $r->get_param( 'token' );
		if ( ! STG_App_Devices::is_valid_token( $token ) ) {
			return new WP_Error( 'stg_bad_token', 'Ungültiger Push-Token.', [ 'status' => 400 ] );
		}
		$ip  = $_SERVER['REMOTE_ADDR'] ?? 'anon';
		$key = 'stg_reg_' . md5( $ip );
		$n   = (int) get_transient( $key );
		if ( $n > 60 ) {
			return new WP_Error( 'stg_rate_limited', 'Zu viele Anfragen.', [ 'status' => 429 ] );
		}
		set_transient( $key, $n + 1, HOUR_IN_SECONDS );

		$cats = $r->get_param( 'categories' );
		$dev  = STG_App_Devices::upsert( [
			'token'       => $token,
			'platform'    => (string) $r->get_param( 'platform' ),
			'app_version' => (string) $r->get_param( 'app_version' ),
			'locale'      => (string) $r->get_param( 'locale' ),
			'categories'  => is_array( $cats ) ? $cats : null,
			'enabled'     => null === $r->get_param( 'enabled' ) ? true : (bool) $r->get_param( 'enabled' ),
		] );
		return self::respond( $dev, 0 );
	}

	public static function get_device( WP_REST_Request $r ) {
		$dev = STG_App_Devices::get( (string) $r['token'] );
		return $dev ? self::respond( $dev, 0 ) : new WP_Error( 'stg_not_found', 'Gerät nicht registriert.', [ 'status' => 404 ] );
	}

	public static function delete_device( WP_REST_Request $r ): WP_REST_Response {
		STG_App_Devices::delete( (string) $r['token'] );
		return self::respond( [ 'deleted' => true ], 0 );
	}

	/* ---------------------------------------------------------------------
	 * Helpers
	 * ------------------------------------------------------------------ */

	private static function respond( $data, int $max_age ): WP_REST_Response {
		$res = new WP_REST_Response( $data );
		$res->header( 'X-STG-App', STG_APP_VERSION );
		if ( $max_age > 0 ) {
			$res->header( 'Cache-Control', 'public, max-age=' . $max_age . ', stale-while-revalidate=' . ( $max_age * 5 ) );
		} else {
			$res->header( 'Cache-Control', 'no-store' );
		}
		return $res;
	}

}
