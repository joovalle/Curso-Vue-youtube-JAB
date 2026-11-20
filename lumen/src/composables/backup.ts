import { useI18n } from 'vue-i18n'
import { toast } from './toast'
import { useAnnotations } from '@/stores/annotations'

/** Exportar e importar notas, subrayados y marcadores como archivo JSON. */
export function useBackup() {
  const notes = useAnnotations()
  const { t } = useI18n()

  async function exportFile() {
    const data = await notes.exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `lumen-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast(t('settings.exported'), 'success')
  }

  function importFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        await notes.importBackup(JSON.parse(await file.text()))
        toast(t('settings.importedOk'), 'success')
      } catch (e) {
        toast((e as Error).message, 'error')
      }
    }
    input.click()
  }

  return { exportFile, importFile }
}
