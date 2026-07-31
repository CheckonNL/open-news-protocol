<?php
/**
 * ONP_Media_Admin — the editor-facing surface for Companions:
 *   - a Photographer dropdown + "source document" checkbox in the
 *     media modal (attachment fields),
 *   - a Correction box on the post editor (type + note, consumed on the
 *     next signed update),
 *   - a Photographers management page (the profile registry: credit,
 *     licence, revenue split — signed into Rights/Payment Objects).
 *
 * No cryptography here; this only records the inputs the signing engine
 * (ONP_Media / ONP_Sources / ONP_Corrections / ONP_Profiles) reads.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Media_Admin {

	public static function register(): void {
		add_filter( 'attachment_fields_to_edit', array( self::class, 'attachment_fields' ), 10, 2 );
		add_filter( 'attachment_fields_to_save', array( self::class, 'save_attachment_fields' ), 10, 2 );

		add_action( 'add_meta_boxes', array( self::class, 'add_correction_box' ) );
		add_action( 'save_post_post', array( self::class, 'save_correction' ), 10, 1 );

		add_action( 'admin_menu', array( self::class, 'menu' ) );
		add_action( 'admin_post_onp_save_photographer', array( self::class, 'save_photographer' ) );
		add_action( 'admin_post_onp_delete_photographer', array( self::class, 'delete_photographer' ) );
	}

	// ---- Media modal: photographer + source document -------------------

	public static function attachment_fields( array $fields, WP_Post $post ): array {
		$is_image = strpos( (string) $post->post_mime_type, 'image/' ) === 0;

		if ( $is_image ) {
			$current = (string) get_post_meta( $post->ID, ONP_Media::META_PHOTOGRAPHER, true );
			$options = '<option value="">' . esc_html__( '— none / use EXIF or site default —', 'onp' ) . '</option>';
			foreach ( ONP_Profiles::all() as $key => $p ) {
				$label    = $p['label'] !== '' ? $p['label'] : $key;
				$options .= '<option value="' . esc_attr( $key ) . '"' . selected( $current, $key, false ) . '>' . esc_html( $label ) . '</option>';
			}
			$fields['onp_photographer'] = array(
				'label' => __( 'Photographer (ONP)', 'onp' ),
				'input' => 'html',
				'html'  => '<select name="attachments[' . $post->ID . '][onp_photographer]">' . $options . '</select>',
				'helps' => __( 'Signs this photo with the chosen credit, licence and revenue split.', 'onp' ),
			);
		} else {
			$checked = get_post_meta( $post->ID, ONP_Sources::META_IS_SOURCE, true ) === '1' ? ' checked' : '';
			$fields['onp_source_document'] = array(
				'label' => __( 'ONP source document', 'onp' ),
				'input' => 'html',
				'html'  => '<label><input type="checkbox" name="attachments[' . $post->ID . '][onp_source_document]" value="1"' . $checked . '> ' . esc_html__( 'Bind this file as a verifiable source document', 'onp' ) . '</label>',
			);
		}
		return $fields;
	}

	public static function save_attachment_fields( array $post, array $attachment ): array {
		if ( isset( $attachment['onp_photographer'] ) ) {
			$key = ONP_Profiles::sanitize_key( (string) $attachment['onp_photographer'] );
			if ( $attachment['onp_photographer'] === '' ) {
				delete_post_meta( $post['ID'], ONP_Media::META_PHOTOGRAPHER );
			} else {
				update_post_meta( $post['ID'], ONP_Media::META_PHOTOGRAPHER, $key );
			}
		}
		if ( array_key_exists( 'onp_source_document', $attachment ) ) {
			update_post_meta( $post['ID'], ONP_Sources::META_IS_SOURCE, $attachment['onp_source_document'] === '1' ? '1' : '' );
		}
		return $post;
	}

	// ---- Post editor: correction record --------------------------------

	public static function add_correction_box(): void {
		add_meta_box(
			'onp-correction',
			__( 'ONP correction', 'onp' ),
			array( self::class, 'render_correction_box' ),
			'post',
			'side',
			'default'
		);
	}

	public static function render_correction_box( WP_Post $post ): void {
		$signed = (bool) get_post_meta( $post->ID, ONP_Object::META_CURRENT_VID, true );
		wp_nonce_field( 'onp_correction', 'onp_correction_nonce' );
		if ( ! $signed ) {
			echo '<p>' . esc_html__( 'This post has no signed Version yet. Corrections apply to later edits.', 'onp' ) . '</p>';
			return;
		}
		echo '<p>' . esc_html__( 'Recording a correction on your next update signs a public, verifiable record linking the old and new Versions.', 'onp' ) . '</p>';
		echo '<p><label>' . esc_html__( 'Type', 'onp' ) . '<br><select name="onp_correction_type" style="width:100%">';
		foreach ( ONP_Corrections::TYPES as $t ) {
			echo '<option value="' . esc_attr( $t ) . '">' . esc_html( $t ) . '</option>';
		}
		echo '</select></label></p>';
		echo '<p><label>' . esc_html__( 'What changed', 'onp' ) . '<br><textarea name="onp_correction_note" rows="3" style="width:100%" placeholder="' . esc_attr__( 'Leave empty for no correction record.', 'onp' ) . '"></textarea></label></p>';
	}

	public static function save_correction( int $post_id ): void {
		if ( ! isset( $_POST['onp_correction_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['onp_correction_nonce'] ) ), 'onp_correction' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$note = isset( $_POST['onp_correction_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['onp_correction_note'] ) ) : '';
		$type = isset( $_POST['onp_correction_type'] ) ? sanitize_text_field( wp_unslash( $_POST['onp_correction_type'] ) ) : 'update';
		if ( trim( $note ) === '' ) {
			return; // no correction requested
		}
		update_post_meta( $post_id, ONP_Corrections::META_NOTE, $note );
		update_post_meta( $post_id, ONP_Corrections::META_TYPE, in_array( $type, ONP_Corrections::TYPES, true ) ? $type : 'update' );
	}

	// ---- Photographers management page ---------------------------------

	public static function menu(): void {
		add_submenu_page(
			'options-general.php',
			__( 'ONP Photographers', 'onp' ),
			__( 'ONP Photographers', 'onp' ),
			'manage_options',
			'onp-photographers',
			array( self::class, 'render_page' )
		);
	}

	public static function render_page(): void {
		$edit = isset( $_GET['key'] ) ? ONP_Profiles::sanitize_key( sanitize_text_field( wp_unslash( $_GET['key'] ) ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$p    = $edit !== '' ? ONP_Profiles::get( $edit ) : null;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'ONP Photographers', 'onp' ); ?></h1>
			<p><?php esc_html_e( 'Each profile is signed into a Rights and a Payment Object that every photo by this photographer references. Set once; the media modal only needs the name.', 'onp' ); ?></p>

			<table class="widefat" style="max-width:820px;margin-bottom:2em">
				<thead><tr><th><?php esc_html_e( 'Key', 'onp' ); ?></th><th><?php esc_html_e( 'Credit', 'onp' ); ?></th><th><?php esc_html_e( 'Licence', 'onp' ); ?></th><th><?php esc_html_e( 'Split', 'onp' ); ?></th><th></th></tr></thead>
				<tbody>
				<?php foreach ( ONP_Profiles::all() as $key => $prof ) : ?>
					<tr>
						<td><code><?php echo esc_html( $key ); ?></code></td>
						<td><?php echo esc_html( $prof['credit'] ); ?></td>
						<td><?php echo esc_html( $prof['license_identifier'] ); ?></td>
						<td><?php echo esc_html( implode( ' · ', array_map( function ( $s ) { return $s['recipient_ref'] . ' ' . $s['percentage'] . '%'; }, $prof['revenue_shares'] ) ) ); ?></td>
						<td>
							<a href="<?php echo esc_url( admin_url( 'options-general.php?page=onp-photographers&key=' . rawurlencode( $key ) ) ); ?>"><?php esc_html_e( 'Edit', 'onp' ); ?></a> |
							<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=onp_delete_photographer&key=' . rawurlencode( $key ) ), 'onp_delete_photographer' ) ); ?>" onclick="return confirm('Delete?')"><?php esc_html_e( 'Delete', 'onp' ); ?></a>
						</td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>

			<h2><?php echo $p ? esc_html__( 'Edit photographer', 'onp' ) : esc_html__( 'Add photographer', 'onp' ); ?></h2>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'onp_save_photographer' ); ?>
				<input type="hidden" name="action" value="onp_save_photographer">
				<table class="form-table" style="max-width:820px">
					<tr><th><?php esc_html_e( 'Key', 'onp' ); ?></th><td><input name="key" value="<?php echo esc_attr( $edit ); ?>" <?php echo $p ? 'readonly' : ''; ?> class="regular-text" placeholder="broca-media" required></td></tr>
					<tr><th><?php esc_html_e( 'Display name', 'onp' ); ?></th><td><input name="label" value="<?php echo esc_attr( $p['label'] ?? '' ); ?>" class="regular-text"></td></tr>
					<tr><th><?php esc_html_e( 'Credit', 'onp' ); ?></th><td><input name="credit" value="<?php echo esc_attr( $p['credit'] ?? '' ); ?>" class="regular-text" placeholder="© Broca Media"></td></tr>
					<tr><th><?php esc_html_e( 'Licence identifier', 'onp' ); ?></th><td><input name="license_identifier" value="<?php echo esc_attr( $p['license_identifier'] ?? 'editorial-use-only' ); ?>" class="regular-text"></td></tr>
					<tr><th><?php esc_html_e( 'Permissions', 'onp' ); ?></th><td>
						<label><input type="checkbox" name="redistribution_permitted" value="1" <?php checked( ! empty( $p['redistribution_permitted'] ) ); ?>> <?php esc_html_e( 'redistribution permitted', 'onp' ); ?></label><br>
						<label><input type="checkbox" name="attribution_required" value="1" <?php checked( ! isset( $p['attribution_required'] ) || ! empty( $p['attribution_required'] ) ); ?>> <?php esc_html_e( 'attribution required', 'onp' ); ?></label><br>
						<label><input type="checkbox" name="commercial_use_permitted" value="1" <?php checked( ! empty( $p['commercial_use_permitted'] ) ); ?>> <?php esc_html_e( 'commercial use permitted', 'onp' ); ?></label>
					</td></tr>
					<tr><th><?php esc_html_e( 'Payment model', 'onp' ); ?></th><td><input name="payment_model" value="<?php echo esc_attr( $p['payment_model'] ?? 'one-time' ); ?>" class="regular-text" placeholder="one-time"></td></tr>
					<tr><th><?php esc_html_e( 'Revenue split', 'onp' ); ?></th><td>
						<textarea name="revenue_shares" rows="3" class="large-text" placeholder="Broca Media|70&#10;Redactie|30"><?php
						$lines = array_map( function ( $s ) { return $s['recipient_ref'] . '|' . $s['percentage']; }, $p['revenue_shares'] ?? array() );
						echo esc_textarea( implode( "\n", $lines ) );
						?></textarea>
						<p class="description"><?php esc_html_e( 'One recipient per line: name|percentage', 'onp' ); ?></p>
					</td></tr>
				</table>
				<?php submit_button( $p ? __( 'Save photographer', 'onp' ) : __( 'Add photographer', 'onp' ) ); ?>
			</form>
		</div>
		<?php
	}

	public static function save_photographer(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'forbidden' );
		}
		check_admin_referer( 'onp_save_photographer' );

		$shares = array();
		foreach ( preg_split( '/\r?\n/', (string) wp_unslash( $_POST['revenue_shares'] ?? '' ) ) as $line ) {
			$parts = explode( '|', $line, 2 );
			if ( count( $parts ) === 2 && trim( $parts[0] ) !== '' ) {
				$shares[] = array( 'recipient_ref' => trim( $parts[0] ), 'percentage' => trim( $parts[1] ) );
			}
		}

		$key = ONP_Profiles::save(
			sanitize_text_field( wp_unslash( $_POST['key'] ?? '' ) ),
			array(
				'label'                    => sanitize_text_field( wp_unslash( $_POST['label'] ?? '' ) ),
				'credit'                   => sanitize_text_field( wp_unslash( $_POST['credit'] ?? '' ) ),
				'license_identifier'       => sanitize_text_field( wp_unslash( $_POST['license_identifier'] ?? '' ) ),
				'redistribution_permitted' => isset( $_POST['redistribution_permitted'] ),
				'attribution_required'     => isset( $_POST['attribution_required'] ),
				'commercial_use_permitted' => isset( $_POST['commercial_use_permitted'] ),
				'payment_model'            => sanitize_text_field( wp_unslash( $_POST['payment_model'] ?? 'one-time' ) ),
				'revenue_shares'           => $shares,
			)
		);
		// Sign this profile's Rights/Payment Objects immediately.
		ONP_Profiles::ensure_objects( $key );

		wp_safe_redirect( admin_url( 'options-general.php?page=onp-photographers&saved=1' ) );
		exit;
	}

	public static function delete_photographer(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'forbidden' );
		}
		check_admin_referer( 'onp_delete_photographer' );
		if ( isset( $_GET['key'] ) ) {
			ONP_Profiles::delete( ONP_Profiles::sanitize_key( sanitize_text_field( wp_unslash( $_GET['key'] ) ) ) );
		}
		wp_safe_redirect( admin_url( 'options-general.php?page=onp-photographers&deleted=1' ) );
		exit;
	}
}
