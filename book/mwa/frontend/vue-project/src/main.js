import App from './App.vue'
import router from './router'
import store from './store'
import DateFilter from './filters/date'
import { createApp } from 'vue'

// Vue.filter('dateFormat', DateFilter)

const app = createApp(App)
app.use(store)
app.use(router)
app.config.globalProperties.$filters = {
  dateFormat: DateFilter,
}

app.mount('#app')
