import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <div className="font-stretch-90% text-blue-500 text-4xl">
        Hello "__root"!
      </div>
      <Outlet />
      <TanStackRouterDevtools />
    </React.Fragment>
  )
}
