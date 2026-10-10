import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SimulateStepper } from "@/components/layout/SimulateStepper";

export const Route = createFileRoute("/simulate")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/simulate" || location.pathname === "/simulate/") {
      throw redirect({ to: "/simulate/input" });
    }
  },
  component: SimulateLayout,
});

function SimulateLayout() {
  return (
    <>
      <SimulateStepper />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Outlet />
      </div>
    </>
  );
}
