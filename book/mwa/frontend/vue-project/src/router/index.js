import Home from '@/components/Home.vue'
import Blog from '@/components/Blog.vue'
import Login from '@/components/Login.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/blog', name: 'Blog', component: Blog },
  { path: '/blog/:user', name: 'UserBlog', component: Blog },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
