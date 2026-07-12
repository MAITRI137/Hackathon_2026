# Development Handoff — Hackathon Planning Module and Reviewer README

**Prepared:** 11 July 2026  
**Target environment:** Codex or another repository-aware agentic coding platform  
**Repository:** `MAITRI137/Hackathon_2026`  
**Primary branch:** `main`  
**Team:** Maitri (team leader) and Vyas Devgna (team member)

---

## 1. Mission

Continue development of two separate deliverables without mixing their audiences:

1. **Private planning module:** a two-person, real-time hackathon war room that runs on the team leader's machine and is shared over the team's Tailscale Tailnet.
2. **Public repository README:** a concise, reviewer-facing document for the actual hackathon submission. It must describe the submitted solution only and must not expose internal planning material.

The problem statement has not yet been selected. The planning module must therefore remain problem-agnostic, while the public README must be easy to convert quickly after the problem is chosen.

---

## 2. Non-negotiable boundaries

- The war room is **private operational tooling**, not part of the judged solution.
- Do not deploy the war room publicly.
- Do not add Firebase, Supabase, hosted databases, npm packages, or external runtime dependencies unless explicitly requested.
- Use the existing dependency-free Python server and browser client.
- The two users will access the app through a trusted Tailnet.
- The server currently has no authentication. Treat the Tailnet as the security boundary.
- Do not store passwords, access tokens, private keys, or confidential material in war-room state.
- The public repository should contain only reviewer-relevant source, documentation, tests, and evidence.
- Do not include evaluator profiling, personal research, private strategy notes, or internal coordination logs in the public README.
- Preserve meaningful individual Git authorship for both teammates.

---

## 3. Repository snapshot

Expected working directory:

```text
Hackathon_2026/
├── .git/
├── .gitignore
├── README.md
├── war-room.html
└── local-ops/
    ├── README.md
    ├── war-room.html
    └── war_room_server.py
```

### Current file roles

| File | Intended role | Status |
|---|---|---|
| `README.md` | Public reviewer-facing bootstrap README | Active, must be evolved after problem selection |
| `.gitignore` | Keeps local tooling, state, secrets, and generated files out of Git | Currently inconsistent between index and working tree; fix first |
| `local-ops/war-room.html` | Current Tailnet planning client | Canonical planning UI |
| `local-ops/war_room_server.py` | Dependency-free shared-state HTTP server | Canonical backend |
| `local-ops/README.md` | Private runbook | Active |
| `war-room.html` | Older, larger Firebase/GitHub Pages version | Legacy; do not commit as-is |

### Current Git state observed during handoff

```text
## No commits yet on main
AM .gitignore
A  README.md
?? local-ops/
?? war-room.html
```

Remote:

```text
origin  https://github.com/MAITRI137/Hackathon_2026.git
```

### Critical Git inconsistency

The **staged** `.gitignore` includes:

```gitignore
local-ops/
__pycache__/
*.py[cod]
```

The **working-tree** `.gitignore` currently removes those entries and adds old Firebase-related patterns. This means:

- `git add .` can accidentally stage `local-ops/`;
- private war-room files can become reviewer-visible;
- Python cache and local state may be exposed.

**First action for the next agent:** restore a correct working-tree `.gitignore` before any broad staging command.

Recommended minimum:

```gitignore
# Private coordination tooling and state
local-ops/

# Secrets and environment
.env
.env.*
!.env.example

# Dependencies and generated output
node_modules/
dist/
build/
coverage/
__pycache__/
*.py[cod]

# Local data and logs
*.log
*.db
*.sqlite
*.sqlite3

# Editors and OS
.vscode/
.idea/
.DS_Store
Thumbs.db
```

Do not run `git add .` until `git status --ignored` confirms `local-ops/` is ignored.

---

## 4. Canonical architecture

### Client

`local-ops/war-room.html`

