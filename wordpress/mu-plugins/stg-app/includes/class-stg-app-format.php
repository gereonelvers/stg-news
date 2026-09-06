<?php
/**
 * Turns WordPress objects into the lean JSON shapes the app consumes.
 */

defined( 'ABSPATH' ) || exit;

final class STG_App_Format {

	private const IMAGE_SIZES = [ 'thumbnail', 'medium', 'medium_large', 'large', '1536x1536', 'full' ];

	/* ---------------------------------------------------------------------
	 * Text helpers
	 * ------------------------------------------------------------------ */

	public static function plain( string $html ): string {
		$text = wp_strip_all_tags( $html, true );
		$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$text = str_replace( "\xc2\xa0", ' ', $text ); // nbsp
		return trim( preg_replace( '/\s+/u', ' ', $text ) );
	}

	public static function title( WP_Post $post ): string {
		return self::plain( get_the_title( $post ) );
	}

	public static function excerpt( WP_Post $post, int $words = 40 ): string {
		if ( '' !== trim( (string) $post->post_excerpt ) ) {
			$text = self::plain( $post->post_excerpt );
		} else {
			$content = excerpt_remove_blocks( $post->post_content );
			$content = strip_shortcodes( $content );
			$content = preg_replace( '/<!--(.*?)-->/s', '', $content );
			$text    = self::plain( $content );
		}
		$text = wp_trim_words( $text, $words, '…' );
		return $text;
	}

