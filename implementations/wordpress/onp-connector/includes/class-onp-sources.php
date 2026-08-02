<?php
/**
 * ONP_Sources — attachments an editor marks as source documents become
 * a signed document Object (ONP-2200 media_type "document", Verified
 * Asset Reference over the file bytes) plus a Source Object (ONP-2600,
 * source_type "document") whose document_ref points at it. The Article
 * lists the Source OIDs in source_refs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Sources {

	const META_LOCAL_ID = '_onp_local_id';
	const META_IS_SOURCE = '_onp_source_document';
	const META_ORIGIN_URL = '_onp_source_origin_url';

	private static function local_id( int $att_id ): string {
		$existing = get_post_meta( $att_id, self::META_LOCAL_ID, true );
		if ( $existing ) {
			return $existing;
		}
		$att       = get_post( $att_id );
		$candidate = 'doc-' . strtolower( (string) ( $att->post_name ?? '' ) );
		if ( ! preg_match( '/^[a-z0-9-]{1,120}$/', $candidate ) ) {
			$candidate = 'doc-att-' . $att_id;
		}
		update_post_meta( $att_id, self::META_LOCAL_ID, $candidate );
		return $candidate;
	}

	/** Source OIDs for a post's marked source-document attachments. */
	public static function refs_for_post( WP_Post $post ): array {
		$secret = ONP_Keys::secret_key();
		if ( $secret === null ) {
			return array();
		}
		$ids = get_posts( array(
			'post_type'      => 'attachment',
			'post_parent'    => $post->ID,
			'post_status'    => 'inherit',
			'posts_per_page' => -1,
			'meta_key'       => self::META_IS_SOURCE,
			'meta_value'     => '1',
			'fields'         => 'ids',
		) );
		$refs = array();
		foreach ( (array) $ids as $id ) {
			$oid = self::sign_document( (int) $id, $secret );
			if ( $oid ) {
				$refs[] = $oid;
			}
		}
		return $refs;
	}

	/** Sign the document + Source Objects for one attachment; returns
	 *  the Source OID. */
	public static function sign_document( int $att_id, string $secret ): ?string {
		$file = get_attached_file( $att_id );
		if ( ! $file || ! file_exists( $file ) ) {
			return null;
		}
		$base       = self::local_id( $att_id );
		$doc_local  = $base . '-bestand';
		$src_local  = $base;
		$domain     = ONP_Keys::domain();
		$doc_oid    = 'onp:oid:' . $domain . ':' . $doc_local;
		$src_oid    = 'onp:oid:' . $domain . ':' . $src_local;
		$title      = html_entity_decode( get_the_title( $att_id ), ENT_QUOTES | ENT_HTML5 );

		$doc_content = ONP_Companions::media_content(
			'document',
			ONP_Keys::canonicalize_url( (string) wp_get_attachment_url( $att_id ) ),
			ONP_Companions::asset_hash( (string) file_get_contents( $file ) ),
			(string) ( get_post_mime_type( $att_id ) ?: 'application/octet-stream' ),
			$title !== '' ? array( 'caption' => $title ) : array()
		);
		$doc_env = ONP_Companions::sign( $doc_oid, 'onp:companion:media', $doc_content, $secret );
		ONP_Registry::put( $doc_local, $doc_oid, 'document', $doc_env, ONP_Companions::content_hash( 'onp:companion:media', $doc_content ) );

		// origin_url (ONP-2600 §4.5 rule 2): a citation of where the
		// document was originally published, distinct from document_ref's
		// self-hosted, hash-verified copy above.
		$origin_url  = (string) get_post_meta( $att_id, self::META_ORIGIN_URL, true );
		$src_content = ONP_Companions::source_content( $doc_oid, $title, gmdate( 'Y-m-d' ), $origin_url );
		$src_env     = ONP_Companions::sign( $src_oid, 'onp:companion:sources', $src_content, $secret );
		ONP_Registry::put( $src_local, $src_oid, 'source', $src_env, ONP_Companions::content_hash( 'onp:companion:sources', $src_content ) );

		return $src_oid;
	}
}
