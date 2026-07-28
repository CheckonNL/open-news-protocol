<?php
/**
 * ONP_Feed — ONP-1006 Section 4.4: carry the Object URL in the RSS
 * feed (<onp:object> module) and on article pages (<link
 * rel="alternate">). Pointers only; zero trust rides on them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Feed {

	public static function register(): void {
		add_action( 'rss2_ns', array( self::class, 'rss_namespace' ) );
		add_action( 'rss2_item', array( self::class, 'rss_item' ) );
		add_action( 'wp_head', array( self::class, 'html_link' ) );
	}

	public static function object_url( WP_Post $post ): ?string {
		$local_id = get_post_meta( $post->ID, ONP_Object::META_LOCAL_ID, true );
		if ( ! $local_id ) {
			return null;
		}
		return 'https://' . ONP_Keys::domain() . '/.well-known/onp/objects/' . $local_id;
	}

	/** ONP-1006 Section 4.4 rule 1: the feed module namespace. */
	public static function rss_namespace(): void {
		echo ' xmlns:onp="https://opennewsprotocol.org/ns/feed"';
	}

	public static function rss_item(): void {
		$post = get_post();
		$url  = $post ? self::object_url( $post ) : null;
		if ( $url ) {
			echo '<onp:object>' . esc_url( $url ) . '</onp:object>' . "\n";
		}
	}

	/** ONP-1006 Section 4.4 rule 3: discoverable from the human page. */
	public static function html_link(): void {
		if ( ! is_singular( 'post' ) ) {
			return;
		}
		$post = get_post();
		$url  = $post ? self::object_url( $post ) : null;
		if ( $url ) {
			echo '<link rel="alternate" type="application/onp+json" href="' . esc_url( $url ) . '">' . "\n";
		}
	}
}

/**
 * ONP_Admin — read-only status page (Settings -> Open News Protocol)
 * plus a bulk action to sign the existing archive in batches.
 */
final class ONP_Admin {

	public static function register(): void {
		add_action( 'admin_menu', static function () {
			add_options_page(
				'Open News Protocol',
				'Open News Protocol',
				'manage_options',
				'onp-connector',
				array( self::class, 'render' )
			);
		} );
		add_action( 'admin_post_onp_sign_archive', array( self::class, 'sign_archive' ) );
	}

	public static function render(): void {
		$domain = ONP_Keys::domain();
		$signed = (int) count( get_posts( array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_key'       => ONP_Object::META_CURRENT_VID,
			'fields'         => 'ids',
		) ) );
		$total  = (int) wp_count_posts( 'post' )->publish;
		?>
		<div class="wrap">
			<h1>Open News Protocol</h1>
			<table class="widefat" style="max-width:900px">
				<tbody>
				<tr><td><strong>Publisher domain</strong></td><td><code><?php echo esc_html( $domain ); ?></code></td></tr>
				<tr><td><strong>Publisher Key Record</strong></td><td><a href="https://<?php echo esc_attr( $domain ); ?>/.well-known/onp/publisher.json" target="_blank"><code>/.well-known/onp/publisher.json</code></a></td></tr>
				<tr><td><strong>Key ID</strong></td><td><code><?php echo esc_html( ONP_Keys::key_id() ); ?></code></td></tr>
				<tr><td><strong>Public key (Ed25519, base64url)</strong></td><td><code style="word-break:break-all"><?php echo esc_html( (string) ONP_Keys::public_key() ); ?></code></td></tr>
				<tr><td><strong>Signed posts</strong></td><td><?php echo esc_html( "$signed / $total published" ); ?></td></tr>
				</tbody>
			</table>
			<p>New and updated posts are signed automatically on publish. To sign the existing archive:</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'onp_sign_archive' ); ?>
				<input type="hidden" name="action" value="onp_sign_archive">
				<?php submit_button( 'Sign up to 100 unsigned posts' ); ?>
			</form>
			<p style="max-width:900px"><em>Key storage: the signing key currently lives in the options table. For stronger isolation, move it to <code>wp-config.php</code> as <code>define( 'ONP_SECRET_KEY', '&lt;base64&gt;' );</code> — it then takes precedence and can be removed from the database.</em></p>
		</div>
		<?php
	}

	/** Batched archive signing: 100 per invocation, oldest first. */
	public static function sign_archive(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'forbidden' );
		}
		check_admin_referer( 'onp_sign_archive' );
		$posts = get_posts( array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => 100,
			'orderby'        => 'date',
			'order'          => 'ASC',
			'meta_query'     => array(
				array(
					'key'     => ONP_Object::META_CURRENT_VID,
					'compare' => 'NOT EXISTS',
				),
			),
		) );
		foreach ( $posts as $post ) {
			ONP_Object::sign_post( $post );
		}
		wp_safe_redirect( admin_url( 'options-general.php?page=onp-connector&signed=' . count( $posts ) ) );
		exit;
	}
}
