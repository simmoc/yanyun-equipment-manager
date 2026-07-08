# Ponytail — Lazy Senior Dev Mode for Qoder

> He says nothing. He writes one line. It works.

Ported from [opencode-ponytail](https://github.com/DietrichGebert/ponytail) v4.7.3 to Qoder-native plugin format.

## What it does

Ponytail puts a lazy senior developer inside your AI agent. Before writing code, the agent stops at the first rung that holds:

1. **Does this need to exist?** → skip it (YAGNI)
2. **Stdlib does it?** → use it
3. **Native platform feature?** → use it
4. **Installed dependency?** → use it
5. **One line?** → one line
6. **Only then:** the minimum that works

Lazy, not negligent: trust-boundary validation, data-loss handling, security, and accessibility are never on the chopping block.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **ponytail** | `ponytail`, `be lazy`, `lazy mode`, `simplest solution`, `yagni`, `do less` | Lazy mode itself. Simplest solution that works. Levels: lite / full (default) / ultra. |
| **ponytail-review** | `review for over-engineering`, `what can we delete`, `simplify review` | Reviews diffs for unnecessary complexity. One line per finding. |
| **ponytail-audit** | `audit this codebase`, `find bloat`, `ponytail-audit` | Whole-repo audit for over-engineering. Ranked delete-list. |
| **ponytail-debt** | `ponytail debt`, `what did ponytail defer`, `list the shortcuts` | Harvests all `ponytail:` comments into a debt ledger. |
| **ponytail-help** | `ponytail help`, `what ponytail commands` | Quick-reference card for all modes and skills. |

## Rules

The `rules/ponytail.md` file provides an always-on ruleset that guides the agent to write minimal, efficient code across every session.

## Source

- **Original**: https://github.com/DietrichGebert/ponytail
- **Author**: Dietrich Gebert
- **License**: MIT
- **Version**: 4.7.3

## Omitted from source

- OpenCode-specific hooks (`hooks/ponytail-*.js`, `hooks/hooks.json`) — these are lifecycle hooks for OpenCode's runtime, not applicable to Qoder.
- Copilot hooks (`hooks/copilot-hooks.json`) — platform-specific.
- Statusline scripts (`hooks/ponytail-statusline.sh`, `.ps1`) — terminal statusline, not applicable.
- The source `AGENTS.md` is converted to `rules/ponytail.md` as the always-on ruleset.

## Configuration

Default mode is `full`. To change it, set the `PONYTAIL_DEFAULT_MODE` environment variable (`lite`/`full`/`ultra`/`off`), or create `~/.config/ponytail/config.json`:

```json
{ "defaultMode": "ultra" }
```
