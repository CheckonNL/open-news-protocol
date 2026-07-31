<?php
/**
 * ONP_Companions — pure builders for the Companion content regions and
 * a shared signer, WordPress-free by design (same discipline as
 * ONP_Crypto): every method takes explicit input and returns data, so
 * bin/onp-companions-test.php exercises them standalone and
 * cross-verifies the output against the TypeScript SDK.
 *
 * Content shapes mirror the reference validators exactly:
 *   Media       ONP-2200  (media_type incl. "document", v0.5.0)
 *   Rights      ONP-2400
 *   Payments    ONP-2500
 *   Sources     ONP-2600
 *   Corrections ONP-2700
 */

if ( ! defined( 'ABSPATH' ) && php_sapi_name() !== 'cli' ) {
	exit;
}

final class ONP_Companions {

	/** Assemble + VID + sign any Companion Object. */
	public static function sign( string $oid, string $content_type, array $content, string $secret ): array {
		$unsigned = array(
			'oid'          => $oid,
			'publisher'    => array(
				'domain' => ONP_Keys::domain(),
				'key_id' => ONP_Keys::key_id(),
			),
			'signed_at'    => gmdate( 'Y-m-d\TH:i:s\Z' ),
			'content_type' => $content_type,
			'content'      => $content,
		);
		$envelope              = $unsigned;
		$envelope['vid']       = ONP_Crypto::compute_vid( $unsigned );
		$envelope['signature'] = ONP_Crypto::sign_envelope( $envelope, $secret );
		return $envelope;
	}

	/** ONP-1001 §4.4: sha-256:<base64url> over the raw file bytes. */
	public static function asset_hash( string $bytes ): string {
		return 'sha-256:' . ONP_Crypto::base64url( hash( 'sha256', $bytes, true ) );
	}

	/**
	 * Stable hash of a content region plus the current publisher scope
	 * (domain, key_id) — the substantive-change gate for the registry.
	 * signed_at is excluded, as it lives on the envelope and changes on
	 * every re-sign regardless. key_id IS included: a key rotation must
	 * force a new Version even when content is byte-identical, or
	 * "Re-sign selected" would silently leave Companions signed under
	 * the retired key.
	 */
	public static function content_hash( string $content_type, array $content ): string {
		$scope = array(
			'domain' => ONP_Keys::domain(),
			'key_id' => ONP_Keys::key_id(),
		);
		return hash( 'sha256', $content_type . "\0" . ONP_JCS::canonicalize( $scope ) . "\0" . ONP_JCS::canonicalize( $content ) );
	}

	/**
	 * ONP-2200 Media content. $media_type is "image" | "video" |
	 * "audio" | "document". $opt may carry credit, alt_text, caption,
	 * creator_ref, rights_ref, payment_ref (strings), width, height
	 * (ints), duration_seconds (number).
	 */
	public static function media_content( string $media_type, string $asset_url, string $asset_hash, string $mime_type, array $opt = array() ): array {
		$content = array(
			'media_type' => $media_type,
			'asset_url'  => $asset_url,
			'asset_hash' => $asset_hash,
			'mime_type'  => $mime_type,
		);
		foreach ( array( 'credit', 'alt_text', 'caption', 'creator_ref', 'rights_ref', 'payment_ref' ) as $k ) {
			if ( isset( $opt[ $k ] ) && $opt[ $k ] !== '' ) {
				$content[ $k ] = (string) $opt[ $k ];
			}
		}
		foreach ( array( 'width', 'height' ) as $k ) {
			if ( isset( $opt[ $k ] ) && $opt[ $k ] !== '' ) {
				$content[ $k ] = (int) $opt[ $k ];
			}
		}
		return $content;
	}

