# AGENTS.md — Coding Agent Guide

Personal portfolio site for Sam Jacobs. Jekyll static site hosted on GitHub Pages.

## Deployment

**Push to `main` → auto-deploy.** No CI step to trigger manually. GitHub Pages runs Jekyll on the server side.

Local preview: `bundle exec jekyll serve` (or `--livereload`). Requires Ruby 3.0+ and Bundler.

## Project Structure Quirks

### Collections

Three Jekyll collections beyond `site.posts`:

| Collection | Directory | URL pattern | Purpose |
|-----------|-----------|-------------|---------|
| reviews | `_reviews/` | `/reviews/:title/` | Book reviews |
| wip | `_wip/` | `/drafts/:title/` | Shareable drafts (live but unlisted) |

`_wip` posts are built and publicly accessible — they just don't appear in any index. Don't put truly private content there.

### `future: true`

Set in `_config.yml`. Future-dated posts **will** be built and published — this is intentional (e.g. scheduled/pre-written content).

### Blog Index — External Articles

`blog.html` merges `site.posts` with `_data/external_articles.yml` using a pipe-delimited string hack for Liquid sorting. If adding an external article to the blog listing, edit `_data/external_articles.yml`, not the template. Format:

```yaml
- title: "Article Title"
  url: "https://..."
  date: 2025-01-01
  topic: "Category"
  external: "hostname.com"
```

## Front Matter Reference

### Blog post (`_posts/YYYY-MM-DD-title.md`)

```yaml
---
layout: post        # required (also default via _config.yml)
title: "..."        # required
date: 2024-01-15    # required
description: "..."  # used for SEO meta + OG tags
topic: Category     # shown in blog listing; defaults to "Essay" if absent
image: /assets/images/blog/foo.png  # optional; enables OG image
comments: false     # optional; omit to enable Giscus (default: true for posts)
---
```

### Book review (`_reviews/book-title.md`)

```yaml
---
layout: review
title: "Book Title"
book_author: "Author Name"
rating: "★★★★★"
date: 2024-01-15
description: "..."
---
```

### Project pages (`projects/*.html`)

Project pages use extra front matter to load per-page assets:

```yaml
extra_css: /assets/css/my-project.css   # injected in <head>
extra_js:                                # injected before </body>
  - /assets/js/projects-data.js
  - /assets/js/my-project.js
body_data: 'data-project="my-project"'  # added to <body> tag
```

Check `_includes/head.html` and `_layouts/default.html` to see exactly how these are rendered.

## External Services

- **GoatCounter** — page view counts on blog posts, loaded via `assets/js/pageviews.js`. Don't strip the `<script>` tag from `_layouts/post.html`.
- **Giscus** — comment threads backed by GitHub Discussions (`_includes/comments.html`). Suppress per-post with `comments: false` in front matter.
- **Render (Hobby tier)** — backends for `mstriage` and `ratemybook` projects. These may cold-start slowly. Don't assume the backend is always warm.

## Gotchas

- **No `src/` directory** — there's a comment in `_config.yml` excluding an old `src/` folder. Ignore it; that folder is gone.
- **Permalink clashes** — posts use `/blog/:title/` (no date in URL). If two posts have the same slugified title, one will silently overwrite the other in the build.
- **`_wip` posts use `post` layout** but won't appear on `/blog/` — the listing page only iterates `site.posts`. They're reachable at `/drafts/:title/` if you know the URL.
- **No Node/npm** — everything is plain CSS/JS, no build pipeline. Don't introduce a bundler or framework without discussing it first.
- **`baseurl` is empty** — the site sits at the root of `s-jac.github.io`. Use `relative_url` filter for internal links, not hardcoded paths.
- **Markdown renderer is kramdown** — some CommonMark syntax (e.g. fenced code blocks with tildes) may behave differently. GitHub-flavored table syntax works fine.
