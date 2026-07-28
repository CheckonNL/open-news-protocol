<?php
/**
 * ONP_JCS — RFC 8785 (JSON Canonicalization Scheme) serializer.
 *
 * Implements ONP-1002's canonicalization mandate in PHP, matching the
 * TypeScript reference implementation (which uses the RFC author's own
 * `canonicalize` package) byte for byte. Cross-implementation equality
 * is verified by bin/onp-selftest.php against the SDK's published test
 * vectors.
 *
 * Scope note: ONP envelopes contain strings, objects, arrays, booleans,
 * null, and integers only — ONP-1002 Section 4.4 requires monetary and
 * other precision-sensitive amounts to be strings, so floats never
 * legitimately occur in a signable envelope. This serializer therefore
 * REFUSES floats loudly instead of implementing ECMAScript double
 * formatting: a float in an envelope is a bug upstream, and silently
 * serializing it risks a cross-implementation VID mismatch.
 *
 * WordPress-free by design so it is testable standalone.
 */

if ( ! defined( 'ABSPATH' ) && php_sapi_name() !== 'cli' ) {
	exit;
}

final class ONP_JCS {

	/**
	 * Canonicalize a decoded JSON value (arrays/stdClass/scalars) into
	 * its RFC 8785 canonical string form.
	 */
	public static function canonicalize( $value ): string {
		return self::serialize( $value );
	}

	private static function serialize( $value ): string {
		if ( $value === null ) {
			return 'null';
		}
		if ( is_bool( $value ) ) {
			return $value ? 'true' : 'false';
		}
		if ( is_int( $value ) ) {
			return (string) $value;
		}
		if ( is_float( $value ) ) {
			// Integral floats (e.g. 3.0 from json_decode of "3" is int,
			// but arithmetic may yield 3.0) serialize as integers per
			// ECMAScript; genuine fractions are refused (see header).
			if ( floor( $value ) === $value && abs( $value ) < PHP_INT_MAX ) {
				return (string) (int) $value;
			}
			throw new InvalidArgumentException(
				'ONP_JCS: non-integral float encountered; ONP envelopes must carry precision-sensitive numbers as strings (ONP-1002 Section 4.4)'
			);
		}
		if ( is_string( $value ) ) {
			return self::serialize_string( $value );
		}
		if ( is_array( $value ) ) {
			if ( array_is_list( $value ) ) {
				$parts = array();
				foreach ( $value as $item ) {
					$parts[] = self::serialize( $item );
				}
				return '[' . implode( ',', $parts ) . ']';
			}
			return self::serialize_object( $value );
		}
		if ( $value instanceof stdClass ) {
			return self::serialize_object( (array) $value );
		}
		throw new InvalidArgumentException( 'ONP_JCS: unsupported type ' . gettype( $value ) );
	}

	private static function serialize_object( array $map ): string {
		$keys = array_map( 'strval', array_keys( $map ) );
		usort( $keys, array( self::class, 'compare_utf16' ) );
		$parts = array();
		foreach ( $keys as $key ) {
			$parts[] = self::serialize_string( $key ) . ':' . self::serialize( $map[ $key ] );
		}
		return '{' . implode( ',', $parts ) . '}';
	}

	/**
	 * RFC 8785 Section 3.2.3: property keys sort by UTF-16 code units.
	 * Implemented over UTF-8 input by comparing code points with
	 * surrogate decomposition for the supplementary planes, without a
	 * mbstring dependency.
	 */
	public static function compare_utf16( string $a, string $b ): int {
		$ua = self::utf16_units( $a );
		$ub = self::utf16_units( $b );
		$n  = min( count( $ua ), count( $ub ) );
		for ( $i = 0; $i < $n; $i++ ) {
			if ( $ua[ $i ] !== $ub[ $i ] ) {
				return $ua[ $i ] < $ub[ $i ] ? -1 : 1;
			}
		}
		return count( $ua ) <=> count( $ub );
	}

	/** Decode UTF-8 to an array of UTF-16 code units. */
	private static function utf16_units( string $s ): array {
		$units = array();
		$len   = strlen( $s );
		$i     = 0;
		while ( $i < $len ) {
			$byte = ord( $s[ $i ] );
			if ( $byte < 0x80 ) {
				$cp = $byte;
				$i += 1;
			} elseif ( ( $byte & 0xE0 ) === 0xC0 ) {
				$cp = ( ( $byte & 0x1F ) << 6 ) | ( ord( $s[ $i + 1 ] ) & 0x3F );
				$i += 2;
			} elseif ( ( $byte & 0xF0 ) === 0xE0 ) {
				$cp = ( ( $byte & 0x0F ) << 12 ) | ( ( ord( $s[ $i + 1 ] ) & 0x3F ) << 6 ) | ( ord( $s[ $i + 2 ] ) & 0x3F );
				$i += 3;
			} else {
				$cp = ( ( $byte & 0x07 ) << 18 ) | ( ( ord( $s[ $i + 1 ] ) & 0x3F ) << 12 ) | ( ( ord( $s[ $i + 2 ] ) & 0x3F ) << 6 ) | ( ord( $s[ $i + 3 ] ) & 0x3F );
				$i += 4;
			}
			if ( $cp > 0xFFFF ) {
				$cp     -= 0x10000;
				$units[] = 0xD800 | ( $cp >> 10 );
				$units[] = 0xDC00 | ( $cp & 0x3FF );
			} else {
				$units[] = $cp;
			}
		}
		return $units;
	}

	/**
	 * RFC 8785 Section 3.2.2.2 string serialization, identical to
	 * ECMAScript JSON.stringify: escape `"` and `\`, use the short
	 * escapes \b \t \n \f \r, \u00xx (lowercase hex) for the remaining
	 * control characters, and emit everything else literally as UTF-8.
	 */
	private static function serialize_string( string $s ): string {
		$out = '"';
		$len = strlen( $s );
		for ( $i = 0; $i < $len; $i++ ) {
			$c    = $s[ $i ];
			$byte = ord( $c );
			if ( $c === '"' ) {
				$out .= '\\"';
			} elseif ( $c === '\\' ) {
				$out .= '\\\\';
			} elseif ( $byte === 0x08 ) {
				$out .= '\\b';
			} elseif ( $byte === 0x09 ) {
				$out .= '\\t';
			} elseif ( $byte === 0x0A ) {
				$out .= '\\n';
			} elseif ( $byte === 0x0C ) {
				$out .= '\\f';
			} elseif ( $byte === 0x0D ) {
				$out .= '\\r';
			} elseif ( $byte < 0x20 ) {
				$out .= sprintf( '\\u%04x', $byte );
			} else {
				$out .= $c;
			}
		}
		return $out . '"';
	}
}
