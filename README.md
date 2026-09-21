# TXM-SM — SM Workload Net

A GitHub Pages dashboard for the Systems Management team. Each teammate gets one
page showing work that was detected across mail, Teams, meetings, Jira,
Freshservice and Confluence but has **no record behind it** — no CS issue, no
Freshservice ticket, no change record, or no current documentation.

**Live site:** https://texas-mutual-proving-ground.github.io/TXM-SM/

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Team rollup. Holds the roster and the per-seat counts in one `board-data` block. |
| `people/<handle>.html` | One board per teammate. Holds that person's own `board-data` block. |
| `people/_seat.html` | Template. Copy it, rename it to your handle, fill it in. |
| `assets/board.css` | The Modernist design system — Archivo, ink `#201e1d`, accent `#ec3013`, square corners. |
| `assets/board.js` | Shared renderer. Reads the `board-data` block on whichever page it is on. |
| `.github/workflows/pages.yml` | Deploys to Pages on every push to `main`. |
| `.nojekyll` | Serve the files as-is instead of running Jekyll. |

Nothing is fetched at runtime. Every page carries its own data inline, so a board
renders identically from a local file, from Pages, or from a preview — and each
teammate edits exactly one file, which keeps two people from colliding.

## One-time setup (owner)

1. Push to `main`.
2. **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.
3. Watch the **Actions** tab. First deploy takes about a minute.

That is the whole GitHub lesson: Pages built from a workflow rather than from a
branch, using the three official actions — `configure-pages`,
`upload-pages-artifact`, `deploy-pages` — with `pages: write` and `id-token: write`.

## Claim your seat

1. Copy `people/_seat.html` to `people/<your-handle>.html`.
2. Edit the `board-data` JSON at the bottom: your name, handle, role, coverage,
   and the three Claude pages you run (paste each artifact URL into `url`).
3. In `index.html`, replace one empty `{}` in `seats` with your entry:

```json
{
  "name": "Your Name",
  "github": "your-handle",
  "coverage": "What you cover",
  "page": "people/your-handle.html",
  "updated": "2026-09-17T08:00:00-05:00",
  "counts": { "tickets": 0, "changes": 0, "docs": 0 }
}
```

Commit. Your card shows up on the team board.

## The data shape

A gap item, in any of the three queues:

```json
{
  "title": "Short statement of the work",
  "found": "2026-09-16T16:35:00-05:00",
  "why": "Why this is a gap — what was committed to, and what record is missing.",
  "evidence": "Where it was seen: system · channel · date · the quoted line",
  "links": [{ "label": "Create in CS", "url": "https://txmutual.atlassian.net/browse/CS" }]
}
```

The three queues are fixed:

- **`tickets`** — work with no Jira CS issue *and* no Freshservice ticket. This
  includes Freshservice tasks assigned to the System Management group that sit on
  another group's ticket, so they never appear in the SM queue.
- **`changes`** — work that touches a production path and belongs at CMB before
  it ships.
- **`docs`** — Confluence runbooks and configs that no longer match what is running.

## How it gets updated

The twice-weekly pass rewrites the `board-data` block in one teammate's page and
the matching `counts` in `index.html`, then pushes. Actions republishes. Nothing
else in the file changes, so the diff is readable and reviewable.

Jeremiah's board currently carries **sample rows**, marked with a *Sample data*
pill, so the shape is visible before the first real pass runs. Clear them when
real detections land.