- Single HTML file with embedded CSS and JavaScript.
- No build step.
- No package manager.
- Uses `fetch`, `localStorage`, DOM APIs, and the public GitHub REST API.
- Polls the local server for shared state.
- Maintains a local cache for temporary resilience.
- Escapes user-rendered text before injecting HTML.

### Server

`local-ops/war_room_server.py`

- Python standard library only.
- Uses `ThreadingHTTPServer` and `BaseHTTPRequestHandler`.
- Persists shared state atomically to `local-ops/.war-room-state.json`.
- Uses an in-process `RLock` around shared state mutations.
- Serves the client HTML and a small JSON API.
- Intended to bind to the leader's Tailscale IPv4 address.

### Runtime topology

```text
Maitri browser  ─┐
                 ├── Tailnet HTTP ──> leader machine:8765
Vyas browser    ─┘                    ├── war-room.html
                                      ├── JSON API
                                      └── .war-room-state.json
```

### Start command

```bash
cd Hackathon_2026/local-ops

tailscale ip -4

python3 war_room_server.py \
  --host <LEADER_TAILSCALE_IP> \
  --port 8765
```

Both users open:

```text
http://<LEADER_TAILSCALE_IP>:8765
```

Windows fallback:

```powershell
py war_room_server.py --host <LEADER_TAILSCALE_IP> --port 8765
```

---

## 5. Current API contract

### `GET /api/health`

Returns:

```json
{
  "ok": true,
  "revision": 0,
  "serverTime": 1783765442891
}
```

Purpose:

- connectivity check;
- server clock reference;
- current revision visibility.

### `GET /api/state?since=<revision>`

When changed:

```json
{
  "ok": true,
  "revision": 4,
  "state": { "...": "shared data" },
  "serverTime": 1783765442891
}
```

When unchanged:

```json
{
  "ok": true,
  "revision": 4,
  "unchanged": true,
  "serverTime": 1783765442891
}
```

### `POST /api/patch`

Request:

```json
{
  "path": "tasks/3dcd...",
  "value": {
    "id": "3dcd...",
    "title": "Implement golden path",
    "status": "doing"
  },
  "actor": "Vyas Devgna",
  "activity": "Added task: Implement golden path"
}
```

Behavior:

- applies one path-level mutation;
- `null` deletes the target key;
- increments global revision;
- optionally writes an activity record;
- persists state atomically.

### `POST /api/presence`

Request:

```json
{
  "clientId": "browser-generated-id",
  "member": "vyas",
  "name": "Vyas Devgna"
}
```

Allowed member IDs:

```text
maitri
vyas
```

---

## 6. Shared state model

The server owns a wrapper object:

```json
{
  "revision": 0,
  "updatedAt": 0,
  "data": {}
}
```

The client consumes `data` as its application state.

### Main state branches

```text
selection
  chosenId
  candidates

framing
  problem
  user
  pain
  solution
  goldenPath
  metric
  p0
  notDoing
  dataPlan
  fallback

tasks
quality
commits

repo
  owner
  name
  branch
  handles
  lastChecked
  public
  detected

messages
risks
decisions

pitch
  hook
  problem
  demo
  proof
  architecture
  close

rehearsals
presence
activity
```

### Event constants

The current code assumes:

```text
Event start:       2026-07-12 09:00 IST
Repository cutoff: 2026-07-12 10:00 IST
Event end:         2026-07-12 17:00 IST
```

Avoid duplicating these timestamps in multiple client/server locations during further development. A preferred refactor is to read event timing from server state and render from one source of truth.

---

## 7. Current planning-module features

### Dashboard

- Event phase timeline.
- Round countdown.
- Task, quality, commit, and presence metrics.
- Team presence via heartbeat.
- Shared dispatch messages.
- Shared activity trail.
- Light/dark theme.
- JSON export.

### Problem selection

- Add multiple candidate statements.
- Score each candidate on:
  - feasibility;
  - demo strength;
  - impact;
  - data suitability;
  - scope control;
  - distinctiveness.
- Weighted score.
- Leader selection marker.

