# API reference

Base URL: `http://localhost:8080` (configurable). All payloads are JSON.
Authentication uses an `HttpOnly` session cookie set by the auth endpoints.

> Status: this lists endpoints implemented today. The surface is expanding —
> see `PLAN.md` §30.2 for what's planned next (orgs/teams, CR detail, tree/blob,
> pipelines, pagination, OpenAPI).

## Conventions

- Errors return `{ "error": "<message>" }` with an appropriate HTTP status
  (`400` bad request, `401` unauthorized, `404` not found, `409` conflict).
- Repository-scoped routes are keyed by **org name + repo name**.

## Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe → `{"status":"ok"}` |

## Auth

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `{username,email,display_name,password}` | Create account, set session cookie. Password ≥ 12 chars. |
| POST | `/api/v1/auth/login` | `{login,password}` | `login` is username or email. Sets session cookie. |
| POST | `/api/v1/auth/logout` | — | Clears the session. |
| GET | `/api/v1/auth/me` | — | Current user (requires session cookie). |

## Repositories

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/repositories` | List repositories |
| POST | `/api/v1/repositories` | Create a repository (provisions a Lore partition) |
| GET | `/api/v1/repositories/{id}` | Get a repository |
| POST | `/api/v1/repositories/{id}/lore-token` | Mint a short-lived, partition-scoped Lore JWT |

## Repository content (org/repo keyed)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/orgs/{org}/repos/{repo}/issues` | List issues (`?state=open\|closed\|all`) |
| POST | `/api/v1/orgs/{org}/repos/{repo}/issues` | Create an issue (`{title,body}`) |
| GET | `/api/v1/orgs/{org}/repos/{repo}/issues/{number}` | Issue detail with comments |
| PATCH | `/api/v1/orgs/{org}/repos/{repo}/issues/{number}` | Update issue state (`{state:"open"\|"closed"}`) |
| POST | `/api/v1/orgs/{org}/repos/{repo}/issues/{number}/comments` | Add a comment (`{body}`) |
| GET | `/api/v1/orgs/{org}/repos/{repo}/change-requests` | List change requests (`?state=…`); includes labels + approval counts |
| POST | `/api/v1/orgs/{org}/repos/{repo}/change-requests` | Open a change request (`{title,body,source_branch,target_branch}`) |
| GET | `/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}` | CR detail — reviews, comments, grouped inline threads, reviewers, labels, linked issues, revisions, approval gate |
| POST | `/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/reviews` | Add a review (`{state:"approved"\|"commented"\|"requested",body}`) |
| POST | `/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/comments` | Add a CR comment; inline when `{file_path,line}` are set |
| POST | `/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/merge` | Merge (blocked until `required_approvals` met) |
| GET | `/api/v1/orgs/{org}/repos/{repo}/branches` | List branches |
| GET | `/api/v1/orgs/{org}/repos/{repo}/locks` | List file locks |
| GET | `/api/v1/orgs/{org}/repos/{repo}/labels` | List labels |

## Pipelines

| Method | Path | Description |
| --- | --- | --- |
| GET (WS) | `/api/v1/pipelines/{run_id}/logs/ws` | WebSocket log stream (sample stream today) |

## Example

```bash
# register and capture the session cookie
curl -c jar.txt -X POST localhost:8080/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"username":"rin","email":"rin@studio.dev","display_name":"Rin","password":"supersecret123"}'

# authenticated call
curl -b jar.txt localhost:8080/api/v1/auth/me
```
