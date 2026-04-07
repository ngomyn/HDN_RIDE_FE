import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { registerUnauthorizedHandler } from '@/utils/apiClient'
import App from './App.vue'
import '@/styles/globals.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)

registerUnauthorizedHandler(async () => {
	if (authStore.isAuthenticated) {
		await authStore.logout()
	}

	if (router.currentRoute.value.path !== '/login') {
		await router.replace('/login')
	}
})

app.mount('#app')