### Framing and scope

- Exact problem statement.
- Primary user.
- User pain.
- Solution thesis.
- Golden path.
- success metric.
- P0 scope.
- Explicit exclusions.
- Data plan.
- Fallback strategy.

### Shared execution board

- Backlog, in progress, review/test, and done states.
- Owner assignment: Maitri, Vyas, or both.
- Priority.
- Acceptance condition.
- Add, move, reopen, and delete actions.

### Evidence and repository tracking

- Quality-gate checklist.
- Repository owner/name/branch configuration.
- Teammate GitHub handle mapping.
- Public GitHub repository check.
- Commit detection by hour and teammate.
- Manual hourly commit verification.

### Control and review preparation

- Risk register.
- Decision log.
- Three-minute pitch fields.
- Rehearsal log.

---

## 8. Legacy client audit

The root-level `war-room.html` is an older Firebase/GitHub Pages version. It is not the desired deployment architecture, but it contains useful features that may be worth selectively porting before deletion.

### Useful features present in the legacy file

- Drag-and-drop Kanban interactions.
- Commit-message builder.
- Recent-commit list.
- Safe hourly integration loop.
- Browser commit-boundary notifications.
- Focus timer.
- Snapshot import in addition to export.
- Demo URL and fallback URL fields.
- Moderator question bank.
- More detailed quality-group organization.
- Clear-activity control.
- Extra demo and technical pitch prompts.

### Features that must not be carried forward

- Firebase configuration UI.
- Firebase SDK scripts.
- Firebase anonymous authentication.
- GitHub Pages deployment instructions for the war room.
- Public room identifiers.
- Evaluator-personalization or reviewer-profiling content.

### Recommended disposition

1. Compare legacy and canonical clients feature by feature.
2. Port only useful local/Tailnet-compatible features.
3. Verify parity.
4. Delete the root `war-room.html` from the final repository working tree.
5. Keep the planning module entirely under ignored `local-ops/`.

---

## 9. Priority backlog for the next agent

### P0 — repository safety and operability

1. **Fix `.gitignore` working tree.**
   - Ensure `local-ops/` is ignored.
   - Ensure `.war-room-state.json`, `__pycache__`, and Python bytecode remain untracked.
   - Remove stale Firebase-only patterns unless genuinely needed by the judged solution.

2. **Resolve duplicate war-room files.**
   - Treat `local-ops/war-room.html` as canonical.
   - Perform a selective feature-parity audit against root `war-room.html`.
   - Remove the root copy after useful local-compatible features are ported.

3. **Add a reliable local smoke test.**
   - Start the server on `127.0.0.1` using a test port.
   - Verify `/`, `/api/health`, `/api/state`, `/api/patch`, and `/api/presence`.
   - Verify persistence after server restart.
   - Clean up test state.

4. **Make configuration centralized.**
   - Avoid hard-coded event timestamps in both Python and JavaScript.
   - Add a small server-delivered configuration object or derive client values from state.
   - Keep team member names and GitHub handles editable.

5. **Protect against accidental data loss.**
   - Add snapshot import with schema validation.
   - Add server-side backup rotation before destructive import/reset.
   - Add a visible "last synchronized" timestamp.

### P1 — collaboration quality

1. **Optimistic update reconciliation.**
   - Current client updates local state before server confirmation.
   - On failure, the UI leaves the local optimistic value in cache.
   - Add pending-write indicators, retry, and conflict recovery.

2. **Revision conflict handling.**
   - Current patches do not include an expected base revision.
   - Simultaneous writes to the same path are last-write-wins with no warning.
   - Add optional `baseRevision` and return HTTP `409` on stale writes.
   - Allow the client to refresh and reapply deliberately.

3. **Safer patch validation.**
   - Add path allow-listing or top-level branch validation.
   - Enforce maximum string lengths server-side.
   - Reject non-finite numbers and structurally excessive objects.
   - Limit object depth and number of keys.

