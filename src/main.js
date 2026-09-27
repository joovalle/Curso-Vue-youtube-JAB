import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/themes.css'
import './styles/base.css'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './store/theme'
import { LOGO_DATA_URI } from './assets/logoDataUri'

const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/jpeg'
favicon.href = LOGO_DATA_URI
document.head.appendChild(favicon)

const app = createApp(App)
app.use(createPinia())
app.use(router)

useThemeStore().init()

app.mount('#app')
