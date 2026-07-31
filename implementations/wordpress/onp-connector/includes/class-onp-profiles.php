<?php
/**
 * ONP_Profiles — the photographer/contributor registry (the CMS
 * "source of truth"). Each profile carries the standing agreement:
 * credit, licence (ONP-2400) and revenue split (ONP-2500). Signed
 * ONCE into the registry as Rights and Payment Objects that every
 * photo references by OID — set here, never re-typed per image.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Profiles {

	const OPTION = 'onp_photographers';

	/** All profiles: key => profile array. */
	public static function all(): array {
		$v = get_option( self::OPTION );
		return is_array( $v ) ? $v : array();
	}

	public static function get( string $key ): ?array {
		$all = self::all();
		return $all[ $key ] ?? null;
	}

	/** Save a profile under a grammar-safe key; returns the key used. */
	public static function save( string $key, array $profile ): string {
		$key = self::sanitize_key( $key );
		$all = self::all();
		$all[ $key ] = self::normalize( $profile );
		update_option( self::OPTION, $all, false );
		return $key;
	}

	public static function delete( string $key ): void {
		$all = self::all();
		unset( $all[ $key ] );
		update_option( self::OPTION, $all, false );
	}

	public static function sanitize_key( string $key ): string {
		$key = strtolower( preg_replace( '/[^a-z0-9-]+/i', '-', $key ) );
		$key = trim( $key, '-' );
		return substr( $key ?: 'fotograaf', 0, 100 );
	}

	private static function normalize( array $p ): array {
		return array(
			'label'                    => (string) ( $p['label'] ?? '' ),
			'credit'                   => (string) ( $p['credit'] ?? '' ),
			'license_identifier'       => (string) ( $p['license_identifier'] ?? 'all-rights-reserved' ),
			'redistribution_permitted' => ! empty( $p['redistribution_permitted'] ),
			'attribution_required'     => ! isset( $p['attribution_required'] ) || ! empty( $p['attribution_required'] ),
			'commercial_use_permitted' => ! empty( $p['commercial_use_permitted'] ),
			'payment_model'            => (string) ( $p['payment_model'] ?? 'one-time' ),
			'revenue_shares'           => self::normalize_shares( $p['revenue_shares'] ?? array() ),
		);
	}

	private static function normalize_shares( $shares ): array {
		$out = array();
		if ( is_array( $shares ) ) {
			foreach ( $shares as $s ) {
				if ( ! empty( $s['recipient_ref'] ) && isset( $s['percentage'] ) && $s['percentage'] !== '' ) {
					$out[] = array(
						'recipient_ref' => (string) $s['recipient_ref'],
						'percentage'    => (string) $s['percentage'],
					);
				}
			}
		}
		return $out;
	}

	public static function credit( string $key ): string {
		$p = self::get( $key );
		return $p ? (string) $p['credit'] : '';
	}

	public static function rights_oid( string $key ): string {
		return 'onp:oid:' . ONP_Keys::domain() . ':rechten-' . $key;
	}

	public static function payment_oid( string $key ): string {
		return 'onp:oid:' . ONP_Keys::domain() . ':vergoeding-' . $key;
	}

	/**
	 * Sign this photographer's Rights and Payment Objects into the
	 * registry (gated on content, so unchanged profiles never grow a
	 * chain). Returns [rights_oid, payment_oid], or [null, null] when
	 * the profile or key is missing.
	 */
	public static function ensure_objects( string $key ): array {
		$secret = ONP_Keys::secret_key();
		$p      = self::get( $key );
		if ( $secret === null || $p === null ) {
			return array( null, null );
		}

		$rights_local  = 'rechten-' . $key;
		$payment_local = 'vergoeding-' . $key;
		$rights_oid    = self::rights_oid( $key );
		$payment_oid   = self::payment_oid( $key );

		$rc  = ONP_Companions::rights_content( $p );
		$env = ONP_Companions::sign( $rights_oid, 'onp:companion:rights', $rc, $secret );
		ONP_Registry::put( $rights_local, $rights_oid, 'rights', $env, ONP_Companions::content_hash( 'onp:companion:rights', $rc ) );

		$pc   = ONP_Companions::payment_content( $p );
		$env2 = ONP_Companions::sign( $payment_oid, 'onp:companion:payments', $pc, $secret );
		ONP_Registry::put( $payment_local, $payment_oid, 'payments', $env2, ONP_Companions::content_hash( 'onp:companion:payments', $pc ) );

		return array( $rights_oid, $payment_oid );
	}
}
