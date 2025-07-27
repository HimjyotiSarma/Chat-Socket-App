import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="size-full flex justify-center items-centers">
      <div>Hello "/_auth"!</div>
      <Outlet />
    </div>
  )
}
