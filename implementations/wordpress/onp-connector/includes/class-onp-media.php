<?php
/**
 * ONP_Media — a post's images become signed Media Objects (ONP-2200)
 * bound to the real file bytes, with the photographer's credit and a
 * reference to their standing Rights/Payment agreement (ONP_Profiles).
 * The Article then lists the Media OIDs in media_refs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Media {

	const META_LOCAL_ID     = '_onp_local_id';
	const META_PHOTOGRAPHER = '_onp_photographer';

	/** Frozen Local Identifier for an attachment (ONP-1001 grammar). */
	public static function local_id( int $att_id ): string {
		$existing = get_post_meta( $att_id, self::META_LOCAL_ID, true );
		if ( $existing ) {
			return $existing;
		}
		$att       = get_post( $att_id );
		$candidate = 'media-' . strtolower( (string) ( $att->post_name ?? '' ) );
		if ( ! preg_match( '/^[a-z0-9-]{1,128}$/', $candidate ) || strlen( $candidate ) > 128 ) {
			$candidate = 'media-att-' . $att_id;
		}
		update_post_meta( $att_id, self::META_LOCAL_ID, $candidate );
		return $candidate;
	}

	/**
	 * The images referenced by a post (featured image + attached
	 * images), signed as Media Objects. Returns their OIDs, in a stable
	 * order, for the Article's media_refs.
	 */
	public static function refs_for_post( WP_Post $post ): array {
		$secret = ONP_Keys::secret_key();
		if ( $secret === null ) {
			return array();
		}
		$ids   = array();
		$thumb = (int) get_post_thumbnail_id( $post->ID );
		if ( $thumb ) {
			$ids[] = $thumb;
		}
		foreach ( get_attached_media( 'image', $post->ID ) as $m ) {
			$ids[] = (int) $m->ID;
		}
		$ids = array_values( array_unique( $ids ) );

		$refs = array();
		foreach ( $ids as $id ) {
			$oid = self::sign_image( $id, $secret );
			if ( $oid ) {
				$refs[] = $oid;
			}
		}
		return $refs;
	}

	/** Sign one image attachment as a Media Object; returns its OID. */
	public static function sign_image( int $att_id, string $secret ): ?string {
		$file = get_attached_file( $att_id );
		if ( ! $file || ! file_exists( $file ) ) {
			return null;
		}
		$local = self::local_id( $att_id );
		$oid   = 'onp:oid:' . ONP_Keys::domain() . ':' . $local;

		$opt              = self::attribution( $att_id );
		$opt['alt_text']  = (string) get_post_meta( $att_id, '_wp_attachment_image_alt', true );
		$opt['caption']   = (string) wp_get_attachment_caption( $att_id );

		$content = ONP_Companions::media_content(
			'image',
			ONP_Keys::canonicalize_url( (string) wp_get_attachment_url( $att_id ) ),
			ONP_Companions::asset_hash( (string) file_get_contents( $file ) ),
			(string) ( get_post_mime_type( $att_id ) ?: 'application/octet-stream' ),
			$opt
		);
		$env = ONP_Companions::sign( $oid, 'onp:companion:media', $content, $secret );
		ONP_Registry::put( $local, $oid, 'media', $env, ONP_Companions::content_hash( 'onp:companion:media', $content ) );
		return $oid;
	}

	/**
	 * Resolve credit + rights_ref + payment_ref for an attachment:
	 * a chosen photographer profile first (credit + signed Rights/
	 * Payment references), then EXIF credit/copyright, then the site
	 * default credit.
	 */
	private static function attribution( int $att_id ): array {
		$key = (string) get_post_meta( $att_id, self::META_PHOTOGRAPHER, true );
		if ( $key !== '' && ONP_Profiles::get( $key ) !== null ) {
			list( $rights_oid, $payment_oid ) = ONP_Profiles::ensure_objects( $key );
			$out = array( 'credit' => ONP_Profiles::credit( $key ) );
			if ( $rights_oid ) {
				$out['rights_ref'] = $rights_oid;
			}
			if ( $payment_oid ) {
				$out['payment_ref'] = $payment_oid;
			}
			return $out;
		}

		$meta   = wp_get_attachment_metadata( $att_id );
		$credit = '';
		if ( is_array( $meta ) && ! empty( $meta['image_meta'] ) ) {
			$im     = $meta['image_meta'];
			$credit = (string) ( $im['credit'] ?? '' );
			if ( $credit === '' ) {
				$credit = (string) ( $im['copyright'] ?? '' );
			}
		}
		if ( $credit === '' ) {
			$credit = (string) get_option( 'onp_default_credit', '' );
		}
		return $credit !== '' ? array( 'credit' => $credit ) : array();
	}
}
