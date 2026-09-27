import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/catalogo', name: 'catalogo', component: () => import('@/views/CatalogView.vue') },
  { path: '/producto/:id', name: 'producto', component: () => import('@/views/ProductDetailView.vue'), props: true },
  { path: '/carrito', name: 'carrito', component: () => import('@/views/CartView.vue') },
  { path: '/checkout', name: 'checkout', component: () => import('@/views/CheckoutView.vue') },
  { path: '/checkout/exito', name: 'checkout-exito', component: () => import('@/views/CheckoutSuccessView.vue') },
  { path: '/checkout/error', name: 'checkout-error', component: () => import('@/views/CheckoutFailureView.vue') },
  { path: '/admin/login', name: 'admin-login', component: () => import('@/views/admin/AdminLoginView.vue') },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { requiereAdmin: true },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!to.meta.requiereAdmin) return true
  const auth = useAuthStore()
  if (!auth.listo) await auth.init()
  if (!auth.autenticado) {
    return { name: 'admin-login' }
  }
  return true
})

export default router
