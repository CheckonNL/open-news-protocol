<?php
/**
 * ONP_Crypto — pure ONP-1001/1002/1003 operations: Pre-Image
 * construction, VID computation, Ed25519 signing and verification.
 *
 * WordPress-free by design; bin/onp-selftest.php exercises this class
 * standalone and cross-verifies its output against the TypeScript
 * reference implementation.
 */

if ( ! defined( 'ABSPATH' ) && php_sapi_name() !== 'cli' ) {
	exit;
}

final class ONP_Crypto {

	/** ONP-1002 Section 4.3: the two Pre-Image Profiles. */
	private const PROFILES = array(
		'vid-preimage'     => array( 'vid', 'signature' ),
		'signing-preimage' => array( 'signature' ),
	);

	/** ONP-1002 Section 4.2: exclude the Profile's fields, then JCS. */
	public static function build_preimage( array $envelope, string $profile ): string {
		foreach ( self::PROFILES[ $profile ] as $field ) {
			unset( $envelope[ $field ] );
		}
		return ONP_JCS::canonicalize( $envelope );
	}

	/** ONP-1001 Section 4.3: vid = onp:vid:sha-256:base64url(digest). */
	public static function compute_vid( array $envelope ): string {
		$preimage = self::build_preimage( $envelope, 'vid-preimage' );
		return 'onp:vid:sha-256:' . self::base64url( hash( 'sha256', $preimage, true ) );
	}

	/** ONP-1003 Section 4.4: sign the signing-preimage with Ed25519. */
	public static function sign_envelope( array $envelope_with_vid, string $secret_key ): string {
		$preimage = self::build_preimage( $envelope_with_vid, 'signing-preimage' );
		$sig      = sodium_crypto_sign_detached( $preimage, $secret_key );
		return 'onp:sig:ed25519:' . self::base64url( $sig );
	}

	/** ONP-1003 Section 4.5 steps 5-6 (cryptographic step only). */
	public static function verify_envelope( array $envelope, string $public_key_raw ): bool {
		if ( ! isset( $envelope['signature'] ) || ! is_string( $envelope['signature'] ) ) {
			return false;
		}
		if ( ! preg_match( '/^onp:sig:([a-z0-9-]{1,32}):([A-Za-z0-9_-]+)$/', $envelope['signature'], $m ) ) {
			return false;
		}
		if ( $m[1] !== 'ed25519' ) {
			return false; // fail closed, ONP-0005 Section 4.2 rule 3
		}
		$sig      = self::base64url_decode( $m[2] );
		$preimage = self::build_preimage( $envelope, 'signing-preimage' );
		return sodium_crypto_sign_verify_detached( $sig, $preimage, $public_key_raw );
	}

	/** ONP-1001 Section 6.1 steps 3-4: recompute and compare the VID. */
	public static function verify_vid( array $envelope ): bool {
		return isset( $envelope['vid'] ) && self::compute_vid( $envelope ) === $envelope['vid'];
	}

	public static function base64url( string $bytes ): string {
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
	}

	public static function base64url_decode( string $s ): string {
		$pad = strlen( $s ) % 4 === 0 ? '' : str_repeat( '=', 4 - ( strlen( $s ) % 4 ) );
		return base64_decode( strtr( $s, '-_', '+/' ) . $pad );
	}
}
