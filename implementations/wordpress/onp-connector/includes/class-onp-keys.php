<?php
/**
 * ONP_Keys — Ed25519 keypair lifecycle and the Publisher Key Record
 * (ONP-0004 Section 5.1) served at /.well-known/onp/publisher.json.
 *
 * Storage: the secret key lives in the wp_options table
 * ('onp_secret_key', autoload off, base64). For stronger isolation,
 * define ONP_SECRET_KEY (base64 of the 64-byte sodium secret key) in
 * wp-config.php — it then takes precedence and the option is ignored.
 * Anyone with database access can otherwise sign as this publisher;
 * that is the same trust boundary as WordPress auth cookies and
 * password hashes, but wp-config storage keeps the key out of SQL
 * exports and backups.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Keys {

	const OPT_SECRET  = 'onp_secret_key';
	const OPT_PUBLIC  = 'onp_public_key';
	const OPT_KEY_ID  = 'onp_key_id';
	const OPT_CREATED = 'onp_key_created';

	/** Create the keypair on activation if none exists. */
	public static function ensure_keypair(): void {
		if ( self::secret_key() !== null ) {
			return;
		}
		$keypair = sodium_crypto_sign_keypair();
		add_option( self::OPT_SECRET, base64_encode( sodium_crypto_sign_secretkey( $keypair ) ), '', false );
		add_option( self::OPT_PUBLIC, ONP_Crypto::base64url( sodium_crypto_sign_publickey( $keypair ) ), '', false );
		add_option( self::OPT_KEY_ID, 'onp:key:' . gmdate( 'Y-m-d' ), '', false );
		add_option( self::OPT_CREATED, gmdate( 'Y-m-d\TH:i:s\Z' ), '', false );
	}

	/**
	 * The 64-byte sodium secret key, or null when not provisioned or
	 * malformed. Length is checked right after decoding — passing a
	 * wrong-length key straight to sodium_crypto_sign_detached() throws
	 * an uncaught SodiumException instead of failing cleanly.
	 */
	public static function secret_key(): ?string {
		if ( defined( 'ONP_SECRET_KEY' ) && ONP_SECRET_KEY ) {
			return self::decode_secret( ONP_SECRET_KEY );
		}
		$opt = get_option( self::OPT_SECRET );
		return $opt ? self::decode_secret( $opt ) : null;
	}

	private static function decode_secret( string $base64 ): ?string {
		$decoded = base64_decode( $base64, true );
		if ( $decoded === false || strlen( $decoded ) !== SODIUM_CRYPTO_SIGN_SECRETKEYBYTES ) {
			return null;
		}
		return $decoded;
	}

	/** base64url raw 32-byte public key. */
	public static function public_key(): ?string {
		if ( defined( 'ONP_SECRET_KEY' ) && ONP_SECRET_KEY ) {
			$secret = self::secret_key();
			return $secret ? ONP_Crypto::base64url( sodium_crypto_sign_publickey_from_secretkey( $secret ) ) : null;
		}
		return get_option( self::OPT_PUBLIC ) ?: null;
	}

	public static function key_id(): string {
		return get_option( self::OPT_KEY_ID ) ?: 'onp:key:unprovisioned';
	}

	/** The publisher domain: the site host, lowercased (ONP-1001). */
	public static function domain(): string {
		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		return strtolower( (string) $host );
	}

	/**
	 * Force a URL's scheme+host to this publisher's own domain, keeping
	 * only its path/query. wp_get_attachment_url() (and other core
	 * attachment URL helpers) build from the stored upload base URL,
	 * which a domain-mapping setup often leaves un-rewritten even where
	 * home_url() itself resolves correctly — signing the un-rewritten
	 * host would embed a URL the badge's own-domain fetch (or a CORS
	 * policy) may reject. Falls back to the input unchanged if it
	 * cannot be parsed.
	 */
	public static function canonicalize_url( string $url ): string {
		$path = wp_parse_url( $url, PHP_URL_PATH ) ?: '';
		$query = wp_parse_url( $url, PHP_URL_QUERY );
		return 'https://' . self::domain() . $path . ( $query ? '?' . $query : '' );
	}

	/** ONP-0004 Section 5.1: the Publisher Key Record. */
	public static function publisher_key_record(): array {
		return array(
			'onp_trust_anchor_type' => 'domain',
			'publisher_domain'      => self::domain(),
			'current_keys'          => array(
				array(
					'key_id'     => self::key_id(),
					'algorithm'  => 'Ed25519',
					'public_key' => (string) self::public_key(),
					'valid_from' => get_option( self::OPT_CREATED ) ?: gmdate( 'Y-m-d\TH:i:s\Z' ),
				),
			),
			'previous_keys'         => array(),
		);
	}
}
