<?php
/**
 * ONP_Endpoints — the server side of ONP-0004 Section 4.2 and
 * ONP-1006: /.well-known/onp/publisher.json, Object URLs, and
 * Version URLs, with the VID as ETag and If-None-Match/304 handling.
 *
 * Routing hooks 'init' and inspects REQUEST_URI directly rather than
 * registering rewrite rules: .well-known paths are frequently
 * special-cased by server configs, and this approach needs no
 * permalink flush and cannot be shadowed by other rules. If the web
 * server serves /.well-known statically (some ACME setups), add a
 * pass-through so unmatched .well-known/onp/* paths reach PHP — see
 * the plugin README for the nginx/Apache snippets.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Endpoints {

	public static function register(): void {
		add_action( 'init', array( self::class, 'route' ), 0 );
	}

	public static function route(): void {
		$path = wp_parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH );
		if ( ! is_string( $path ) || strpos( $path, '/.well-known/onp/' ) !== 0 ) {
			return;
		}
		$rest = substr( $path, strlen( '/.well-known/onp/' ) );

		if ( $rest === 'publisher.json' ) {
			// The Key Record can change (rotation) at any time; forbid
			// stale copies from CDNs/edge caches sitting in front of PHP.
			header( 'Cache-Control: no-cache, must-revalidate' );
			self::serve_json( ONP_JCS::canonicalize( ONP_Keys::publisher_key_record() ), 'application/json' );
		}

		// ONP-1006 Section 4.3: /objects/{local-id}/versions/{vid}
		if ( preg_match( '#^objects/([a-z0-9-]{1,128})/versions/(onp:vid:[a-z0-9-]{1,32}:[A-Za-z0-9_-]+)$#', $rest, $m ) ) {
			self::serve_version( $m[1], $m[2] );
		}

		// Not part of ONP-1006: a discovery convenience so the full
		// supersedes chain can be browsed without already knowing every
		// VID. Lists what this Node holds; a Node holding fewer Versions
		// than another is not a statement about any Version's validity
		// (same "404 proves nothing" principle as ONP-1006 Section 4.2
		// rule 6, applied to a list instead of a single Object).
		if ( preg_match( '#^objects/([a-z0-9-]{1,128})/versions$#', $rest, $m ) ) {
			self::serve_version_list( $m[1] );
		}

		// ONP-1006 Section 4.1: /objects/{local-id}
		if ( preg_match( '#^objects/([a-z0-9-]{1,128})$#', $rest, $m ) ) {
			self::serve_current( $m[1] );
		}

		self::not_found();
	}

	private static function serve_current( string $local_id ): void {
		$post = ONP_Object::find_by_local_id( $local_id );
		$json = $post ? ONP_Object::current_version_json( $post ) : null;
		// Companions (media, rights, payment, sources, documents,
		// corrections) live in the registry, not on a post.
		if ( $json === null && class_exists( 'ONP_Registry' ) ) {
			$json = ONP_Registry::current_json( $local_id );
		}
		if ( $json === null ) {
			self::not_found();
		}

		$envelope = json_decode( $json, true );
		$vid      = $envelope['vid'] ?? '';

		// ONP-1006 Section 4.2 rules 3-4: VID as ETag, honor
		// If-None-Match with 304. The pointer itself changes on every
		// re-sign, so a CDN/edge cache in front of PHP must always
		// revalidate rather than serve a stale VID.
		$etag = '"' . $vid . '"';
		header( 'Cache-Control: no-cache, must-revalidate' );
		header( 'ETag: ' . $etag );
		// wp_magic_quotes() addslashes()-escapes $_SERVER; unslash before
		// comparing, or a quoted ETag never matches (found via a real
		// local WordPress run, not by inspection).
		$inm = trim( wp_unslash( $_SERVER['HTTP_IF_NONE_MATCH'] ?? '' ) );
		if ( $inm !== '' && ( $inm === $etag || $inm === 'W/' . $etag || $inm === '*' ) ) {
			status_header( 304 );
			exit;
		}
		self::serve_json( $json );
	}

	/**
	 * The full supersedes chain, oldest first: [{vid, signed_at,
	 * lifecycle_state?}, ...]. Read-only — never signs, never mutates.
	 * lifecycle_state is omitted when a Version is neither retracted
	 * nor otherwise marked, matching how the envelope itself carries it.
	 */
	private static function serve_version_list( string $local_id ): void {
		$versions = null;
		$post     = ONP_Object::find_by_local_id( $local_id );
		if ( $post ) {
			$raw      = get_post_meta( $post->ID, ONP_Object::META_VERSIONS, true );
			$versions = is_array( $raw ) ? $raw : array();
		}
		if ( $versions === null && class_exists( 'ONP_Registry' ) ) {
			$versions = ONP_Registry::all_versions( $local_id );
		}
		if ( $versions === null ) {
			self::not_found();
		}

		$list = array();
		foreach ( $versions as $vid => $json ) {
			$envelope = json_decode( (string) $json, true );
			if ( ! is_array( $envelope ) ) {
				continue;
			}
			$entry = array(
				'vid'       => $vid,
				'signed_at' => $envelope['signed_at'] ?? null,
			);
			if ( isset( $envelope['lifecycle_state'] ) ) {
				$entry['lifecycle_state'] = $envelope['lifecycle_state'];
			}
			$list[] = $entry;
		}
		usort( $list, static function ( $a, $b ) {
			return strcmp( (string) $a['signed_at'], (string) $b['signed_at'] );
		} );

		// The list itself grows on every re-sign; forbid stale copies,
		// same reasoning as the current-version pointer above.
		header( 'Cache-Control: no-cache, must-revalidate' );
		self::serve_json( wp_json_encode( $list ), 'application/json' );
	}

	private static function serve_version( string $local_id, string $vid ): void {
		$json = null;
		$post = $local_id !== '' ? ONP_Object::find_by_local_id( $local_id ) : null;
		if ( $post ) {
			$versions = get_post_meta( $post->ID, ONP_Object::META_VERSIONS, true );
			if ( is_array( $versions ) && isset( $versions[ $vid ] ) ) {
				$json = $versions[ $vid ];
			}
		}
		if ( $json === null && class_exists( 'ONP_Registry' ) ) {
			$json = ONP_Registry::version_json( $local_id, $vid );
		}
		if ( $json === null ) {
			self::not_found();
		}
		// A Version is immutable; a long-lived cache is safe — the VID
		// in the URL is recomputable from the bytes by any consumer
		// (ONP-1006 Section 4.3 rule 2).
		header( 'Cache-Control: public, max-age=31536000, immutable' );
		header( 'ETag: "' . $vid . '"' );
		self::serve_json( $json );
	}

	private static function serve_json( string $body, string $content_type = 'application/onp+json' ): void {
		status_header( 200 );
		header( 'Content-Type: ' . $content_type . '; charset=utf-8' );
		header( 'Access-Control-Allow-Origin: *' );
		header( 'X-Robots-Tag: noindex' );
		echo $body; // phpcs:ignore WordPress.Security.EscapeOutput -- canonical signed JSON bytes.
		exit;
	}

	/**
	 * ONP-1006 Section 4.2 rule 6: 404 means only "not retrievable
	 * here" — never a statement about validity or retraction.
	 */
	private static function not_found(): void {
		status_header( 404 );
		header( 'Content-Type: application/json; charset=utf-8' );
		echo '{"error":"not-retrievable","note":"ONP-1006 Section 4.2 rule 6: this status carries no statement about the Object\'s existence, validity, or lifecycle state"}';
		exit;
	}
}