4. **Operational controls.**
   - Add authenticated or secret-token reset only if needed.
   - Add export/import/reset controls with explicit confirmation.
   - Add state-file backup status and disk-write error visibility.

5. **Better board interaction.**
   - Port drag-and-drop from the legacy file.
   - Keep keyboard-accessible move controls.
   - Add edit support for existing tasks.
   - Add blocked state or blocker field.
   - Enforce one major "doing" task per person as a warning, not a hard block.

6. **Improved commit tracking.**
   - Port recent commits and commit-message builder.
   - Display GitHub API rate-limit or error state clearly.
   - Support commit author matching by GitHub login and commit email/name aliases.
   - Avoid claiming a contribution unless detection is reliable or manually verified.

### P2 — event usability and polish

1. Browser notification near hourly commit boundaries.
2. Focus timer.
3. Demo links and fallback links.
4. Moderator question bank.
5. Better mobile navigation.
6. Reduced-motion support.
7. More complete keyboard navigation.
8. Accessible status announcements using `aria-live`.
9. Search and filters for tasks, risks, decisions, and activity.
10. Automatic stale-task and unresolved-risk warnings.
11. CSV or Markdown export for the final contribution summary.
12. Optional local-only audit log file separate from mutable state.

---

## 10. Known technical risks

### No authentication

The server accepts state-changing requests from any client that can reach the port. This is acceptable only on a trusted Tailnet for the short event window.

Do not expose the port through public forwarding, Funnel, a public reverse proxy, or an internet-facing firewall rule.

### No CSRF protection

Because the service is unauthenticated and intended for a private network, CSRF is not currently addressed. A hostile webpage opened by a team member may be able to send requests to a reachable local server, depending on browser behavior and request shape.

A modest hardening option is to require a random shared room token in a custom header and serve it only through a startup-generated URL or local configuration. Do not over-engineer this before the core workflow is stable.

### GitHub API limitations

The browser uses unauthenticated public GitHub API requests. This is subject to rate limits and network availability. It must remain an optional verification aid, not a single point of failure.

### Optimistic writes

The client mutates local state before server confirmation. A failed request can create a temporary local/server divergence until the next poll. This should be made explicit in the UI and corrected through reconciliation.

### Global state granularity

A single global revision is simple but causes all clients to fetch the full state after any change. This is acceptable for two users and small data, but the implementation should avoid unbounded growth.

### Activity and presence growth

- Activity is capped server-side at 200 records.
- Presence stale cleanup uses a 120-second server cutoff.
- Client online display uses a 35-second cutoff.

Keep these semantics documented and consistent.

---

## 11. Planning-module acceptance criteria

A development iteration is complete only when all of the following pass:

### Connectivity

- Server starts with Python 3 and no third-party installation.
- Both Tailnet clients can open the page.
- Both clients show connected status.
- Presence updates within a reasonable interval.

### Synchronization

- A change on client A appears on client B without reload.
- A change on client B appears on client A without reload.
- Refreshing either browser retains server state.
- Restarting the server retains persisted state.
- Failed writes are visible and recoverable.

### Data safety

- State writes are atomic.
- Malformed JSON receives `400`.
- Oversized request bodies are rejected.
- Invalid patch paths are rejected.
- Import rejects unsupported or malformed snapshots.
- Reset requires explicit confirmation.

### UX

- The full core workflow is usable at laptop width.
- Core actions are usable on a mobile viewport.
- Keyboard-only users can create and move tasks.
- Status is not communicated by color alone.
- User input is rendered safely.

### Repository safety

- `git status --ignored` shows `local-ops/` as ignored.
- No local state, planning logs, tokens, or war-room code is staged.
- The public README contains no internal planning content.

---

## 12. Public README workstream

The current `README.md` is intentionally a pre-round bootstrap. Do not overfill it before the problem statement is known.

### Current strengths

- Clear team table.
- Clear repository intent.
- Appropriate commit-message guidance.
- Reviewer-oriented final structure.
- No internal war-room details.

