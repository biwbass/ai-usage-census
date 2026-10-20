# AI usage census

A proof of concept for measuring how AI coding agents and ideation frameworks
(like BMAD) change the way work gets done, **without identifying individuals**.
Measure the work, not the worker.

Tracking epic: [#1](https://github.com/biwbass/ai-usage-census/issues/1)

## Principles

- **Opt-in only.** Nothing is collected until a developer runs `/telemetry on`.
  `/telemetry off` takes effect immediately and discards anything not yet sent.
- **Classify on-device.** Prompt text never leaves the developer's machine.
  Only labels do.
- **Census-style privacy.** Randomized response is applied on the device,
  reports are daily rollups rather than event streams, and the company store
  holds no user IDs or ticket IDs.
- **k-anonymous reporting.** Aggregates are broken down by org and role only,
  and any cell with fewer than k people is suppressed.
- **Open source.** The mod and the methodology are public so anyone can check
  what is collected.

## Repository layout

| Path | What it is |
| --- | --- |
| [`plugins/census-telemetry/`](plugins/census-telemetry/) | The Claude Code mod that runs on each developer's machine |
| [`schema/daily-rollup.schema.json`](schema/daily-rollup.schema.json) | JSON Schema for the one record a device sends per day |
| [`docs/rollup-schema.md`](docs/rollup-schema.md) | What each rollup field means, and what is deliberately left out |

## Trying the mod

The mod is a Claude Code plugin. To load it into a session from a checkout:

```bash
claude --plugin-dir plugins/census-telemetry
```

Then, inside the session:

- `/telemetry preview` shows the exact record that would be sent for today
- `/telemetry on` opts in
- `/telemetry off` opts out and drops anything still buffered
- `/telemetry` with no argument shows the current status

At this stage the mod only handles consent and preview. It doesn't capture or
send anything yet.

## Status

Early PoC, sandbox only. No real employee data is in scope. See the epic for
the workstreams and open questions (the value of k, the noise level, reporting
cadence and the choice of on-device model).

## License

[Apache 2.0](LICENSE)
