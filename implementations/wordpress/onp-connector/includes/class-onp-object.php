<?php
/**
 * ONP_Object — WP post -> News Object mapping, signing, and the
 * per-post version chain.
 *
 * Identity (ONP-1001): the Local Identifier is FROZEN at first
 * signing in post meta '_onp_local_id' — preferring the post slug
 * when it satisfies the grammar, falling back to "post-{ID}". A
 * later slug change never changes the OID: identity is immutable,
 * the pretty URL is not.
 *
 * Versions (ONP-0006): every substantive change signs a new Version
 * whose `supersedes` names the previous VID. All Versions are kept
 * in '_onp_versions' (vid => canonical JSON string), the current VID
 * in '_onp_current_vid'. Unpublishing signs a retraction Version
 * (lifecycle_state: retracted) — Tombstone state rides the chain,
 * never an HTTP status (ONP-1006 Section 4.2 rule 6).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Object {

	const META_LOCAL_ID     = '_onp_local_id';
	const META_VERSIONS     = '_onp_versions';
	const META_CURRENT_VID  = '_onp_current_vid';
	const META_CONTENT_HASH = '_onp_content_hash';

	/** Frozen-at-first-sign Local Identifier (ONP-1001 grammar). */
	public static function local_id( WP_Post $post ): string {
		$existing = get_post_meta( $post->ID, self::META_LOCAL_ID, true );
		if ( $existing ) {
			return $existing;
		}
		$candidate = strtolower( $post->post_name );
		if ( ! preg_match( '/^[a-z0-9-]{1,128}$/', $candidate ) ) {
			$candidate = 'post-' . $post->ID;
		}
		// Uniqueness guard: the slug namespace is per-publisher-domain
		// (ONP-1001); if another post already froze this Local
		// Identifier, fall back to the always-unique post ID form.
		$clash = get_posts( array(
			'post_type'      => 'post',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'exclude'        => array( $post->ID ),
			'meta_key'       => self::META_LOCAL_ID,
			'meta_value'     => $candidate,
			'fields'         => 'ids',
		) );
		if ( $clash ) {
			$candidate = 'post-' . $post->ID;
		}
		update_post_meta( $post->ID, self::META_LOCAL_ID, $candidate );
		return $candidate;
	}

	public static function oid( WP_Post $post ): string {
		return 'onp:oid:' . ONP_Keys::domain() . ':' . self::local_id( $post );
	}

	/** ONP-2100: WP post -> Article content region. */
	public static function build_content( WP_Post $post ): array {
		$content = array(
			'headline' => html_entity_decode( get_the_title( $post ), ENT_QUOTES | ENT_HTML5 ),
			'body'     => self::html_to_markdown( apply_filters( 'the_content', $post->post_content ) ),
		);
		if ( $post->post_excerpt !== '' ) {
			$content['dek'] = wp_strip_all_tags( $post->post_excerpt );
		}
		$author = get_the_author_meta( 'display_name', (int) $post->post_author );
		if ( $author ) {
			$content['byline'] = array( $author );
		}
		$categories = get_the_category( $post->ID );
		if ( $categories && ! is_wp_error( $categories ) ) {
			$content['section'] = $categories[0]->name;
		}
		$content['canonical_url'] = get_permalink( $post );
		return $content;
	}

	/**
	 * Sign the post's current state as a new Version. Returns the new
	 * VID, or null when nothing substantive changed (re-saving without
	 * content changes must not grow the chain: signed_at would differ,
	 * so the skip is decided on a content hash, not on the VID).
	 */
	public static function sign_post( WP_Post $post, bool $retracted = false ): ?string {
		$secret = ONP_Keys::secret_key();
		if ( $secret === null ) {
			return null;
		}

		$previous_vid = get_post_meta( $post->ID, self::META_CURRENT_VID, true );

		// Companion linkage (guarded so the Core-only test harness, which
		// does not load these classes, keeps working). Each helper signs
		// its own Objects into the registry and returns OIDs to reference.
		$content = self::build_content( $post );
		$pending = null;
		if ( class_exists( 'ONP_Media' ) ) {
			$media = ONP_Media::refs_for_post( $post );
			if ( $media ) {
				$content['media_refs'] = $media;
			}
		}
		if ( class_exists( 'ONP_Sources' ) ) {
			$sources = ONP_Sources::refs_for_post( $post );
			if ( $sources ) {
				$content['source_refs'] = $sources;
			}
		}
		if ( ! $retracted && class_exists( 'ONP_Corrections' ) ) {
			$pending = ONP_Corrections::pending( $post );
			$corr    = ONP_Corrections::refs( $post );
			if ( $corr ) {
				$content['corrections_ref'] = $corr;
			}
		}

		$unsigned = array(
			'oid'          => self::oid( $post ),
			'publisher'    => array(
				'domain' => ONP_Keys::domain(),
				'key_id' => ONP_Keys::key_id(),
			),
			'signed_at'    => gmdate( 'Y-m-d\TH:i:s\Z' ),
			'content_type' => 'onp:companion:article',
			'content'      => $content,
		);
		if ( $retracted ) {
			$unsigned['lifecycle_state'] = 'retracted';
		}
		if ( $previous_vid ) {
			$unsigned['supersedes'] = $previous_vid;
		}

		// Substantive-change gate: hash everything except signed_at
		// and supersedes.
		$gate = $unsigned;
		unset( $gate['signed_at'], $gate['supersedes'] );
		$content_hash = hash( 'sha256', ONP_JCS::canonicalize( $gate ) );
		if ( $previous_vid && $content_hash === get_post_meta( $post->ID, self::META_CONTENT_HASH, true ) ) {
			return null;
		}

		$vid                   = ONP_Crypto::compute_vid( $unsigned );
		$envelope              = $unsigned;
		$envelope['vid']       = $vid;
		$envelope['signature'] = ONP_Crypto::sign_envelope( $envelope, $secret );

		$versions         = get_post_meta( $post->ID, self::META_VERSIONS, true );
		$versions         = is_array( $versions ) ? $versions : array();
		$versions[ $vid ] = ONP_JCS::canonicalize( $envelope );

		update_post_meta( $post->ID, self::META_VERSIONS, $versions );
		update_post_meta( $post->ID, self::META_CURRENT_VID, $vid );
		update_post_meta( $post->ID, self::META_CONTENT_HASH, $content_hash );

		// Now that the new Version's VID exists, record the editor's
		// correction (corrected_vid -> correcting_vid), if any.
		if ( $pending && class_exists( 'ONP_Corrections' ) ) {
			ONP_Corrections::commit( $post, $pending, (string) $previous_vid, $vid, $secret );
		}
		return $vid;
	}

	/** Canonical JSON of the current Version, or null. */
	public static function current_version_json( WP_Post $post ): ?string {
		$vid      = get_post_meta( $post->ID, self::META_CURRENT_VID, true );
		$versions = get_post_meta( $post->ID, self::META_VERSIONS, true );
		if ( ! $vid || ! is_array( $versions ) || ! isset( $versions[ $vid ] ) ) {
			return null;
		}
		return $versions[ $vid ];
	}

	/** Lookup a post by its frozen Local Identifier. */
	public static function find_by_local_id( string $local_id ): ?WP_Post {
		$ids = get_posts( array(
			'post_type'      => 'post',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'meta_key'       => self::META_LOCAL_ID,
			'meta_value'     => $local_id,
			'fields'         => 'ids',
		) );
		return $ids ? get_post( $ids[0] ) : null;
	}

	/**
	 * Minimal HTML -> Markdown for the Safe Markdown Subset ONP-2100
	 * Section 4.4 requires of `body`. Covers the constructs WordPress
	 * commonly emits (paragraphs, headings, emphasis, links, lists,
	 * blockquotes, code); everything else is stripped to text.
	 * Deliberately lossy rather than clever: a faithful converter is
	 * an ecosystem problem, not a signing-plugin problem.
	 */
	public static function html_to_markdown( string $html ): string {
		$md = $html;
		$md = preg_replace( '/<\s*(script|style)[^>]*>.*?<\s*\/\s*\1\s*>/is', '', $md );
		$md = preg_replace_callback(
			'/<h([1-6])[^>]*>(.*?)<\/h\1>/is',
			static function ( $m ) {
				return "\n" . str_repeat( '#', (int) $m[1] ) . ' ' . trim( wp_strip_all_tags( $m[2] ) ) . "\n";
			},
			$md
		);
		$md = preg_replace( '/<\s*(strong|b)[^>]*>(.*?)<\/\s*\1\s*>/is', '**$2**', $md );
		$md = preg_replace( '/<\s*(em|i)[^>]*>(.*?)<\/\s*\1\s*>/is', '*$2*', $md );
		$md = preg_replace( '/<code[^>]*>(.*?)<\/code>/is', '`$1`', $md );
		$md = preg_replace_callback(
			'/<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is',
			static function ( $m ) {
				return '[' . trim( wp_strip_all_tags( $m[2] ) ) . '](' . $m[1] . ')';
			},
			$md
		);
		$md = preg_replace( '/<li[^>]*>(.*?)<\/li>/is', "\n- $1", $md );
		$md = preg_replace( '/<blockquote[^>]*>(.*?)<\/blockquote>/is', "\n> $1\n", $md );
		$md = preg_replace( '/<br\s*\/?>/i', "\n", $md );
		$md = preg_replace( '/<\/p>/i', "\n\n", $md );
		$md = wp_strip_all_tags( $md );
		$md = html_entity_decode( $md, ENT_QUOTES | ENT_HTML5 );
		$md = preg_replace( "/[ \t]+\n/", "\n", $md );
		$md = preg_replace( "/\n{3,}/", "\n\n", $md );
		return trim( $md );
	}
}
