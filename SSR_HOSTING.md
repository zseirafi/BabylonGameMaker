# Mounting in an SSR / multi-framework host

The default starter ships a `BrowserRouter` SPA where Babylon code is already
lazy-loaded behind `React.lazy` in `src/app.tsx`. No extra work is required.

If you want to drop the Toolkit into an SSR framework (Next.js App Router,
TanStack Start, Remix), use the **`src/babylon/mount.tsx`** wrapper instead
of importing `system/babylon` directly. It defers every Babylon import
behind `React.lazy`, so the ES6 modules (`@babylonjs/core`, `@babylonjs-toolkit/next`,
etc.) and the Havok WASM are only evaluated on the client after mount.

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

The `@babylonjs/core`, `@babylonjs-toolkit/next`, and related ES6 packages
reference browser APIs (`window`, `document`, WebGL context) at module
evaluation and engine-creation time. Any host that evaluates modules on the
server (Node, Cloudflare Workers, edge runtimes) will crash on
`window is not defined` if you import `system/babylon` from a route file's
top-level imports. `mount.tsx` solves this for every host with one file by
keeping all Babylon imports inside `React.lazy`, which only runs in the browser.

## Globals

`src/babylon/project.d.ts` ambient-declares the runtime-only `globalThis`
fields used by `globals.ts`: `HK`, `HKP`, `HavokPhysics`, `HAVOKPHYSICS_JS`,
and `SCRIPTBUNDLE_JS`. These are populated at runtime by dynamic Havok
initialisation and optional script-bundle loads — not by UMD global attachment.
The old `BABYLON`, `TOOLKIT`, and `PROJECT` window globals are no longer used;
all Babylon APIs are imported directly via the ES6 scoped packages
(`@babylonjs/core`, `@babylonjs-toolkit/next`, etc.).

## SSR host Vite config — excluding `@babylonjs/*` from dep optimisation

When mounting this starter inside an SSR host (TanStack Start, Next.js with a
custom Vite pipeline, Lovable, etc.), Vite's dep-optimisation step must **not**
pre-bundle the `@babylonjs/*` and `@babylonjs-toolkit/*` packages. They ship
pre-built ES modules; running esbuild over them serves no purpose and can cause
the dev server to crash or produce a broken bundle.

Fix: add every Babylon scoped package to `optimizeDeps.exclude` in your host's
`vite.config.ts`:

```ts
// vite.config.ts (host project)
export default defineConfig({
  optimizeDeps: {
    exclude: [
      "@babylonjs/core",
      "@babylonjs/loaders",
      "@babylonjs/gui",
      "@babylonjs/materials",
      "@babylonjs/serializers",
      "@babylonjs/addons",
      "@babylonjs/havok",
      "@babylonjs/inspector",
      "@babylonjs-toolkit/next",
      "@babylonjs-toolkit/next/project",
    ],
  },
});
```

If your host wraps Vite (e.g. `@lovable.dev/vite-tanstack-config`), pass the
same block through its `vite: { optimizeDeps: { ... } }` option. After
adding the exclusions, delete `node_modules/.vite` once so the dep cache is
rebuilt.

The shipped `vite.config.ts` in this starter already includes these exclusions.

---

## Runtime fix shipped in this revision

One bug from the original starter caused the Play route to render a black
screen. It is fixed in the shipped source — apply the same patch if you
regenerate from an older clone.

### Stabilize the default `engineOptions` in `system/viewer.tsx`

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
