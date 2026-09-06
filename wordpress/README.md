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

Comments use WordPress core (`/wp/v2/comments`); anonymous posting is enabled, comments are moderated and e-mail-verified.

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
