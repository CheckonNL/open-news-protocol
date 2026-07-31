<?php
/**
 * ONP_Registry — storage and serving for every non-Article Object
 * (Media, Rights, Payment, Source, document, Corrections).
 *
 * Article Objects stay in post meta and keep their tested path
 * (ONP_Object); this registry is a uniform store for the Companions
 * that are NOT one-to-one with a post. Each row is one OID/local-id:
 * its current VID and the full VID -> canonical-JSON version map, so
 * the same Object/Version URL semantics (ONP-1006) apply to Companions
 * as to Articles.
 *
 * A custom table (not post meta) because these Objects have no host
 * post — a photographer's Rights profile belongs to many photos, a
 * document to none — and because it scales past what autoloaded
 * options allow.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Registry {

	const VERSION = '1';

	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'onp_objects';
	}

	/** Create/upgrade the table (called on activation). */
	public static function install(): void {
		global $wpdb;
		$table   = self::table();
		$charset = $wpdb->get_charset_collate();
		$sql     = "CREATE TABLE {$table} (
			local_id VARCHAR(128) NOT NULL,
			oid VARCHAR(255) NOT NULL,
			type VARCHAR(64) NOT NULL,
			current_vid VARCHAR(128) NOT NULL,
			content_hash CHAR(64) NOT NULL DEFAULT '',
			versions LONGTEXT NOT NULL,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY (local_id)
		) {$charset};";
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
		update_option( 'onp_registry_version', self::VERSION, false );
	}

	/**
	 * Store a signed Object as its Current Version, gated on the caller's
	 * content hash (a hash of the content region, excluding signed_at) so
	 * that re-signing unchanged content — which would still produce a new
	 * VID because signed_at changed — never grows the chain. Returns the
	 * Current VID (existing when unchanged, new when stored).
	 */
	public static function put( string $local_id, string $oid, string $type, array $envelope, string $content_hash ): string {
		global $wpdb;
		$vid  = (string) ( $envelope['vid'] ?? '' );
		$json = ONP_JCS::canonicalize( $envelope );

		$row = self::row( $local_id );
		if ( $row && hash_equals( $row['content_hash'], $content_hash ) ) {
			return $row['current_vid']; // content unchanged — keep the current Version
		}
		$versions         = $row ? json_decode( $row['versions'], true ) : array();
		$versions         = is_array( $versions ) ? $versions : array();
		$versions[ $vid ] = $json;

		$wpdb->replace(
			self::table(),
			array(
				'local_id'     => $local_id,
				'oid'          => $oid,
				'type'         => $type,
				'current_vid'  => $vid,
				'content_hash' => $content_hash,
				'versions'     => wp_json_encode( $versions ),
				'updated_at'   => gmdate( 'Y-m-d H:i:s' ),
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		return $vid;
	}

	/** The current VID for a local id, or null. */
	public static function current_vid( string $local_id ): ?string {
		$row = self::row( $local_id );
		return $row ? $row['current_vid'] : null;
	}

	/** Canonical JSON of the Current Version, or null. */
	public static function current_json( string $local_id ): ?string {
		$row = self::row( $local_id );
		if ( ! $row ) {
			return null;
		}
		$versions = json_decode( $row['versions'], true );
		return is_array( $versions ) && isset( $versions[ $row['current_vid'] ] )
			? $versions[ $row['current_vid'] ]
			: null;
	}

	/** Canonical JSON of a specific immutable Version, or null. */
	public static function version_json( string $local_id, string $vid ): ?string {
		$row = self::row( $local_id );
		if ( ! $row ) {
			return null;
		}
		$versions = json_decode( $row['versions'], true );
		return is_array( $versions ) && isset( $versions[ $vid ] ) ? $versions[ $vid ] : null;
	}

	/** Does an Object with this local id exist here? */
	public static function exists( string $local_id ): bool {
		return self::row( $local_id ) !== null;
	}

	private static function row( string $local_id ): ?array {
		global $wpdb;
		$table = self::table();
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is internal.
		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE local_id = %s", $local_id ), ARRAY_A );
		return $row ?: null;
	}
}