	public static function word_count( WP_Post $post ): int {
		$text = self::plain( strip_shortcodes( $post->post_content ) );
		return max( 0, count( preg_split( '/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY ) ) );
	}

	public static function iso_date( WP_Post $post, string $field = 'date' ): string {
		$dt = get_post_datetime( $post, $field );
		return $dt ? $dt->format( DATE_ATOM ) : '';
	}

	/* ---------------------------------------------------------------------
	 * Images
	 * ------------------------------------------------------------------ */

	public static function image( int $attachment_id ): ?array {
		if ( $attachment_id <= 0 ) {
			return null;
		}
		$full = wp_get_attachment_image_src( $attachment_id, 'full' );
		if ( ! $full ) {
			return null;
		}
		$large = wp_get_attachment_image_src( $attachment_id, 'large' ) ?: $full;
		$sizes = [];
		foreach ( self::IMAGE_SIZES as $size ) {
			$src = wp_get_attachment_image_src( $attachment_id, $size );
			if ( $src ) {
				$sizes[ $size ] = [ 'src' => $src[0], 'width' => (int) $src[1], 'height' => (int) $src[2] ];
			}
		}
		$alt     = trim( (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ) );
		$caption = self::plain( (string) wp_get_attachment_caption( $attachment_id ) );
		return [
			'id'      => $attachment_id,
			'src'     => $large[0],
			'width'   => (int) $large[1],
			'height'  => (int) $large[2],
			'full'    => $full[0],
			'sizes'   => $sizes,
			'alt'     => $alt,
			'caption' => $caption,
		];
	}

	/** Featured image, or the first image inside the content as a fallback. */
	public static function post_image( WP_Post $post ): ?array {
		$thumb = (int) get_post_thumbnail_id( $post );
		if ( $thumb ) {
			$img = self::image( $thumb );
			if ( $img ) {
				return $img;
			}
		}
		if ( preg_match( '/wp-image-(\d+)/', $post->post_content, $m ) ) {
			$img = self::image( (int) $m[1] );
			if ( $img ) {
				return $img;
			}
		}
		if ( preg_match( '/<img[^>]+src="([^"]+)"[^>]*>/i', $post->post_content, $m ) ) {
			$w = preg_match( '/width="(\d+)"/', $m[0], $wm ) ? (int) $wm[1] : 0;
			$h = preg_match( '/height="(\d+)"/', $m[0], $hm ) ? (int) $hm[1] : 0;
			return [ 'id' => 0, 'src' => $m[1], 'width' => $w, 'height' => $h, 'full' => $m[1], 'sizes' => [], 'alt' => '', 'caption' => '' ];
		}
		return null;
	}

	/* ---------------------------------------------------------------------
	 * Taxonomies & users
	 * ------------------------------------------------------------------ */

	public static function category( WP_Term $term, bool $with_meta = false ): array {
		$theme = STG_App_Config::category_theme( $term->slug, $term->name );
		$out   = [
			'id'    => (int) $term->term_id,
			'name'  => self::plain( $term->name ),
			'slug'  => $term->slug,
			'color' => $theme['color'],
			'emoji' => $theme['emoji'],
			'icon'  => $theme['icon'],
		];
		if ( $with_meta ) {
			$out['description'] = self::plain( (string) $term->description );
			$out['count']       = (int) $term->count;
			$out['parent']      = (int) $term->parent;
		}
		return $out;
	}

	public static function primary_category( array $terms ): ?WP_Term {
		if ( ! $terms ) {
			return null;
		}
		$order = array_flip( STG_App_Config::PRIMARY_ORDER );
		usort( $terms, static function ( $a, $b ) use ( $order ) {
			$ra = $order[ $a->slug ] ?? 999;
			$rb = $order[ $b->slug ] ?? 999;
			return $ra <=> $rb ?: strcmp( $a->name, $b->name );
		} );
		return $terms[0];
	}

	public static function author( $user, bool $with_meta = false ): ?array {
		if ( is_int( $user ) ) {
			$user = get_userdata( $user );
		}
		if ( ! $user instanceof WP_User ) {
			return null;
		}
		$out = [
			'id'     => (int) $user->ID,
			'name'   => self::plain( $user->display_name ),
			'slug'   => $user->user_nicename,
			'avatar' => get_avatar_url( $user->ID, [ 'size' => 256, 'default' => '404' ] ) ?: null,
		];
		if ( $with_meta ) {
			$out['bio']        = self::plain( (string) $user->description );
			$out['post_count'] = (int) count_user_posts( $user->ID, 'post', true );
			$out['url']        = get_author_posts_url( $user->ID );
		}
		return $out;
	}

	/* ---------------------------------------------------------------------
	 * Posts
	 * ------------------------------------------------------------------ */

	/** Lean "card" representation used in lists. */
	public static function post_card( WP_Post $post ): array {
		$terms   = get_the_category( $post->ID ) ?: [];
		$primary = self::primary_category( $terms );
		$words   = self::word_count( $post );
		$content = $post->post_content;

		return [
			'id'               => (int) $post->ID,
			'slug'             => $post->post_name,
			'link'             => get_permalink( $post ),
			'title'            => self::title( $post ),
			'excerpt'          => self::excerpt( $post ),
			'date'             => self::iso_date( $post ),
			'modified'         => self::iso_date( $post, 'modified' ),
			'author'           => self::author( (int) $post->post_author ),
			'categories'       => array_values( array_map( [ self::class, 'category' ], $terms ) ),
			'primary_category' => $primary ? self::category( $primary ) : null,
			'image'            => self::post_image( $post ),
			'reading_time'     => max( 1, (int) ceil( $words / 200 ) ),
			'word_count'       => $words,
			'comment_count'    => (int) $post->comment_count,
			'views'            => (int) get_post_meta( $post->ID, '_post_views', true ),
			'sticky'           => is_sticky( $post->ID ),
			'flags'            => [
				'gallery' => str_contains( $content, 'wp:gallery' ) || str_contains( $content, '[gallery' ),
				'video'   => (bool) preg_match( '/wp:video|youtube\.com|youtu\.be|vimeo\.com|wp:embed/i', $content ),
				'audio'   => str_contains( $content, 'wp:audio' ),
			],
		];
	}

	/** Full representation for the article screen. */
	public static function post_full( WP_Post $post ): array {
		$card = self::post_card( $post );

		$GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		setup_postdata( $post );
		$content = apply_filters( 'the_content', $post->post_content );
		$content = str_replace( ']]>', ']]&gt;', $content );
		wp_reset_postdata();

		$card['content']  = self::clean_content( $content );
		$card['tags']     = array_values( array_map( static fn( $t ) => [ 'id' => (int) $t->term_id, 'name' => self::plain( $t->name ), 'slug' => $t->slug ], get_the_tags( $post->ID ) ?: [] ) );
		$card['related']  = self::related( $post );
		$card['comments_open'] = comments_open( $post->ID );
		return $card;
	}

	/** Remove things that only make sense on the website. */
	public static function clean_content( string $html ): string {
		$html = preg_replace( '#<script\b[^>]*>.*?</script>#is', '', $html );
		$html = preg_replace( '#<style\b[^>]*>.*?</style>#is', '', $html );
		$html = preg_replace( '#<noscript\b[^>]*>.*?</noscript>#is', '', $html );
		// Theme / plugin widgets that sometimes get appended to the content.
		$html = preg_replace( '#<div class="(?:sharedaddy|post-hit-counter|jp-relatedposts|wp-block-latest-posts)[^"]*".*?</div>\s*#is', '', $html );
		return trim( $html );
	}

	public static function related( WP_Post $post, int $limit = 4 ): array {
		$terms   = get_the_category( $post->ID ) ?: [];
		$primary = self::primary_category( $terms );
		$args    = [
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => $limit,
			'post__not_in'        => [ $post->ID ],
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		];
		if ( $primary ) {
			$args['cat'] = $primary->term_id;
		}
		$q = new WP_Query( $args );
		return array_map( [ self::class, 'post_card' ], $q->posts );
	}

	public static function page( WP_Post $page ): array {
		$GLOBALS['post'] = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
		setup_postdata( $page );
		$content = apply_filters( 'the_content', $page->post_content );
		wp_reset_postdata();
		return [
			'id'       => (int) $page->ID,
			'slug'     => $page->post_name,
			'title'    => self::title( $page ),
			'link'     => get_permalink( $page ),
			'modified' => self::iso_date( $page, 'modified' ),
			'content'  => self::clean_content( $content ),
			'image'    => self::post_image( $page ),
		];
	}
}