### Required conversion after problem selection

Replace the bootstrap content with the following reviewer-facing structure:

```markdown
# <Product Name>

> <One-sentence value proposition>

## Problem
- Exact selected statement
- Target user
- Current pain
- Why the problem matters

## Solution
- Product thesis
- Golden-path workflow
- What is intentionally out of scope

## Demo
- Live/demo URL if available
- Demo credentials or seeded workflow if safe
- Short video or GIF
- Fallback demonstration steps

## Key Features
- Feature name — user outcome
- Feature name — user outcome
- Feature name — user outcome

## Architecture
- Diagram
- Components
- Data flow
- Persistence
- External integrations
- Key technology choices and why

## Setup
- Prerequisites
- Clone
- Environment configuration
- Install
- Run
- Test

## Validation and Reliability
- Input validation
- Loading/empty/error/retry states
- Offline or dependency-failure behavior
- Security boundaries
- Critical tests

## Trade-offs
- What was simplified
- What would be added next
- Why the chosen scope was appropriate for the round

## Team Contributions
| Member | Contributions | Representative commits |

## Screenshots

## License / Acknowledgements
```

### README quality rules

- Lead with the user problem and the visible outcome, not the technology stack.
- Keep the first screen of the README immediately understandable.
- Include exact reproducible commands.
- Do not claim tests, security properties, performance, live data, or deployment unless verified.
- Prefer one architecture diagram over several paragraphs of vague architecture prose.
- Use screenshots that demonstrate the golden path and key states.
- Include realistic seeded data or a deterministic demo setup.
- Keep badges limited and relevant.
- Avoid excessive animation, decorative HTML, and marketing claims.
- Document failure handling and known limitations directly.
- Provide a contribution table only after checking actual Git history.

### README placeholders that should be easy to fill during the round

Create a private checklist or local template for:

- product name;
- selected statement text;
- target user;
- one-line solution;
- P0 workflow;
- architecture summary;
- setup commands;
- test commands;
- demo URL;
- screenshot paths;
- known limitations;
- contribution mapping.

Do not commit fake placeholders that make the public repository look unfinished once the final product exists.

---

## 13. Recommended tests

### Server unit tests

Use Python standard library `unittest` unless the judged solution already introduces a test stack.

Test at minimum:

- `initial_state()` schema.
- valid and invalid `set_path()` behavior.
- prototype-pollution key rejection.
- delete-by-null behavior.
- stale presence cleanup.
- activity cap.
- corrupted state recovery.
- atomic save behavior.
- request-size rejection.
- malformed JSON rejection.
- invalid presence member rejection.
- unknown route behavior.

### Integration smoke test

A script should:

1. Start the server on an ephemeral or chosen local test port.
2. Wait for `/api/health`.
3. Read state.
4. Patch a unique test path.
5. Read and verify the change.
6. Post presence.
7. Stop the server.
8. Restart it.
9. Verify persistence.
10. Delete test state or restore backup.

### Client verification

Use manual browser checks or a lightweight local automation tool available in the agent environment.

Verify:

- initial render with no state file;
- reconnect after server restart;
- simultaneous edits from two browser contexts;
- local cache behavior while disconnected;
- export/import round trip;
- task creation/edit/move/delete;
- score calculation;
- commit check failure and success states;
- responsive layout;
- dark mode;
- keyboard navigation;
- XSS payloads rendered as text.

---

## 14. Suggested implementation sequence

### Phase 1 — clean repository boundary

1. Inspect `git diff`, `git diff --cached`, and `git status --ignored`.
2. Correct `.gitignore`.
3. Confirm `local-ops/` is ignored.
4. Do not alter staged public files accidentally.
5. Preserve a backup before deleting the root legacy client.

### Phase 2 — establish tests

1. Add server unit tests under `local-ops/tests/` or another ignored local path.
2. Add a smoke-test script.
3. Run baseline tests before behavior changes.

### Phase 3 — consolidate planning module