	/** ONP-2400 Rights content. Requires license_identifier or license_url. */
	public static function rights_content( array $r ): array {
		$content = array();
		foreach ( array( 'license_identifier', 'license_url', 'copyright_holder', 'attribution_text', 'embargo_until' ) as $k ) {
			if ( isset( $r[ $k ] ) && $r[ $k ] !== '' ) {
				$content[ $k ] = (string) $r[ $k ];
			}
		}
		if ( isset( $r['copyright_year'] ) && $r['copyright_year'] !== '' ) {
			$content['copyright_year'] = is_int( $r['copyright_year'] ) ? $r['copyright_year'] : (string) $r['copyright_year'];
		}
		foreach ( array( 'redistribution_permitted', 'attribution_required', 'derivative_works_permitted', 'commercial_use_permitted' ) as $k ) {
			if ( array_key_exists( $k, $r ) ) {
				$content[ $k ] = (bool) $r[ $k ];
			}
		}
		if ( ! empty( $r['territory_restrictions'] ) && is_array( $r['territory_restrictions'] ) ) {
			$content['territory_restrictions'] = array_values( array_map( 'strval', $r['territory_restrictions'] ) );
		}
		return $content;
	}

	/**
	 * ONP-2500 Payments content. payment_model REQUIRED; price MUST be
	 * a string and requires currency; revenue_shares is a list of
	 * {recipient_ref, percentage} with percentage as a string.
	 */
	public static function payment_content( array $p ): array {
		$content = array( 'payment_model' => (string) ( $p['payment_model'] ?? 'free' ) );
		if ( isset( $p['price'] ) && $p['price'] !== '' ) {
			$content['price']    = (string) $p['price'];
			$content['currency'] = (string) ( $p['currency'] ?? 'EUR' );
		} elseif ( isset( $p['currency'] ) && $p['currency'] !== '' ) {
			$content['currency'] = (string) $p['currency'];
		}
		foreach ( array( 'recipient_ref', 'subscription_period' ) as $k ) {
			if ( isset( $p[ $k ] ) && $p[ $k ] !== '' ) {
				$content[ $k ] = (string) $p[ $k ];
			}
		}
		if ( ! empty( $p['revenue_shares'] ) && is_array( $p['revenue_shares'] ) ) {
			$shares = array();
			foreach ( $p['revenue_shares'] as $s ) {
				if ( isset( $s['recipient_ref'], $s['percentage'] ) ) {
					$shares[] = array(
						'recipient_ref' => (string) $s['recipient_ref'],
						'percentage'    => (string) $s['percentage'],
					);
				}
			}
			if ( $shares ) {
				$content['revenue_shares'] = $shares;
			}
		}
		return $content;
	}

	/**
	 * ONP-2600 Sources content. source_type REQUIRED (here "document");
	 * visibility REQUIRED; document_ref points at the self-hosted, hashed
	 * Media Object (the Verified Asset Reference a reader re-checks).
	 * origin_url, when given, is a CITATION of where the document was
	 * originally published or obtained — not a Verified Asset Reference,
	 * and not required to still resolve or still match (ONP-2600 §4.5
	 * rule 2).
	 */
	public static function source_content( string $document_ref, string $description = '', string $access_date = '', string $origin_url = '' ): array {
		$content = array(
			'source_type' => 'document',
			'visibility'  => 'named',
			'document_ref' => $document_ref,
		);
		if ( $description !== '' ) {
			$content['description'] = $description;
		}
		if ( $origin_url !== '' ) {
			$content['origin_url'] = $origin_url;
		}
		if ( $access_date !== '' ) {
			$content['access_date'] = $access_date;
		}
		return $content;
	}

	/**
	 * ONP-2700 Corrections content. All fields REQUIRED strings;
	 * correction_type is one of factual | clarification |
	 * typographical | retraction | update.
	 */
	public static function correction_content( string $subject_oid, string $corrected_vid, string $correcting_vid, string $type, string $explanation, string $corrected_at ): array {
		return array(
			'subject_oid'    => $subject_oid,
			'corrected_vid'  => $corrected_vid,
			'correcting_vid' => $correcting_vid,
			'correction_type' => $type,
			'explanation'    => $explanation,
			'corrected_at'   => $corrected_at,
		);
	}
}
