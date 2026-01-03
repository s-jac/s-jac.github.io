# s-jac.github.io

Personal portfolio website with blog, book reviews, and interactive projects.

**Live site:** [s-jac.github.io](https://s-jac.github.io)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Static Site Generator | [Jekyll](https://jekyllrb.com/) |
| Hosting | [GitHub Pages](https://pages.github.com/) |
| Analytics | [GoatCounter](https://www.goatcounter.com/) (privacy-friendly) |
| Comments | [Giscus](https://giscus.app/) (GitHub Discussions-powered) |
| Project Backends | [Render](https://render.com/) (Hobby tier) |

## Project Structure

```
├── _config.yml          # Jekyll configuration
├── _layouts/            # Page templates
├── _includes/           # Reusable components (head, footer, comments)
├── _posts/              # Blog posts (Markdown)
├── _reviews/            # Book reviews (Markdown collection)
├── assets/
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript
│   └── images/          # Images
├── projects/            # Interactive project pages
├── index.html           # Home page
├── blog.html            # Blog index
├── reviews.html         # Book reviews index
├── projects.html        # Projects index
└── feed.xml             # RSS feed (auto-generated)
```

## Running Locally

### Prerequisites

- Ruby 3.0+ (install via [rbenv](https://github.com/rbenv/rbenv))
- Bundler

### Setup

```bash
# Install dependencies
bundle install

# Start local server
bundle exec jekyll serve
```

Visit [http://localhost:4000](http://localhost:4000)

### Live reload (optional)

```bash
bundle exec jekyll serve --livereload
```

## Adding Content

### New Blog Post

Create a file in `_posts/` with the format `YYYY-MM-DD-title.md`:

```markdown
---
layout: post
title: "Your Post Title"
date: 2024-01-15
description: "A brief description for SEO and social sharing."
image: /assets/images/blog/your-image.png  # Optional
topic: Category
---

Your content in Markdown...
```

### New Book Review

Create a file in `_reviews/` with the format `book-title.md`:

```markdown
---
layout: review
title: "Book Title"
book_author: "Author Name"
rating: "★★★★★"
date: 2024-01-15
description: "Review of Book Title by Author Name"
---

Your review in Markdown...
```

## Deployment

Push to `main` branch → GitHub Pages automatically builds and deploys via Jekyll.

## External Services

- **GoatCounter** — View counts displayed on blog posts, privacy-friendly analytics
- **Giscus** — Comments powered by GitHub Discussions
- **Render** — Hosts backends for interactive projects (MsTriage, ratemybook)

## License

Content © Sam Jacobs. Code structure available for reference.
