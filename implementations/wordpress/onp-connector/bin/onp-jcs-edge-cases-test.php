<?php
/**
 * bin/onp-jcs-edge-cases-test.php — asserts ONP_JCS::canonicalize()
 * fails predictably on values an envelope must never contain: NaN,
 * INF, -INF, and non-integral floats. ONP-1002 Section 4.4 requires
 * precision-sensitive numbers as strings, so a float reaching the
 * canonicalizer is always an upstream bug — this locks in that it is
 * rejected loudly rather than silently mis-serialized, which would
 * risk a cross-implementation VID mismatch.
 */

require __DIR__ . '/../includes/class-onp-jcs.php';

$fail = 0;
function check( bool $ok, string $what ): void {
	global $fail;
	fwrite( STDERR, ( $ok ? 'OK   ' : 'FAIL ' ) . $what . "\n" );
	if ( ! $ok ) { $fail++; }
}

function rejects( $value, string $label ): bool {
	try {
		ONP_JCS::canonicalize( $value );
		return false; // should have thrown
	} catch ( InvalidArgumentException $e ) {
		return true;
	}
}

check( rejects( NAN, 'NaN' ), 'canonicalize(NAN) throws' );
check( rejects( INF, 'INF' ), 'canonicalize(INF) throws' );
check( rejects( -INF, '-INF' ), 'canonicalize(-INF) throws' );
check( rejects( 3.14, 'non-integral float' ), 'canonicalize(3.14) throws' );
check( rejects( array( 'price' => 3.14 ), 'nested non-integral float' ), 'canonicalize({price: 3.14}) throws' );

// Integral floats are the one float shape that legitimately occurs
// (arithmetic on ints can yield e.g. 3.0) and must serialize as ints,
// matching ECMAScript JSON.stringify / the TypeScript reference.
check( ONP_JCS::canonicalize( 3.0 ) === '3', 'canonicalize(3.0) === "3"' );
check( ONP_JCS::canonicalize( -0.0 ) === '0', 'canonicalize(-0.0) === "0"' );

if ( $fail > 0 ) {
	fwrite( STDERR, "$fail check(s) failed\n" );
	exit( 1 );
}
fwrite( STDERR, "all JCS edge-case checks passed\n" );
