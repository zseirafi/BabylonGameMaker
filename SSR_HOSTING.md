# Mounting the Babylon Toolkit Starter in any React host

The `src/babylon/` framework is now router-agnostic and SSR-safe. Use the
`<BabylonMount />` helper (`src/babylon/mount.tsx`) and your host's own
router adapter (see `src/routing/adpter.tsx` for the included
react-router-dom adapter).

`<BabylonMount />` lazy-loads every Babylon module on the client, so the
UMD globals (`BABYLON`, `TOOLKIT`, `HavokPhysics`) are never touched
during SSR.

## Next.js (App Router)

```tsx
// app/play/page.tsx
"use client";
import dynamic from "next/dynamic";
const BabylonMount = dynamic(() => import("@/babylon/mount"), { ssr: false });

export default function PlayPage() {
  // Wrap with your Next.js NavigationProvider adapter
  return <BabylonMount />;
}
```

## TanStack Start

```tsx
// src/routes/play.tsx
import { createFileRoute } from "@tanstack/react-router";
import BabylonMount from "@/babylon/mount";

export const Route = createFileRoute("/play")({
  ssr: false,
  component: () => <BabylonMount />,
});
```

## Remix

```tsx
// app/routes/play.tsx
import { ClientOnly } from "remix-utils/client-only";
import BabylonMount from "~/babylon/mount";
export default function Play() {
  return <ClientOnly>{() => <BabylonMount />}</ClientOnly>;
}
```

## Plain Vite + BrowserRouter (the shipped default)

No changes — the existing `src/app.tsx` already mounts the Babylon
route inside a `<Suspense>` boundary. `mount.tsx` is unused and is
tree-shaken from the production bundle.
