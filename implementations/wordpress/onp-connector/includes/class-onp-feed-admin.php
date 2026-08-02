<?php
/**
 * ONP_Feed — ONP-1006 Section 4.4: carry the Object URL in the RSS
 * feed (<onp:object> module), on article pages (<link
 * rel="alternate">), and — v0.3 — the reader-facing <onp-badge> itself,
 * so a site running this plugin shows the verification seal without any
 * manual theme editing. Pointers and the badge script are all zero-trust:
 * the badge re-verifies everything client-side against the publisher's
 * own key, never taking the page's word for it.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ONP_Feed {

	/**
	 * The onp-badge version this plugin pins on the CDN. Bump alongside
	 * onp-badge releases; filterable for sites that self-host the script.
	 */
	const BADGE_VERSION = '0.2.0';

	public static function register(): void {
		add_action( 'rss2_ns', array( self::class, 'rss_namespace' ) );
		add_action( 'rss2_item', array( self::class, 'rss_item' ) );
		add_action( 'wp_head', array( self::class, 'html_link' ) );
		add_action( 'wp_enqueue_scripts', array( self::class, 'enqueue_badge_script' ) );
		add_filter( 'the_content', array( self::class, 'inject_badge' ) );
		add_shortcode( 'onp_badge', array( self::class, 'shortcode_badge' ) );
	}

	/**
	 * The <onp-badge> web component from jsDelivr, only on singular
	 * article pages that have a signed Object. Filterable
	 * (`onp_badge_script_url`) for sites that prefer to self-host it.
	 */
	public static function enqueue_badge_script(): void {
		if ( ! is_singular( 'post' ) ) {
			return;
		}
		$post = get_post();
		if ( ! $post || ! self::object_url( $post ) ) {
			return;
		}
		$default_url = 'https://cdn.jsdelivr.net/npm/onp-badge@' . self::BADGE_VERSION . '/dist/onp-badge.js';
		$url         = apply_filters( 'onp_badge_script_url', $default_url );
		wp_enqueue_script( 'onp-badge', $url, array(), self::BADGE_VERSION, true );
		// The widget is a native ES module; WordPress has no core API for
		// the module type attribute, so add it directly on the tag.
		add_filter( 'script_loader_tag', array( self::class, 'module_script_tag' ), 10, 2 );
	}

	public static function module_script_tag( string $tag, string $handle ): string {
		if ( $handle !== 'onp-badge' ) {
			return $tag;
		}
		return str_replace( ' src=', ' type="module" src=', $tag );
	}

	const OPT_PLACEMENT = 'onp_badge_placement';

	/**
	 * Where the badge is placed: 'before' the article, 'after' it, or
	 * 'manual' (the theme places <onp-badge> itself — see object_url()).
	 * Set on Settings -> Open News Protocol; `onp_badge_auto_inject`
	 * remains as a developer override on top of that choice.
	 */
	public static function placement(): string {
		$v = get_option( self::OPT_PLACEMENT, 'before' );
		return in_array( $v, array( 'before', 'after', 'manual' ), true ) ? $v : 'before';
	}

	/**
	 * Place the badge relative to a signed article's content per the
	 * admin setting (Settings -> Open News Protocol -> Reader badge).
	 */
	public static function inject_badge( string $content ): string {
		$placement = self::placement();
		$enabled   = apply_filters( 'onp_badge_auto_inject', $placement !== 'manual' );
		if ( ! $enabled || ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$post  = get_post();
		$badge = $post ? self::badge_html( $post ) : null;
		if ( ! $badge ) {
			return $content;
		}
		return $placement === 'after' ? $content . $badge : $badge . $content;
	}

	/**
	 * [onp_badge] — the easier alternative to 'manual' placement's
	 * ONP_Feed::object_url() PHP call: drop this shortcode into a page
	 * builder's shortcode widget (e.g. an Elementor template) instead
	 * of editing the theme. Renders nothing off a singular post or an
	 * unsigned one, so it's safe to leave in a template used elsewhere.
	 */
	public static function shortcode_badge(): string {
		if ( ! is_singular( 'post' ) ) {
			return '';
		}
		$post = get_post();
		return $post ? (string) self::badge_html( $post ) : '';
	}

	private static function badge_html( WP_Post $post ): ?string {
		$url = self::object_url( $post );
		if ( ! $url ) {
			return null;
		}
		return '<p class="onp-badge-wrap"><onp-badge object="' . esc_url( $url ) . '"></onp-badge></p>';
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
			add_submenu_page(
				'options-general.php',
				__( 'ONP Overview', 'onp' ),
				__( 'ONP Overview', 'onp' ),
				'manage_options',
				'onp-overview',
				array( self::class, 'render_overview' )
			);
		} );
		add_action( 'admin_post_onp_sign_archive', array( self::class, 'sign_archive' ) );
		add_action( 'admin_post_onp_save_badge_placement', array( self::class, 'save_badge_placement' ) );
		add_action( 'admin_post_onp_resign_post', array( self::class, 'resign_post' ) );
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

			<h2>Reader badge</h2>
			<p>The <code>&lt;onp-badge&gt;</code> widget re-verifies the article (and its photos, source documents and corrections) in the reader's own browser. Choose where it appears on signed articles.</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'onp_save_badge_placement' ); ?>
				<input type="hidden" name="action" value="onp_save_badge_placement">
				<?php $placement = ONP_Feed::placement(); ?>
				<p>
					<label style="display:block;margin:.3em 0"><input type="radio" name="onp_badge_placement" value="before" <?php checked( $placement, 'before' ); ?>> Before the article text (default)</label>
					<label style="display:block;margin:.3em 0"><input type="radio" name="onp_badge_placement" value="after" <?php checked( $placement, 'after' ); ?>> After the article text</label>
					<label style="display:block;margin:.3em 0"><input type="radio" name="onp_badge_placement" value="manual" <?php checked( $placement, 'manual' ); ?>> Not automatically — I'll place <code>&lt;onp-badge&gt;</code> in my theme myself</label>
				</p>
				<?php submit_button( 'Save badge placement' ); ?>
			</form>
			<p style="max-width:900px"><em>For "manual", the widget script is still loaded on signed articles. Easiest: place the <code>[onp_badge]</code> shortcode wherever you want it (e.g. an Elementor Shortcode widget in a single-post template) — it renders nothing on unsigned posts or non-article pages. For full control over the markup, get the Object URL for a post with <code>ONP_Feed::object_url( $post )</code> instead.</em></p>
		</div>
		<?php
	}

	/** Save the Reader badge placement setting. */
	public static function save_badge_placement(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'forbidden' );
		}
		check_admin_referer( 'onp_save_badge_placement' );
		$value = isset( $_POST['onp_badge_placement'] ) ? sanitize_text_field( wp_unslash( $_POST['onp_badge_placement'] ) ) : 'before';
		if ( ! in_array( $value, array( 'before', 'after', 'manual' ), true ) ) {
			$value = 'before';
		}
		update_option( ONP_Feed::OPT_PLACEMENT, $value );
		wp_safe_redirect( admin_url( 'options-general.php?page=onp-connector&badge_saved=1' ) );
		exit;
	}

	/**
	 * Per-post ONP status: signed or not, how many photos/source
	 * documents/corrections are attached, a link to the live Object, and
	 * a "Re-sign now" action. Bulk "Re-sign selected" is handled here,
	 * before the table renders, exactly like sign_archive()'s pattern.
	 */
	public static function render_overview(): void {
		if ( ! class_exists( 'ONP_Overview_Table' ) ) {
			require_once __DIR__ . '/class-onp-overview-table.php';
		}
		$table  = new ONP_Overview_Table();
		$action = $table->current_action();
		if ( $action === 'onp_resign' && ! empty( $_REQUEST['post'] ) && current_user_can( 'manage_options' ) ) {
			check_admin_referer( 'bulk-onp_posts' );
			foreach ( (array) wp_unslash( $_REQUEST['post'] ) as $id ) {
				$post = get_post( (int) $id );
				if ( $post ) {
					ONP_Object::sign_post( $post );
				}
			}
			echo '<div class="notice notice-success"><p>' . esc_html__( 'Re-signed the selected posts.', 'onp' ) . '</p></div>';
		}
		$table->prepare_items();
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'ONP Overview', 'onp' ); ?></h1>
			<p><?php esc_html_e( 'Signing status for published posts: whether each is signed, how many photos, source documents and corrections it carries, and a link to its live Object. Re-signing re-checks everything and updates the live Object.', 'onp' ); ?></p>
			<form method="post">
				<?php $table->display(); ?>
			</form>
		</div>
		<?php
	}

	/** Re-sign a single post on demand. */
	public static function resign_post(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'forbidden' );
		}
		$id = isset( $_GET['post'] ) ? (int) $_GET['post'] : 0;
		check_admin_referer( 'onp_resign_post_' . $id );
		$post = get_post( $id );
		if ( $post ) {
			ONP_Object::sign_post( $post );
		}
		wp_safe_redirect( admin_url( 'options-general.php?page=onp-overview&resigned=1' ) );
		exit;
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