1. Centralize event and team configuration.
2. Add import and backup handling.
3. Add write reconciliation and conflict behavior.
4. Port selected legacy features.
5. Remove legacy root file.

### Phase 4 — polish and accessibility

1. Improve board editing and drag-and-drop.
2. Improve mobile behavior.
3. Add keyboard and `aria-live` support.
4. Add visible sync timestamps and pending indicators.

### Phase 5 — README readiness

1. Keep bootstrap README concise until statement selection.
2. Prepare local, uncommitted README template snippets.
3. After selection, rewrite README from actual implementation evidence.
4. Verify clean-clone setup before finalizing documentation.

---

## 15. Git workflow guidance

Before making changes:

```bash
cd Hackathon_2026

git status --short --branch
git diff
git diff --cached
git status --ignored
```

Do not assume the index and working tree match.

Recommended focused commits:

```text
[FIX] repo: keep private war-room files out of Git
[TEST] ops: add local server smoke coverage
[IMP] ops: reconcile concurrent shared-state writes
[ADD] ops: support validated snapshot restore
[IMP] ops: improve keyboard-accessible task workflow
[DOC] readme: document selected problem and reproducible setup
```

Avoid generic messages such as:

```text
update files
changes
final fix
hackathon work
```

Each teammate must commit their own work using their own Git identity.

---

## 16. Definition of done for this handoff workstream

The next agent should stop and report completion when:

- `.gitignore` safely excludes `local-ops/` in both index and working tree.
- The root legacy `war-room.html` has been audited and removed or explicitly retained with a documented reason.
- The Tailnet war room starts and passes a repeatable smoke test.
- Two browser sessions synchronize all core entities.
- Data survives restart.
- Failed writes and disconnections are visible.
- Snapshot export and validated restore work.
- The planning UI remains dependency-free.
- The public README remains free of internal planning details.
- A clean `git status` contains only intentionally public submission files.
- No claims in the README exceed what the repository demonstrates.

---

## 17. Recommended Codex kickoff prompt

Paste the following into the agent after opening the repository:

```text
Read CODEX_HANDOFF.md completely before editing any file.

Your task is to continue the private Tailnet planning module under local-ops/ and maintain the public reviewer-facing README.md. Treat local-ops/war-room.html and local-ops/war_room_server.py as the canonical planning implementation. The root war-room.html is a legacy Firebase/GitHub Pages version that must only be mined for useful local-compatible features and then removed.

First, inspect git status, staged diff, unstaged diff, ignored files, and the repository tree. There is a known mismatch between the staged and working-tree .gitignore. Do not run git add . and do not expose local-ops/ to Git. Fix the repository boundary first.

Then establish a baseline smoke test for the Python server and API before changing behavior. Preserve the dependency-free standard-library architecture. Prioritize state safety, two-client synchronization, conflict recovery, validated snapshot restore, task-board usability, and clear offline/error status. Do not add Firebase, public deployment, external databases, or evaluator-personalization content.

Keep README.md concise until the problem statement is selected. Any README change must be reviewer-facing, reproducible, evidence-based, and free of internal coordination details.

Work in small, reviewable changes. After each change, run relevant tests and report exact files changed, commands run, test results, risks, and remaining work. Never fabricate test results, repository state, screenshots, contribution evidence, or deployment claims.
```

---

## 18. Final cautions for an autonomous coding agent

- Do not overwrite the user's Git index blindly.
- Do not commit or push without explicit instruction.
- Do not delete the legacy file until useful-feature comparison is complete.
- Do not convert the private tool into part of the judged product.
- Do not add unnecessary frameworks during a time-constrained hackathon.
- Do not redesign the public README around a problem that has not been selected.
- Do not infer team contributions from names alone; verify Git history.
- Do not expose the local server beyond the trusted Tailnet.
- Do not weaken HTML escaping when adding rich rendering.
- Do not claim GitHub commit detection is authoritative when aliases or API limits make it uncertain.

