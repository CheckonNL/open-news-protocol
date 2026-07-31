<?php
/**
 * bin/onp-companions-test.php — exercises the Companion builders
 * (ONP_Companions and the content shapes ONP_Media / ONP_Profiles /
 * ONP_Sources / ONP_Corrections produce), signs one Object of each
 * kind, self-verifies them in PHP, and emits them plus the Publisher
 * Key Record for the TypeScript SDK to cross-verify
 * (tools/verify-companions.mjs).
 *
 * Media / Rights / Payments / Corrections carry reference validators in
 * the SDK and MUST validate as companion_valid === true; Sources has no
 * reference validator (companion_valid "unknown"), which is the
 * ONP-1004 interoperability guarantee, not a failure.
 */

define( 'ABSPATH', '/tmp/' );

$GLOBALS['__options'] = array();
function get_option( $k, $d = false ) { return $GLOBALS['__options'][ $k ] ?? $d; }
function add_option( $k, $v, $d = '', $a = true ) { $GLOBALS['__options'][ $k ] = $v; return true; }
function update_option( $k, $v, $a = true ) { $GLOBALS['__options'][ $k ] = $v; return true; }
function wp_parse_url( $url, $c ) { return parse_url( $url, $c ); }
function home_url() { return 'https://regiopurmerend.nl'; }

require __DIR__ . '/../includes/class-onp-jcs.php';
require __DIR__ . '/../includes/class-onp-crypto.php';
require __DIR__ . '/../includes/class-onp-keys.php';
require __DIR__ . '/../includes/class-onp-companions.php';

ONP_Keys::ensure_keypair();
$secret = ONP_Keys::secret_key();
$domain = ONP_Keys::domain();
$oid    = function ( $l ) use ( $domain ) { return "onp:oid:$domain:$l"; };

$fail = 0;
function check( bool $ok, string $what ): void {
	global $fail;
	fwrite( STDERR, ( $ok ? 'OK   ' : 'FAIL ' ) . $what . "\n" );
	if ( ! $ok ) { $fail++; }
}

$rights_oid  = $oid( 'rechten-broca-media' );
$payment_oid = $oid( 'vergoeding-broca-media' );

$objects = array();

// Media (image) — references the photographer's Rights + Payment Objects.
$objects['media-image'] = ONP_Companions::sign(
	$oid( 'media-brandweer-foto' ),
	'onp:companion:media',
	ONP_Companions::media_content(
		'image',
		"https://$domain/media/foto.jpg",
		ONP_Companions::asset_hash( 'fake-image-bytes' ),
		'image/jpeg',
		array( 'credit' => '© Broca Media', 'alt_text' => 'Brandweer', 'rights_ref' => $rights_oid, 'payment_ref' => $payment_oid )
	),
	$secret
);

// Media (document) — the ONP-2200 v0.5.0 "document" modality.
$objects['media-document'] = ONP_Companions::sign(
	$oid( 'begrotingswijziging-bestand' ),
	'onp:companion:media',
	ONP_Companions::media_content(
		'document',
		"https://$domain/docs/begroting.pdf",
		ONP_Companions::asset_hash( 'fake-pdf-bytes' ),
		'application/pdf',
		array( 'caption' => 'Begrotingswijziging Purmerend' )
	),
	$secret
);

// Rights (ONP-2400).
$profile = array(
	'license_identifier'       => 'editorial-use-only',
	'copyright_holder'         => 'Broca Media',
	'redistribution_permitted' => false,
	'attribution_required'     => true,
	'commercial_use_permitted' => false,
);
$objects['rights'] = ONP_Companions::sign( $rights_oid, 'onp:companion:rights', ONP_Companions::rights_content( $profile ), $secret );

// Payments (ONP-2500) with a revenue split.
$pay = array(
	'payment_model'  => 'one-time',
	'revenue_shares' => array(
		array( 'recipient_ref' => 'Broca Media', 'percentage' => '70' ),
		array( 'recipient_ref' => 'Redactie', 'percentage' => '30' ),
	),
);
$objects['payments'] = ONP_Companions::sign( $payment_oid, 'onp:companion:payments', ONP_Companions::payment_content( $pay ), $secret );

// Sources (ONP-2600) pointing at the document Object.
$objects['source'] = ONP_Companions::sign(
	$oid( 'begrotingswijziging-bron' ),
	'onp:companion:sources',
	ONP_Companions::source_content( $oid( 'begrotingswijziging-bestand' ), 'Begrotingswijziging Purmerend', '2026-07-30' ),
	$secret
);

// Corrections (ONP-2700) linking two Versions.
$old = 'onp:vid:sha-256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
$new = 'onp:vid:sha-256:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
$objects['corrections'] = ONP_Companions::sign(
	$oid( 'begrotingswijziging-correctie-1' ),
	'onp:companion:corrections',
	ONP_Companions::correction_content( $oid( 'begrotingswijziging' ), $old, $new, 'update', 'Ondertekend besluit toegevoegd.', '2026-07-30T21:15:00Z' ),
	$secret
);

// PHP self-verification: VID recompute + Ed25519 signature.
$public = ONP_Crypto::base64url_decode( (string) ONP_Keys::public_key() );
foreach ( $objects as $name => $env ) {
	check( ONP_Crypto::verify_vid( $env ), "$name: VID recomputes" );
	check( ONP_Crypto::verify_envelope( $env, $public ), "$name: signature verifies" );
}

if ( $fail > 0 ) {
	fwrite( STDERR, "COMPANIONS SELF-TEST FAILED ($fail)\n" );
	exit( 1 );
}

echo json_encode(
	array(
		'publisher_key_record' => ONP_Keys::publisher_key_record(),
		'objects'              => array_values( $objects ),
	),
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
) . "\n";
