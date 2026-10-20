import RouteProgress from "@/components/RouteProgress";

/*
 * §5.2 — route transitions get a 2px brass bar, never a full-screen loader.
 * App Router mounts this boundary exactly while a route segment is pending.
 */
export default function Loading() {
    return <RouteProgress />;
}
