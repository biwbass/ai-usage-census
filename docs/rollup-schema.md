# Daily rollup schema (draft 0.1)

Each opted-in device sends **at most one record per UTC day**. That record is
the only thing that leaves the machine. The machine-readable definition is
[`schema/daily-rollup.schema.json`](../schema/daily-rollup.schema.json), and
the mod's TypeScript type in
[`plugins/census-telemetry/hooks/rollup.ts`](../plugins/census-telemetry/hooks/rollup.ts)
mirrors it.

## Example

```json
{
  "schema_version": "0.1",
  "day": "2026-10-20",
  "org": "payments",
  "role": "engineer",
  "privacy": { "mechanism": "k-rr", "p_truth": 0.75 },
  "activity": {
    "tickets_worked": 2,
    "turns_per_ticket": { "1-5": 0, "6-15": 1, "16-40": 1, "41+": 0 },
    "work_type": { "feature": 1, "bug": 1, "chore": 0, "spike": 0, "unknown": 0 },
    "prompt_class": { "initial": 3, "clarification": 4, "refinement": 9, "correction": 2, "unclassified": 1 },
    "hard_signals": { "interrupts": 1, "permission_rejections": 0, "reverts": 0 },
    "agents": { "internal": 5, "third_party": 1 },
    "bmad_phases": { "analysis": 0, "planning": 1, "solutioning": 1, "implementation": 3 }
  }
}
```

## What each part means

| Field | Meaning | Source |
| --- | --- | --- |
| `day` | UTC day covered. No timestamps finer than this | Mod |
| `org`, `role` | The only two dimensions anything is reported by | Ticket resolution (org), developer setting (role) |
| `privacy` | Which noise mechanism and parameters produced the counts, so the server can de-bias the aggregates | Mod |
| `tickets_worked`, `turns_per_ticket`, `work_type` | How much and what kind of work. Tickets are counted, never named | Mod + ticket adapter |
| `prompt_class` | Labels from the on-device classifier | Classifier |
| `hard_signals` | Interrupts, permission rejections, reverts | Mod |
| `agents` | Agent invocations, split internal vs third-party by plugin marketplace | Mod |
| `bmad_phases` | BMAD workflow invocations by phase | Mod |

Token usage and cost don't appear here. They come from Claude Code's built-in
OpenTelemetry export and pass through the same collector, which strips
identifiers. Outcome metrics (review rounds, reopens, bugs within 30 days) are
computed on the server from PR labels and don't appear here either.

## Deliberately left out

- User, device, session or install IDs
- Ticket IDs, repository names, branch names, file paths
- Prompt or response text, in any form, including hashes
- Agent or plugin names (only internal vs third-party)
- Times finer than a day

The device also sends the record at a random moment during the following day,
so arrival time can't be used to tie a record to a person's working hours.

## How noise is applied

For each labelled event (a prompt class, an agent invocation, a BMAD phase and
so on), the device keeps the true label with probability `p_truth` and
otherwise replaces it with one drawn uniformly from the same category. It then
counts. The server knows `p_truth`, so it can de-bias totals across many
devices, but no single record says for sure what one person did.

## Open questions

- **`p_truth` and k.** `0.75` in the example is a placeholder. Both need to be
  chosen together against the panel sizes the synthetic load generator models.
- **Linkability across days.** A rare `org` + `role` pair could make a
  device's records linkable from day to day even without an ID. k-suppression
  at query time covers reporting, but the collector may also need to drop or
  merge rare pairs on intake.
- **Bucketing counts.** Raw counts such as `hard_signals` aren't noised by
  k-rr. They may need bucketing or a separate count mechanism.
- **Cross tabs.** The schema can't answer "turns per ticket for bugs only". Is
  that worth a larger record?
