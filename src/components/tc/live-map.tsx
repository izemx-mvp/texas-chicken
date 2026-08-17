import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { LeafletMapProps } from "./leaflet-map";

const LeafletMap = lazy(() => import("./leaflet-map"));

function MapSkeleton() {
  return (
    <div className="glass grid h-[560px] w-full place-items-center rounded-3xl">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-gold" />
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Chargement de la carte satellite…</p>
      </div>
    </div>
  );
}

export function LiveMap(props: LeafletMapProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <LeafletMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
