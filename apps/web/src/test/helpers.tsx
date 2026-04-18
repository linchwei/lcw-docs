import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProvider } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    })
}

export function renderWithProviders(
    ui: React.ReactElement,
    { route = '/', queryClient = createTestQueryClient() }: { route?: string; queryClient?: QueryClient } = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[route]}>
                    <SidebarProvider>
                        {children}
                    </SidebarProvider>
                </MemoryRouter>
            </QueryClientProvider>
        )
    }

    return { ...render(ui, { wrapper: Wrapper }), queryClient }
}

export function mockAuthenticatedUser(token = 'mock-jwt-token') {
    localStorage.setItem('token', token)
}

export function clearAuthenticatedUser() {
    localStorage.removeItem('token')
}
