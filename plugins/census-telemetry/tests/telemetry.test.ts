import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

// Runs `/telemetry <args>` as if the person typed it in the composer.
const telemetry = ($: Engine, args = '') =>
  $.command.run({
    command: 'telemetry',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

const OCT_20 = Date.UTC(2026, 9, 20, 15, 0, 0)

test('is off until opted in', async ($, on) => {
  mock.store(on)
  mock.clock(on, { now: OCT_20 })

  const ran = await telemetry($)

  expect(ran.text).toContain('Telemetry is off')
})

test('on opts in and off opts out', async ($, on) => {
  mock.store(on)
  mock.clock(on, { now: OCT_20 })

  expect((await telemetry($, 'on')).text).toContain('Telemetry is on')
  expect((await telemetry($)).text).toContain('Telemetry is on')

  expect((await telemetry($, 'off')).text).toContain('Telemetry is off')
  expect((await telemetry($)).text).toContain('Telemetry is off')
})

test('off deletes unsent rollups immediately', async ($, on) => {
  mock.store(on, { enabled: true, 'rollup:2026-10-19': {}, 'rollup:2026-10-20': {} })
  mock.clock(on, { now: OCT_20 })

  const ran = await telemetry($, 'off')

  expect(ran.text).toContain('2 unsent rollup(s) were deleted')

  const again = await telemetry($, 'off')
  expect(again.text).not.toContain('deleted')
})

test('preview shows the record for today with no identifiers', async ($, on) => {
  mock.store(on, { role: 'engineer' })
  mock.clock(on, { now: OCT_20 })

  const text = (await telemetry($, 'preview')).text ?? ''
  const rollup = JSON.parse(text.slice(text.indexOf('{')))

  expect(rollup.day).toBe('2026-10-20')
  expect(rollup.role).toBe('engineer')
  expect(rollup.org).toBe('unknown')
  expect(Object.keys(rollup).sort()).toEqual(['activity', 'day', 'org', 'privacy', 'role', 'schema_version'])
})

test('anything else shows usage', async ($, on) => {
  mock.store(on)
  mock.clock(on, { now: OCT_20 })

  expect((await telemetry($, 'maybe')).text).toContain('Usage')
})
