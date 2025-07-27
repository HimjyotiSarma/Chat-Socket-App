import * as React from 'react'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { AuthContextType } from '../auth'
import type { QueryClient } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{
  auth: AuthContextType
  queryClient: QueryClient
}>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <div className="font-stretch-90% text-blue-500 text-4xl">
        Hello "__root"!
      </div>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools position="bottom-right" />
    </React.Fragment>
  )
}
