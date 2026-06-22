# User guide

LoreHub is a collaboration platform for [Lore](https://github.com/EpicGames/lore)
repositories — think GitHub/GitLab, but binary-first for game and media teams.

## Concepts

- **Organization** — owns a namespace, members, and repositories (`acme`).
- **Repository** — a Lore partition with revisions, branches, issues, and change requests (`acme/demo`).
- **Revision** — an immutable commit in Lore's content-addressed history.
- **Change request (CR)** — propose merging one branch into another, with review and CI gates.
- **Lock** — exclusive/review lock on a binary asset to prevent conflicting edits.

## Signing in

Create an account at `/register` (or `/login`). Enterprise teams can use SSO at
`/sso` (OIDC/SAML — see the admin docs). Sessions are cookie-based.

## Browsing a repository

From a repo home (`/{org}/{repo}`) the tab bar gives you Code, Revisions,
Branches, Issues, Change requests, Pipelines, Assets, Locks, Analytics, Settings.

- **Code** — file tree and viewer; binary assets route to the asset browser.
- **Assets** — texture/audio/model/video previews with deduplication stats and binary diffs.

## Issues

Filter by open/closed, search, and open new issues with labels and assignees.
Issue pages support comments and close/reopen. (`/{org}/{repo}/issues`)

## Change requests

Open a CR from a branch, request reviewers, and watch the **merge box** show the
pipeline + approval gates. Merging is blocked until gates pass.
(`/{org}/{repo}/cr`)

## Pushing with the Lore CLI

LoreHub hosts the repository; you push with the native `lore` CLI:

```bash
# mint a write token from the repo's Push page, then:
export LORE_SERVER_URL=http://localhost:8081
export LORE_TOKEN=<minted-token>
lore remote add lorehub "$LORE_SERVER_URL"
lore push lorehub main
```

See `/{org}/{repo}/push` for the exact commands for your repository.

## Locks, analytics, obliteration

- **Locks** — lock/unlock binary files; see who holds what.
- **Analytics** — repository size, dedup ratio, chunk reuse per asset.
- **Obliteration** — request permanent removal of content (e.g. an accidental
  secret) through a request → approval → execution workflow with an audit trail.

## Command palette

Press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> anywhere to jump to repos, issues, CRs,
and actions. Toggle light/dark with the header sun/moon button.
