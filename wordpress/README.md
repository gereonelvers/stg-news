# WordPress side of the STG app

`mu-plugins/` is deployed to `wp-content/mu-plugins/` on stg-sz.net (Cloudways app `deqaekqajm`). Must-use plugins load automatically; there is nothing to activate.

## Deploy

```sh
rsync -av --delete mu-plugins/ master_qjjkhqaqyq@134.122.64.245:applications/deqaekqajm/public_html/wp-content/mu-plugins/
```

Lint before deploying: `php -l` on every file. A fatal error in an mu-plugin takes the whole site down.

## Endpoints (`/wp-json/stg/v1`)

| Method | Route | Purpose |
|---|---|---|
| GET | `/config` | Site name, tagline, links, comment settings, feature flags |
| GET | `/home` | One-request front page: breaking, hero, latest, section rails, most read (cached 5 min) |
| GET | `/posts` | Paged cards. `category`, `author`, `tag`, `search`, `include`, `exclude`, `orderby=date|views|comments|modified|relevance` |
| GET | `/posts/{id}` | Full post: rendered content, tags, related, comments_open |
| GET | `/posts/{id}/related` | More from the same Ressort |
| POST | `/posts/{id}/view` | Count a read (once per install and day, header `X-STG-Install`) – compatible with post-hit-counter |
| GET | `/categories` | Ressorts with colour/emoji/icon theme, counts and a cover image |
| GET | `/authors`, `/authors/{id}` | Team with bios and post counts |
| GET | `/pages/{slug}` | Pages such as `ueber-uns` |
| GET | `/search?q=` | Posts, authors and categories |
| GET | `/resolve?url=` | Turn a website URL into `{type, id}` for deep links |
| POST | `/devices` | Register an Expo push token (`token`, `platform`, `app_version`, `locale`, `categories`) |
| GET/DELETE | `/devices/{token}` | Inspect / unregister |
| DELETE | `/comments/{id}?token=` | Delete a comment written in the app. The token comes from the response that created it (`stg_delete_token`) and is a keyed hash, so nothing extra is stored |
| POST | `/comments/{id}/report` | Report a comment. One report per install; from the second report on, a published comment goes back into moderation and the editors get a mail |

## Comments

Posting still goes through WordPress core (`POST /wp/v2/comments`), anonymously. Everything else lives in `class-stg-app-comments.php`:

- Every new comment starts held, whatever the discussion settings say. Editors who may moderate are exempt.
- Authors on `STG_App_Config::EMAIL_DOMAIN` (`stg-segeberg.de`) get a verification mail; the link in it (`/?stg_verify=<id>&k=<token>`) publishes the comment immediately.
- Every other address waits for an editor in wp-admin and gets **no** mail. The public form draws roughly twenty bot comments a day, and mailing made-up addresses would bounce and wreck the relay's reputation.
- The moderation mail to the editors is skipped for comments that carry a link and did not come from the app, which is what bot spam looks like. App comments always notify.
- `comment-email-verify` used to do the verification and is now **deactivated**. Its plugin file had been edited by hand on the server to mail only `stg-segeberg.de` authors, which is why nobody else ever got a confirmation mail.

## Mail

`class-stg-app-mail.php` routes all WordPress mail through an authenticated SMTP relay (Brevo), because Cloudways provides no usable transport and the domain's SPF record (`-all`) does not cover the web server. Credentials are **not** in this repo; they are defined in `wp-config.php` on the server:

```php
define( 'STG_SMTP_HOST', 'smtp-relay.brevo.com' );
define( 'STG_SMTP_PORT', 587 );
define( 'STG_SMTP_USER', '…' );   // Brevo SMTP login
define( 'STG_SMTP_PASS', '…' );   // Brevo SMTP key
define( 'STG_MAIL_FROM', 'mail@stg-sz.net' );
```

Without those constants the class does nothing and WordPress keeps its default transport. Test with:

```sh
wp eval 'var_export( wp_mail( "you@example.com", "Test", "Test" ) );'
```

For delivery to actually land, `stg-sz.net` needs Brevo's DKIM record and `include:spf.brevo.com` in its SPF record.

## Push notifications

When a post is published, `stg_app_send_post_push` is scheduled 90 s later (gives editors time to un-publish a mistake), then all enabled devices whose category filter matches get a message through the Expo Push API. Posts in `datenschutz` never push; add `_stg_app_no_push` post meta to skip a single post.

WP-CLI helpers:

```sh
wp stg-app devices            # counts
wp stg-app preview <post_id>  # show the notification payload
wp stg-app push <post_id> [--force]
wp stg-app test "ExponentPushToken[...]" --title="Hallo" --body="Test"
wp stg-app flush              # clear the cached home feed
```

## Category theme

Colours, emoji and SF Symbol names per Ressort live in `class-stg-app-config.php`. They can be overridden without a deploy via the `stg_app_category_theme` option, e.g.

```sh
wp option update stg_app_category_theme '{"sport":{"color":"#0B7A3B","emoji":"🏆"}}' --format=json
```
