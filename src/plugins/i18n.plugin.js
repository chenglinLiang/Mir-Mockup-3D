import { createI18n } from 'vue-i18n'

import en from '@/locales/en.json'
import fr from '@/locales/fr.json'

const messages = {
  en,
  fr,
}

export const generateI18n = () => {
  const i18n = createI18n({
    globalInjection: true,
    legacy: false,
    locale: navigator.language.split('-')[0],
    messages,
  })
  return i18n
}

export default {
  install: (app) => {
    const i18n = generateI18n()

    document.documentElement.setAttribute('lang', i18n.global.locale.value)

    app.use(i18n)
  },
}
