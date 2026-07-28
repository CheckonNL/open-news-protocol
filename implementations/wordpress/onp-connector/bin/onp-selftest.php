<?php
/**
 * bin/onp-selftest.php — cross-implementation proof harness.
 *
 * Direction 1 (TS -> PHP): re-verify every published test vector from
 * the TypeScript reference implementation: recompute the VID with this
 * PHP JCS/SHA-256 pipeline and verify the Ed25519 signature with the
 * published public key. Any byte-level canonicalization divergence
 * between the two implementations fails here.
 *
 * Direction 2 (PHP -> TS): generate a keypair, build and sign an
 * envelope (deliberately containing non-ASCII Dutch content and
 * unsorted keys, to stress canonicalization), and emit it together
 * with a matching Publisher Key Record as JSON on stdout — to be fed
 * to the TypeScript SDK's validateCoreWithTrust().
 *
 * Usage: php bin/onp-selftest.php /path/to/test-vectors.json
 */

require __DIR__ . '/../includes/class-onp-jcs.php';
require __DIR__ . '/../includes/class-onp-crypto.php';

$vectors_path = $argv[1] ?? null;
if ( ! $vectors_path || ! is_file( $vectors_path ) ) {
	fwrite( STDERR, "usage: php onp-selftest.php <test-vectors.json>\n" );
	exit( 2 );
}

// ---- Direction 1: TS -> PHP -------------------------------------------
$tv   = json_decode( file_get_contents( $vectors_path ), true );
$fail = 0;
foreach ( $tv['vectors'] as $v ) {
	if ( ( $v['expected_result'] ?? '' ) !== 'valid' ) {
		continue;
	}
	$envelope              = $v['input_envelope'];
	$envelope['vid']       = $v['expected_vid'];
	$envelope['signature'] = $v['expected_signature'];

	$vid_ok = ONP_Crypto::verify_vid( $envelope );
	$pub    = ONP_Crypto::base64url_decode( $v['test_keypair']['public_key'] );
	$sig_ok = ONP_Crypto::verify_envelope( $envelope, $pub );

	fwrite( STDERR, sprintf(
		"TS->PHP %s: vid %s, signature %s\n",
		$v['test_vector_id'],
		$vid_ok ? 'OK' : 'MISMATCH',
		$sig_ok ? 'OK' : 'INVALID'
	) );
	if ( ! $vid_ok || ! $sig_ok ) {
		$fail++;
	}
}
if ( $fail > 0 ) {
	fwrite( STDERR, "TS->PHP FAILED\n" );
	exit( 1 );
}

// ---- Direction 2: PHP -> TS -------------------------------------------
$keypair    = sodium_crypto_sign_keypair();
$secret_key = sodium_crypto_sign_secretkey( $keypair );
$public_raw = sodium_crypto_sign_publickey( $keypair );

// Keys deliberately out of canonical order; content deliberately Dutch
// with diacritics, an emoji (supplementary plane -> surrogate-pair key
// ordering territory), and embedded quotes/newlines.
$unsigned = array(
	'content_type' => 'onp:companion:article',
	'signed_at'    => '2026-07-28T12:00:00Z',
	'oid'          => 'onp:oid:regiopurmerend.nl:php-selftest-01',
	'content'      => array(
		'body'     => "Reünie in Purmerend: \"één dag\" zon ☀️ — regel 1\nregel 2",
		'headline' => 'PHP-implementatie ondertekent zélf',
		'byline'   => array( 'Rob' ),
	),
	'publisher'    => array(
		'key_id' => 'onp:key:php-selftest',
		'domain' => 'regiopurmerend.nl',
	),
);

$vid                   = ONP_Crypto::compute_vid( $unsigned );
$envelope              = $unsigned;
$envelope['vid']       = $vid;
$envelope['signature'] = ONP_Crypto::sign_envelope( $envelope, $secret_key );

// Sanity: self-verify before shipping to TS.
if ( ! ONP_Crypto::verify_vid( $envelope ) || ! ONP_Crypto::verify_envelope( $envelope, $public_raw ) ) {
	fwrite( STDERR, "PHP self-verification failed\n" );
	exit( 1 );
}
fwrite( STDERR, "PHP->PHP self-verify OK\n" );

echo json_encode(
	array(
		'envelope'            => $envelope,
		'publisher_key_record' => array(
			'onp_trust_anchor_type' => 'domain',
			'publisher_domain'      => 'regiopurmerend.nl',
			'current_keys'          => array(
				array(
					'key_id'     => 'onp:key:php-selftest',
					'algorithm'  => 'Ed25519',
					'public_key' => ONP_Crypto::base64url( $public_raw ),
					'valid_from' => '2026-01-01T00:00:00Z',
				),
			),
			'previous_keys'         => array(),
		),
	),
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
) . "\n";
