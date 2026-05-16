import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/account/login',
            component: () => import('@/views/Login.vue'),
        },
        {
            path: '/',
            component: () => import('@/layout/index.vue'),
            meta: { requiresAuth: true },
            children: [
                { path: '', redirect: '/doc' },
                {
                    path: 'doc',
                    name: 'doc-list',
                    component: () => import('@/views/DocList/index.vue'),
                },
                {
                    path: 'doc/:id',
                    name: 'doc-editor',
                    component: () => import('@/views/DocEditor/index.vue'),
                },
                {
                    path: 'doc/graph',
                    name: 'doc-graph',
                    component: () => import('@/views/DocGraph/index.vue'),
                },
            ],
        },
        {
            path: '/share/:shareId',
            name: 'share',
            component: () => import('@/views/Share/index.vue'),
        },
    ],
})

router.beforeEach((to) => {
    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) {
        return '/account/login'
    }
})

export default router
