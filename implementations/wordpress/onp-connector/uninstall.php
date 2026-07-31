<?php
/**
 * Runs once when the plugin is deleted (not merely deactivated) from
 * this site's Plugins page. Removes the signing key, all plugin
 * options, the Companion registry table, and the post/attachment meta
 * this plugin wrote. $wpdb->prefix is already this site's own prefix,
 * so on a multisite install this only touches the site being
 * uninstalled from — see class-onp-registry.php for the same pattern.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

$options = array(
	'onp_secret_key',
	'onp_public_key',
	'onp_key_id',
	'onp_key_created',
	'onp_badge_placement',
	'onp_photographers',
	'onp_registry_version',
);
foreach ( $options as $option ) {
	delete_option( $option );
}

$meta_keys = array(
	'_onp_local_id',
	'_onp_versions',
	'_onp_current_vid',
	'_onp_content_hash',
	'_onp_source_document',
	'_onp_source_origin_url',
	'_onp_photographer',
	'_onp_corrections',
	'_onp_correction_type',
	'_onp_correction_note',
);
foreach ( $meta_keys as $meta_key ) {
	$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $meta_key ) );
}

$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}onp_objects" );
