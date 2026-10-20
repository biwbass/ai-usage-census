// Mirrors schema/daily-rollup.schema.json at the repository root. Keep the two in step.

export const SCHEMA_VERSION = '0.1'

export const ROLES = ['engineer', 'qa', 'design', 'product', 'other'] as const
export type Role = (typeof ROLES)[number]

type Counts<K extends string> = Record<K, number>

export type DailyRollup = {
  schema_version: typeof SCHEMA_VERSION
  day: string
  org: string
  role: Role
  privacy: { mechanism: 'k-rr'; p_truth: number }
  activity: {
    tickets_worked: number
    turns_per_ticket: Counts<'1-5' | '6-15' | '16-40' | '41+'>
    work_type: Counts<'feature' | 'bug' | 'chore' | 'spike' | 'unknown'>
    prompt_class: Counts<'initial' | 'clarification' | 'refinement' | 'correction' | 'unclassified'>
    hard_signals: Counts<'interrupts' | 'permission_rejections' | 'reverts'>
    agents: Counts<'internal' | 'third_party'>
    bmad_phases: Counts<'analysis' | 'planning' | 'solutioning' | 'implementation'>
  }
}

// Placeholder until the noise level is chosen (see docs/rollup-schema.md).
export const DEFAULT_P_TRUTH = 0.75

export function utcDay(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10)
}

export function emptyRollup(day: string, role: Role, org = 'unknown'): DailyRollup {
  return {
    schema_version: SCHEMA_VERSION,
    day,
    org,
    role,
    privacy: { mechanism: 'k-rr', p_truth: DEFAULT_P_TRUTH },
    activity: {
      tickets_worked: 0,
      turns_per_ticket: { '1-5': 0, '6-15': 0, '16-40': 0, '41+': 0 },
      work_type: { feature: 0, bug: 0, chore: 0, spike: 0, unknown: 0 },
      prompt_class: { initial: 0, clarification: 0, refinement: 0, correction: 0, unclassified: 0 },
      hard_signals: { interrupts: 0, permission_rejections: 0, reverts: 0 },
      agents: { internal: 0, third_party: 0 },
      bmad_phases: { analysis: 0, planning: 0, solutioning: 0, implementation: 0 },
    },
  }
}
