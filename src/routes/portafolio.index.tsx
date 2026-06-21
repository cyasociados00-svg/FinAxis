import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/portafolio/")({
  beforeLoad: () => {
    throw redirect({ to: "/portafolio/acciones" });
  },
});
