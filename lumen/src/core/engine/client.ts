import * as Comlink from 'comlink'
import type { EngineApi } from './worker'

let remote: Comlink.Remote<EngineApi> | null = null

/** Acceso perezoso al motor SQLite que corre en el Web Worker. */
export function engine(): Comlink.Remote<EngineApi> {
  if (!remote) {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'lumen-engine' })
    remote = Comlink.wrap<EngineApi>(worker)
  }
  return remote
}

export { Comlink }
