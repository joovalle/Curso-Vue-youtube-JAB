import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import es from '../../i18n/locales/es'
import en from '../../i18n/locales/en'
import pt from '../../i18n/locales/pt'

const src = join(__dirname, '../..')
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.(vue|ts)$/.test(f) && !f.endsWith('.test.ts') ? [p] : []
  })

const get = (obj: unknown, key: string) =>
  key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)

describe('traducciones', () => {
  // Claves literales usadas en el código: $t('a.b'), t('a.b'), label: 'a.b'
  const keys = new Set<string>()
  for (const f of files(src)) {
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:\$t|\bt)\(\s*'([a-zA-Z][\w-]*(?:\.[\w-]+)+)'/g)) keys.add(m[1])
    for (const m of readFileSync(f, 'utf8').matchAll(/(?:label|title|text): '([a-z]+\.[\w.-]+)'/g)) keys.add(m[1])
  }

  it('encuentra claves en el código', () => expect(keys.size).toBeGreaterThan(80))

  for (const [name, messages] of Object.entries({ es, en, pt })) {
    it(`${name}: todas las claves existen`, () => {
      const missing = [...keys].filter((k) => typeof get(messages, k) !== 'string')
      expect(missing).toEqual([])
    })
  }
})
