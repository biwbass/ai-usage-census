import type { EngineInterface, Register } from 'claude-code'

import { ROLES, emptyRollup, utcDay } from './rollup'
import type { DailyRollup, Role } from './rollup'

// $.store keys. `rollup:<day>` holds the not-yet-sent rollup for that day.
const ENABLED = 'enabled'
const ROLE = 'role'
const ROLLUP_PREFIX = 'rollup:'

const USAGE = 'Usage: /telemetry on | off | preview'

async function isEnabled($: EngineInterface): Promise<boolean> {
  return (await $.store.get(ENABLED)) === true
}

async function role($: EngineInterface): Promise<Role> {
  const stored = await $.store.get(ROLE)
  return ROLES.find(one => one === stored) ?? 'other'
}

async function todaysRollup($: EngineInterface): Promise<DailyRollup> {
  const day = utcDay(await $.clock.now())
  const buffered = await $.store.get(ROLLUP_PREFIX + day)
  return (buffered as DailyRollup | undefined) ?? emptyRollup(day, await role($))
}

async function dropBuffered($: EngineInterface): Promise<number> {
  const keys = (await $.store.keys()).filter(key => key.startsWith(ROLLUP_PREFIX))
  await Promise.all(keys.map(key => $.store.delete(key)))
  return keys.length
}

function showStatus($: EngineInterface, enabled: boolean) {
  $.ui.status(enabled ? 'census: on' : undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'telemetry',
      description: 'AI usage census: opt in, opt out, or preview what would be sent',
      argumentHint: 'on | off | preview',
    })
    showStatus($, await isEnabled($))

    return next(e)
  })

  on('command.run', { command: 'telemetry' }, async ($, e) => {
    // A bare `/telemetry` can arrive with no args at all.
    const arg = (e.args ?? '').trim().toLowerCase()

    if (arg === 'on') {
      await $.store.set(ENABLED, true)
      showStatus($, true)
      return {
        text:
          'Telemetry is on. Only a daily rollup of labels and counts leaves this machine, ' +
          'with no prompt text and no user or ticket IDs. Run /telemetry preview to see it, ' +
          'or /telemetry off to stop at any time.',
      }
    }

    if (arg === 'off') {
      await $.store.set(ENABLED, false)
      const dropped = await dropBuffered($)
      showStatus($, false)
      return {
        text:
          'Telemetry is off. Nothing more will be collected' +
          (dropped > 0 ? `, and ${dropped} unsent rollup(s) were deleted.` : '.'),
      }
    }

    if (arg === 'preview') {
      const rollup = await todaysRollup($)
      const state = (await isEnabled($)) ? 'on' : 'off'
      return {
        text:
          `Telemetry is ${state}. This is the exact record that would be sent for ${rollup.day}:\n\n` +
          JSON.stringify(rollup, null, 2),
      }
    }

    if (arg === '') {
      const state = (await isEnabled($)) ? 'on' : 'off'
      return { text: `Telemetry is ${state}. ${USAGE}` }
    }

    return { text: USAGE }
  })
}
