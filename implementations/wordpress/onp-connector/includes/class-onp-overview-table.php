<?php
/**
 * ONP_Overview_Table — per-post ONP status: signed or not, how many
 * photos/source documents/corrections are attached, and a link to the
 * live Object. Purely reads the already-stored current Version (never
 * signs anything on render — re-signing only happens through the
 * explicit "Re-sign" actions below).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

final class ONP_Overview_Table extends WP_List_Table {

	public function __construct() {
		parent::__construct( array(
			'singular' => 'onp_post',
			'plural'   => 'onp_posts',
			'ajax'     => false,
		) );
	}

	public function get_columns(): array {
		return array(
			'cb'          => '<input type="checkbox" />',
			'title'       => __( 'Post', 'onp' ),
			'onp_status'  => __( 'Status', 'onp' ),
			'media'       => __( 'Photos', 'onp' ),
			'sources'     => __( 'Documents', 'onp' ),
			'corrections' => __( 'Corrections', 'onp' ),
			'object'      => __( 'Object', 'onp' ),
		);
	}

	protected function get_bulk_actions(): array {
		return array( 'onp_resign' => __( 'Re-sign selected', 'onp' ) );
	}

	public function column_cb( $item ): string {
		return '<input type="checkbox" name="post[]" value="' . esc_attr( (string) $item['id'] ) . '">';
	}

	public function column_title( $item ): string {
		$edit  = get_edit_post_link( $item['id'] );
		$title = '<strong><a href="' . esc_url( (string) $edit ) . '">' . esc_html( $item['post_title'] ) . '</a></strong>';

		$resign_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=onp_resign_post&post=' . $item['id'] ),
			'onp_resign_post_' . $item['id']
		);
		$actions = array(
			'resign' => '<a href="' . esc_url( $resign_url ) . '">' . esc_html__( 'Re-sign now', 'onp' ) . '</a>',
		);
		return $title . $this->row_actions( $actions );
	}

	public function column_default( $item, $column_name ) {
		switch ( $column_name ) {
			case 'onp_status':
				return $item['signed']
					? '<span style="color:#14622b">&#10003; ' . esc_html__( 'Signed', 'onp' ) . '</span>'
					: '<span style="color:#9a1c1c">' . esc_html__( 'Not signed', 'onp' ) . '</span>';
			case 'media':
				return (string) $item['media'];
			case 'sources':
				return (string) $item['sources'];
			case 'corrections':
				return (string) $item['corrections'];
			case 'object':
				return $item['object_url']
					? '<a href="' . esc_url( $item['object_url'] ) . '" target="_blank" rel="noopener">' . esc_html__( 'View', 'onp' ) . '</a>'
					: '&#8212;';
			default:
				return '';
		}
	}

	public function prepare_items(): void {
		$per_page     = 20;
		$current_page = $this->get_pagenum();

		$query = new WP_Query( array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $current_page,
			'orderby'        => 'date',
			'order'          => 'DESC',
		) );

		$items = array();
		foreach ( $query->posts as $post ) {
			$json    = ONP_Object::current_version_json( $post );
			$signed  = $json !== null;
			$content = array();
			if ( $signed ) {
				$env     = json_decode( $json, true );
				$content = is_array( $env['content'] ?? null ) ? $env['content'] : array();
			}
			$items[] = array(
				'id'          => $post->ID,
				'post_title'  => get_the_title( $post ) ?: __( '(no title)', 'onp' ),
				'signed'      => $signed,
				'media'       => is_array( $content['media_refs'] ?? null ) ? count( $content['media_refs'] ) : 0,
				'sources'     => is_array( $content['source_refs'] ?? null ) ? count( $content['source_refs'] ) : 0,
				'corrections' => is_array( $content['corrections_ref'] ?? null ) ? count( $content['corrections_ref'] ) : 0,
				'object_url'  => $signed ? ONP_Feed::object_url( $post ) : null,
			);
		}

		$this->items            = $items;
		$this->_column_headers  = array( $this->get_columns(), array(), array() );
		$this->set_pagination_args( array(
			'total_items' => (int) $query->found_posts,
			'per_page'    => $per_page,
		) );
	}
}
