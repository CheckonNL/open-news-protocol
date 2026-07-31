<?php
/**
 * ONP_Corrections — a reader-facing, signed Correction Object
 * (ONP-2700) binding the previous Version's VID to the new one when an
 * editor records a correction. Complements Core lifecycle (which
 * already chains Versions via `supersedes`); this adds the explicit
 * "corrected / updated" record the reader badge surfaces.
 *
 * The correction OID is derived from the post ID and a sequence — NOT
 * from any VID — so the Article can list it in `corrections_ref`
 * before it is created, without a circular dependency on the very VID
 * the correction names.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Corrections {

	const META_LIST = '_onp_corrections';
	const META_TYPE = '_onp_correction_type';
	const META_NOTE = '_onp_correction_note';

	const TYPES = array( 'factual', 'clarification', 'typographical', 'retraction', 'update' );

	/**
	 * The correction the editor requested for this edit, or null. Only
	 * an update (a post with a previous Version) carrying a non-empty
	 * note yields a correction. Pure — mutates nothing.
	 */
	public static function pending( WP_Post $post ): ?array {
		$note = trim( (string) get_post_meta( $post->ID, self::META_NOTE, true ) );
		$prev = get_post_meta( $post->ID, ONP_Object::META_CURRENT_VID, true );
		if ( $note === '' || ! $prev ) {
			return null;
		}
		$type = (string) get_post_meta( $post->ID, self::META_TYPE, true );
		$type = in_array( $type, self::TYPES, true ) ? $type : 'update';
		$seq  = count( (array) get_post_meta( $post->ID, self::META_LIST, true ) ) + 1;
		return array(
			'oid'  => 'onp:oid:' . ONP_Keys::domain() . ':correctie-' . $post->ID . '-' . $seq,
			'seq'  => $seq,
			'type' => $type,
			'note' => $note,
		);
	}

	/** Correction OIDs to list in the Article's `corrections_ref`:
	 *  all committed ones plus the pending one, if any. */
	public static function refs( WP_Post $post ): array {
		$refs = (array) get_post_meta( $post->ID, self::META_LIST, true );
		$p    = self::pending( $post );
		if ( $p ) {
			$refs[] = $p['oid'];
		}
		return array_values( array_unique( array_filter( $refs ) ) );
	}

	/**
	 * Sign the Correction Object (corrected_vid -> correcting_vid),
	 * store it, record its OID, and consume the editor's note. Called
	 * by ONP_Object::sign_post after the new Article Version is signed.
	 */
	public static function commit( WP_Post $post, array $pending, string $previous_vid, string $new_vid, string $secret ): void {
		$local   = 'correctie-' . $post->ID . '-' . $pending['seq'];
		$content = ONP_Companions::correction_content(
			ONP_Object::oid( $post ),
			$previous_vid,
			$new_vid,
			$pending['type'],
			$pending['note'],
			gmdate( 'Y-m-d\TH:i:s\Z' )
		);
		$env = ONP_Companions::sign( $pending['oid'], 'onp:companion:corrections', $content, $secret );
		ONP_Registry::put( $local, $pending['oid'], 'corrections', $env, ONP_Companions::content_hash( 'onp:companion:corrections', $content ) );

		$list   = (array) get_post_meta( $post->ID, self::META_LIST, true );
		$list[] = $pending['oid'];
		update_post_meta( $post->ID, self::META_LIST, array_values( array_unique( $list ) ) );
		delete_post_meta( $post->ID, self::META_NOTE );
		delete_post_meta( $post->ID, self::META_TYPE );
	}
}
