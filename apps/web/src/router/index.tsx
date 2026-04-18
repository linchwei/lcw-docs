import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Layout } from '@/layout'
import { DocList } from '@/views/Doc'
import { Doc } from '@/views/Doc/[id]'
import { DocGraph } from '@/views/Doc/Graph'
import { Login } from '@/views/Login'
import { SharePage } from '@/views/Share'

import AuthRoute from './AuthRoute'

// 这里是为了解决 react-router-dom 的类型问题

type PickRouter<T> = T extends (...args: any[]) => infer R ? R : never

type A = typeof createBrowserRouter

export const router: PickRouter<A> = createBrowserRouter([
    {
        path: '/',
        element: (
            <AuthRoute>
                <Layout />
            </AuthRoute>
        ),
        children: [
            {
                path: 'doc',
                element: <DocList />,
            },
            {
                path: 'doc/:id',
                element: <Doc />,
            },
            {
                path: 'doc/graph',
                element: <DocGraph />,
            },
            {
                path: '/',
                element: <Navigate to="/doc" replace />,
            },
        ],
    },
    {
        path: '/account/login',
        element: <Login />,
    },
    {
        path: '/share/:shareId',
        element: <SharePage />,
    },
])
