# Mounting in an SSR / multi-framework host

The default starter ships a `BrowserRouter` SPA where Babylon code is already
lazy-loaded behind `React.lazy` in `src/app.tsx`. No extra work is required.

If you want to drop the Toolkit into an SSR framework (Next.js App Router,
TanStack Start, Remix), use the **`src/babylon/mount.tsx`** wrapper instead
of importing `system/babylon` directly. It defers every Babylon import
behind `React.lazy`, so the UMD globals (`BABYLON`, `TOOLKIT`) and the
Havok WASM are only touched on the client after mount.

### Next.js (App Router)

```tsx
'use client';
import dynamic from 'next/dynamic';
const BabylonMount = dynamic(() => import('@/babylon/mount'), { ssr: false });

export default function PlayPage() {
  return <BabylonMount />;
}
```

### TanStack Start

```tsx
// src/routes/play.tsx
import { createFileRoute } from '@tanstack/react-router';
import BabylonMount from '@/babylon/mount';

export const Route = createFileRoute('/play')({
  ssr: false, // critical — skips SSR for this route
  component: () => <BabylonMount />,
});
```

### Remix

```tsx
// app/routes/play.tsx
import { ClientOnly } from 'remix-utils/client-only';
import BabylonMount from '~/babylon/mount';

export default function Play() {
  return <ClientOnly fallback={null}>{() => <BabylonMount />}</ClientOnly>;
}
```

### Plain Vite + BrowserRouter

```tsx
<Route path="/play" element={
  <Suspense fallback={<DefaultBabylonPreloader />}>
    <BabylonMount />
  </Suspense>
} />
```

## Why the lazy boundary matters

The `babylonjs`, `babylonjs-toolkit`, etc. UMD bundles attach to `window` and
reference `document` at import time. Any host that evaluates modules on the
server (Node, Cloudflare Workers, edge runtimes) will crash on
`window is not defined` if you import `system/babylon` from a route file's
top-level imports. `mount.tsx` solves this for every host with one file.

## Globals

`src/babylon/globals.d.ts` ambient-declares the UMD globals (`BABYLON`,
`TOOLKIT`, `HavokPhysics`, `PROJECT`) and the `globalThis` runtime-cache
fields used by `globals.ts` (`HK`, `HKP`, `HAVOKPHYSCIS_JS`, `SCRIPTBUNDLE_JS`).
Keeps the project clean under `strict: true` hosts.

## SSR host Vite config — Babylon UMD externals

When mounting this UMD starter inside an SSR host (TanStack Start, Next.js
with a custom Vite pipeline, Lovable, etc.), Vite's dep-optimization step
runs esbuild over `babylonjs-inspector`, which contains UMD plugin sentinels
like `require("babylonjs::BABYLON.Debug")` and
`require("babylonjs-loaders::BABYLON.GLTF2")`. esbuild cannot resolve these
and the dev server crashes with:

```
✘ [ERROR] Could not resolve "babylonjs::BABYLON.Debug"
```

Fix: add a tiny esbuild plugin to `optimizeDeps` that marks any
`<package>::…` specifier as external. At runtime those references are
satisfied by the global `BABYLON` object that the UMD bundles already
attached to `window`.

```ts
// vite.config.ts (host project)
const babylonUmdExternalsPlugin = {
  name: "babylon-umd-externals",
  setup(build: any) {
    build.onResolve({ filter: /^babylonjs.*::/ }, (args: any) => ({
      path: args.path,
      external: true,
    }));
  },
};

export default defineConfig({
  optimizeDeps: {
    exclude: ["babylonjs-inspector"],
    esbuildOptions: { plugins: [babylonUmdExternalsPlugin] },
  },
});
```

If your host wraps Vite (e.g. `@lovable.dev/vite-tanstack-config`), pass the
same block through its `vite: { optimizeDeps: { ... } }` option. After
adding the plugin, delete `node_modules/.vite` once so the dep cache is
rebuilt.

The shipped `vite.config.ts` in this starter already handles the same case
via a Rolldown `resolveId`/`load` pair — the snippet above is only needed
when a different host owns the Vite config.

---

## Runtime fixes shipped in this revision

Two bugs from the original starter caused the Play route to either crash
on load or render a black screen in SSR hosts. Both are fixed in the
shipped source — apply the same patches if you regenerate from an older
clone.

### 1. Remove the `babylonjs-inspector` side-effect import

`src/babylon/globals.ts` previously did:

```ts
import "babylonjs-inspector";
```

The inspector UMD bundle contains internal sentinels like
`require("babylonjs::BABYLON.Debug")` that esbuild cannot resolve during
Vite's `optimizeDeps` pass. The dev server starts, but the first dynamic
import of the Babylon scene throws **"Failed to fetch dynamically
imported module"** and the Play screen stays on the loading spinner.

**Fix:** delete that import line. The inspector is a dev-only tool; load
it on demand via `BABYLON.Tools.LoadScriptAsync` if you actually need it.
Pair this with `optimizeDeps.exclude: ["babylonjs-inspector"]` (see the
Vite config section above).

### 2. Stabilize the default `engineOptions` in `system/viewer.tsx`

The component used to destructure with an inline default:

```tsx
const { engineOptions = {}, ... } = props;
```

`{}` is a fresh object on every render. It went into the effect
dependency array, so the effect re-fired on every render — disposing
and recreating the Babylon engine ~once per second, which manifests as
a permanent loading screen and high CPU.

**Fix:** hoist a single stable default outside the component and
reference it in the destructure:

```tsx
const DEFAULT_ENGINE_OPTIONS = {};

function BaseSceneViewer(props: BabylonjsProps & ...) {
  const { engineOptions = DEFAULT_ENGINE_OPTIONS, ... } = props;
  // ...
}
```

Same identity across renders → effect only re-runs when the caller
actually passes a new object.
