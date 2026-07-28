<?php
/**
 * Plugin Name: Open News Protocol Connector
 * Plugin URI:  https://github.com/open-news-protocol/open-news-protocol
 * Description: Turns this WordPress site into an ONP publisher: signs posts as News Objects (ONP-1000–1003), serves the Publisher Key Record (ONP-0004) and Object/Version URLs with VID-as-ETag (ONP-1006), and carries Object URLs in the RSS feed and article pages.
 * Version:     0.2.0
 * Requires PHP: 7.4
 * Author:      Open News Protocol Working Group
 * License:     Apache-2.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/includes/class-onp-jcs.php';
require_once __DIR__ . '/includes/class-onp-crypto.php';
require_once __DIR__ . '/includes/class-onp-keys.php';
require_once __DIR__ . '/includes/class-onp-object.php';
require_once __DIR__ . '/includes/class-onp-endpoints.php';
require_once __DIR__ . '/includes/class-onp-feed-admin.php';

register_activation_hook( __FILE__, static function () {
	if ( ! function_exists( 'sodium_crypto_sign_keypair' ) ) {
		deactivate_plugins( plugin_basename( __FILE__ ) );
		wp_die( 'Open News Protocol Connector requires the sodium extension (bundled with PHP 7.2+).' );
	}
	ONP_Keys::ensure_keypair();
} );

ONP_Endpoints::register();
ONP_Feed::register();
ONP_Admin::register();

/**
 * Sign on publish and on updates to published posts; sign a
 * retraction Version when a published post is unpublished. The
 * lifecycle transition is the single signing trigger — save_post
 * alone would fire for autosaves and drafts.
 */
add_action( 'transition_post_status', static function ( string $new, string $old, WP_Post $post ) {
	if ( $post->post_type !== 'post' || wp_is_post_revision( $post ) || wp_is_post_autosave( $post ) ) {
		return;
	}
	if ( $new === 'publish' ) {
		// Publish or update-while-published: sign the current state.
		// Deferred to shutdown so terms/meta set later in the same
		// request (categories on first publish) are included.
		add_action( 'shutdown', static function () use ( $post ) {
			$fresh = get_post( $post->ID );
			if ( $fresh && $fresh->post_status === 'publish' ) {
				ONP_Object::sign_post( $fresh );
			}
		} );
	} elseif ( $old === 'publish' && $new !== 'publish' ) {
		// Unpublish (trash, draft, private): Tombstone state rides the
		// chain (ONP-1000 Section 4.5); the Object URL keeps serving
		// the retracted Version rather than 404ing (ONP-1006 Section
		// 4.2 rule 6).
		ONP_Object::sign_post( $post, true );
	}
}, 10, 3 );
