<?php
/**
 * bin/onp-wp-simulation.php — exercises the WordPress-dependent code
 * paths (post -> content mapping, HTML -> Markdown, version chain,
 * retraction) against minimal WP function stubs, and emits every
 * signed Version plus the Publisher Key Record as JSON for
 * cross-verification by the TypeScript SDK.
 *
 * Simulated lifecycle: publish (v1) -> edit (v2, supersedes v1) ->
 * unchanged re-save (must NOT create v3) -> retract (v3,
 * lifecycle_state retracted, supersedes v2).
 */

define( 'ABSPATH', '/tmp/' );

// ---- minimal WP stubs --------------------------------------------------
$GLOBALS['__options']  = array();
$GLOBALS['__postmeta'] = array();
$GLOBALS['__posts']    = array();

function get_option( $k ) { return $GLOBALS['__options'][ $k ] ?? false; }
function add_option( $k, $v, $d = '', $a = true ) { $GLOBALS['__options'][ $k ] = $v; return true; }
function update_post_meta( $id, $k, $v ) { $GLOBALS['__postmeta'][ $id ][ $k ] = $v; return true; }
function get_post_meta( $id, $k, $single = false ) { return $GLOBALS['__postmeta'][ $id ][ $k ] ?? ''; }
function get_post( $id ) { return $GLOBALS['__posts'][ $id ] ?? null; }
function get_posts( $args ) {
	$out = array();
	foreach ( $GLOBALS['__posts'] as $p ) {
		if ( isset( $args['exclude'] ) && in_array( $p->ID, $args['exclude'], true ) ) { continue; }
		if ( isset( $args['meta_key'] ) ) {
			$mv = $GLOBALS['__postmeta'][ $p->ID ][ $args['meta_key'] ] ?? null;
			if ( isset( $args['meta_value'] ) && $mv !== $args['meta_value'] ) { continue; }
			if ( ! isset( $args['meta_value'] ) && $mv === null ) { continue; }
		}
		$out[] = $p->ID;
	}
	return $out;
}
function wp_parse_url( $url, $c ) { return parse_url( $url, $c ); }
function home_url() { return 'https://regiopurmerend.nl'; }
function get_the_title( $p ) { return $p->post_title; }
function apply_filters( $tag, $value ) { return $value; }
function wp_strip_all_tags( $s ) { return trim( strip_tags( $s ) ); }
function get_the_author_meta( $f, $id ) { return 'Rob'; }
function get_the_category( $id ) { $c = new stdClass(); $c->name = 'Purmerend'; return array( $c ); }
function get_permalink( $p ) { return 'https://regiopurmerend.nl/' . $p->post_name . '/'; }
function is_wp_error( $x ) { return false; }
class WP_Post {
	public $ID; public $post_title; public $post_content; public $post_excerpt = '';
	public $post_name; public $post_author = 1; public $post_status = 'publish'; public $post_type = 'post';
}

require __DIR__ . '/../includes/class-onp-jcs.php';
require __DIR__ . '/../includes/class-onp-crypto.php';
require __DIR__ . '/../includes/class-onp-keys.php';
require __DIR__ . '/../includes/class-onp-object.php';

// ---- lifecycle ---------------------------------------------------------
ONP_Keys::ensure_keypair();

$post               = new WP_Post();
$post->ID           = 42;
$post->post_title   = 'Bommenonderzoek Wheermolen&#8209;Oost afgerond';
$post->post_name    = 'bommenonderzoek-wheermolen-oost';
$post->post_content = '<p>De gemeente heeft het <strong>historisch vooronderzoek</strong> afgerond.</p>'
	. '<h2>Wat er is gevonden</h2>'
	. '<p>Zie het <a href="https://regiopurmerend.nl/dossier">dossier</a> voor details.</p>'
	. '<ul><li>Twee verdachte locaties</li><li>Één vrijgegeven zone</li></ul>';
$GLOBALS['__posts'][42] = $post;

$fail = 0;
function check( bool $ok, string $what ): void {
	global $fail;
	fwrite( STDERR, ( $ok ? 'OK   ' : 'FAIL ' ) . $what . "\n" );
	if ( ! $ok ) { $fail++; }
}

// v1: publish
$vid1 = ONP_Object::sign_post( $post );
check( $vid1 !== null, 'publish signs v1' );
$v1 = json_decode( ONP_Object::current_version_json( $post ), true );
check( ! isset( $v1['supersedes'] ), 'v1 has no supersedes' );
check( $v1['oid'] === 'onp:oid:regiopurmerend.nl:bommenonderzoek-wheermolen-oost', 'OID uses frozen slug' );
check( strpos( $v1['content']['body'], '**historisch vooronderzoek**' ) !== false, 'HTML->Markdown: strong' );
check( strpos( $v1['content']['body'], '## Wat er is gevonden' ) !== false, 'HTML->Markdown: heading' );
check( strpos( $v1['content']['body'], '[dossier](https://regiopurmerend.nl/dossier)' ) !== false, 'HTML->Markdown: link' );
check( strpos( $v1['content']['body'], '- Twee verdachte locaties' ) !== false, 'HTML->Markdown: list item' );
check( strpos( $v1['content']['headline'], "\u{2011}" ) !== false, 'entity in title decoded (non-breaking hyphen)' );

// unchanged re-save: must not grow the chain
sleep( 1 ); // force a different signed_at, proving the gate is content-based
$skip = ONP_Object::sign_post( $post );
check( $skip === null, 'unchanged re-save does not create a new Version' );

// v2: edit
$post->post_content .= '<p>Update: de gemeenteraad is geïnformeerd.</p>';
$vid2 = ONP_Object::sign_post( $post );
check( $vid2 !== null && $vid2 !== $vid1, 'edit signs v2 with a new VID' );
$v2 = json_decode( ONP_Object::current_version_json( $post ), true );
check( ( $v2['supersedes'] ?? '' ) === $vid1, 'v2 supersedes v1' );

// slug change after signing: identity must not move
$post->post_name = 'ander-slug-na-publicatie';
check( ONP_Object::oid( $post ) === $v1['oid'], 'slug change does not change the OID (frozen Local Identifier)' );

// v3: retraction
$vid3 = ONP_Object::sign_post( $post, true );
$v3   = json_decode( ONP_Object::current_version_json( $post ), true );
check( $vid3 !== null && ( $v3['lifecycle_state'] ?? '' ) === 'retracted', 'retraction signs a Tombstone-state Version' );
check( ( $v3['supersedes'] ?? '' ) === $vid2, 'v3 supersedes v2' );

if ( $fail > 0 ) {
	fwrite( STDERR, "SIMULATION FAILED ($fail)\n" );
	exit( 1 );
}

// ---- emit for TS cross-verification -----------------------------------
$versions = $GLOBALS['__postmeta'][42][ ONP_Object::META_VERSIONS ];
echo json_encode(
	array(
		'publisher_key_record' => ONP_Keys::publisher_key_record(),
		'versions'             => array_values( array_map( 'json_decode', $versions ) ),
	),
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
) . "\n";
