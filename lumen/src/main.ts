import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import '@fontsource-variable/literata'
import '@fontsource-variable/literata/wght-italic.css'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'
import { router } from './router'
import { detectLocale, i18n, setLocale } from './i18n'
import { useSettings } from './stores/settings'
import { useLibrary } from './stores/library'
import { useAnnotations } from './stores/annotations'

async function start() {
  const app = createApp(App)
  app.use(createPinia())
  app.use(i18n)

  const settings = useSettings()
  setLocale(settings.prefs.locale ?? detectLocale())
  await Promise.all([useLibrary().load(), useAnnotations().load()])

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void start()
