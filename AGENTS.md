# Agent instructions

This plugin adds image, video, and audio previews to DeepSeek Harness (DSH) Web.

## Project rules

- Read [Development](README.md#development) for the file map and commands.
- Before changes to media reads, API routes, or settings, read [SECURITY.md](SECURITY.md).
- Preserve workspace containment, authenticated routes, and the restrictions in `SECURITY.md`.
- Read the affected code and its callers before edits. Fix the shared cause of a bug.
- Prefer existing code, built-in APIs, and installed dependencies, in that order.
- Keep `lib.js` free of external dependencies. Keep ComfyUI optional.
- Keep host and client media rules consistent. Keep English and Chinese user text consistent.
- For behavior changes, add the smallest useful regression check to `test.mjs`.
- Apply the [writing rules](docs/agent-writing.md) to instructions, comments, errors, and reports.
- Keep this file short. Put task-specific details in linked documents.

## Delegation

- Give each agent the goal, relevant files, constraints, and a completion check.
- Assign each file to only one agent for edits at a time.
- Keep architecture, security decisions, and unclear bugs with the main agent.
- The main agent must check delegated results before use.

## Checks

Apply each row that matches the change.

| Change | Required checks |
| --- | --- |
| JavaScript | Run `node test.mjs`. Run `npm run lint`. |
| Host | Also run `node test.mjs --host` with the peer dependencies from `package.json`. |
| Client | Rebuild or restart the DSH Web profile. Check the affected UI behavior. |
| Documentation | Check links, commands, and the writing rules. |

For syntax checks without npm, run `node --check` on each file in the `package.json` lint script.
