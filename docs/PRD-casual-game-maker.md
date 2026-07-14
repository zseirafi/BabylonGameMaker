# PRD: Babylon Game Maker — From Dev Starter Kit to Casual Game-Making Platform

Status: Draft v3 (revised after a validation spike + clarified product model)
Owner: zseirafi
Scope: Repositioning · landing page redesign · prompt library · game-ready asset library

> **What changed in v3.** Two corrections from testing and discussion:
> 1. **The product works by *asset selection*, not asset editing.** Users get a red car by
>    swapping in a game-ready red-car asset from a curated library (or bringing their own),
>    not by an agent hacking a baked asset's materials. This sidesteps the single biggest
>    technical risk (see the spike, Appendix B).
> 2. **The real Lovable agent is well-scaffolded** with a Babylon Toolkit Agent Reference +
>    six `bt-*` skills (Appendix C). It writes idiomatic toolkit code and is strong at
>    landing-page craft — but it still cannot *see inside* a binary asset, which is exactly
>    why the swap-from-catalog model is the right architecture.
>
> Net effect: the curated **game-ready asset library is not just "more content" — it is the
> mechanism** that keeps the agent working at the tractable level ("which asset") instead of
> the intractable one ("this asset's material graph"). The two things to build/validate
> first are therefore the **asset catalog/manifest** and the **game-ready contract**.

## 1. Where the project actually is today

Right now this repo **reads as a developer starter kit that happens to use Babylon.js**,
not as a game-making product.

- `package.json` name is `"my-starter-app"`. `README.md` is titled *"Using Exported Unity
  Content"* and is entirely `npm install` snippets, Vite config, and engine links.
- The landing page ([src/app.tsx](../src/app.tsx)) is the **stock Vite+React template
  scaffold with two demo buttons swapped in**: the "Documentation"/"Connect with us" panels
  and their `vite.dev` / `react.dev` / Vite-community links are unchanged template content.
  Nothing says what Babylon Game Maker is or what a visitor can build.
- The two buttons ("Player Demo," "Vehicle Demo") drop straight into a scene with no
  framing and no path to "make your own."
- Under the hood it is genuinely sophisticated: `@babylonjs-toolkit/next` gives a Unity-like
  `SceneManager` / `ScriptComponent` / `GameManager` architecture, a `StandardCarController`,
  a `CharacterController`, Havok physics, and SSR-safe mounting docs
  ([SSR_HOSTING.md](../SSR_HOSTING.md)) that **already name Lovable** as a supported host.
  The clone-into-Lovable flow you want is supported at the framework level; it has just
  never been surfaced as a product.
- Asset library today = one rigged Mustang + sample/terrain tracks, loaded as hosted
  `.gz.gltf` from `repo.babylontoolkit.com`
  ([VehicleControllerDemo.ts](../src/babylon/classes/VehicleControllerDemo.ts),
  [globals.ts:182](../src/babylon/globals.ts)). There is no machine-readable catalog,
  no game-ready contract, no ownership/pricing. **This car + tracks is the *seed* of the
  library — the starting point for the `"make me a racing game"` template — not a demo to
  be replaced.**

**Conclusion:** you're building the first product-facing layer on top of a solid but
invisible engine. No legacy UX to unwind — a template to replace, a catalog to create, and
a game-ready contract to define.

## 2. Vision

> Babylon Game Maker is the fastest way for someone with an idea and no engine experience
> to go from "I want to make a racing game" to a playable, polished prototype — by cloning
> a repo, pasting one prompt, and pressing play. As their idea grows, they swap in
> game-ready art from our curated library (or bring their own) and keep building, without
> ever leaving the flow.

Two audiences, one codebase:
- **Casual / aspiring game makers** (new primary audience): arrived from a prompt-to-app
  tool (Lovable et al.), want to *see something impressive fast*, and should never need to
  know what Havok or a `ScriptComponent` is.
- **High-end / sophisticated developers** (existing, keep serving): want the Unity-style
  controller architecture, SSR mounting, granular imports. None deleted — pushed one layer
  down from the front door.

## 3. The core loop

```
Lovable "Clone this repo" (or GitHub template / degit)
        │
        ▼
Repo clones, dev server auto-starts, preview pane opens
        │
        ▼
Landing page loads — a "start here" screen, not a demo:
  - a pre-rendered hero loop of the car on the track (moving instantly, no WebGL cost)
  - one primary CTA: "Copy starter prompt" → paste into the Lovable/agent box
        │
        ▼
User pastes the prompt → agent SELECTS assets from the catalog + edits config
(which car, which track, title, colors of UI, rules) — NOT editing baked asset internals
        │
        ▼
Live preview updates → user hits Play → drives their game
        │
        ▼
(Later) user opens the Asset Library to swap in more game-ready cars/tracks/characters,
or brings their own game-ready asset; browses the Prompt Library for other templates
```

The thing to protect is **time-to-first-wow**: the instant the clone finishes, something is
already moving — which is why the hero is a pre-rendered loop (§4.1.1), not the real engine.

### 3.1 This is asset selection + config, not asset editing

The mechanical unit of customization is **swap an asset reference / set a config value**,
which for this engine means editing plain strings the way the demo already does:
```ts
// VehicleControllerDemo.ts today — the exact seam a catalog swap targets:
const mustangPrefab = "riggedmustang.gz.gltf";     // ← swap to another catalog car
// app.tsx today — the track seam:
sceneUrl: '…/openterrain.gz.gltf',                 // ← swap to another catalog track
```
An agent handles string/config edits reliably. It does **not** need to (and must not try to)
reach inside a baked asset to recolor a `MultiMaterial` sub-material — the spike proved that
class of edit is intractable to do blind (Appendix B). The catalog is what makes the
tractable path possible.

### 3.2 Starter flow = customize an existing game; match the promise to the seed library

The advertised starter prompt should read as *customizing the working racing game*, and its
offered variations must be **satisfiable by assets that actually exist**. With only the
Mustang + current tracks in the seed library today, a prompt promising "a red sports car and
a neon night track" is a promise the catalog can't yet keep. Two honest options:
- **(a) Ship the catalog first** with at least a couple of car and track choices, then the
  starter prompt can offer real variety; or
- **(b) Keep the v1 starter prompt to variations the seed supports** (title, UI theme/colors,
  car handling/speed, which of the existing tracks) and expand the offered variations as the
  library grows.

Recommended: **(b) now, (a) as the library fills in.** Example v1 starter prompt:
> *"Rename this racing game to 'Midnight Circuit', give the UI a dark neon theme, and make
>  the car faster and twitchier."*

Every one of those is deliverable against today's assets and config surface.

### 3.3 Drop "AAA quality" from the marketing surface

"AAA" invites comparison to Forza/Gran Turismo and sets casual users up to feel let down.
Use honest, appealing language — "real 3D," "polished," "console-style feel." Quality is
earned by the **library's game-ready bar** (§6), not claimed in a prompt.

## 4. Landing page redesign

Immediately actionable. Replace `Home()` in [src/app.tsx](../src/app.tsx); keep the
routing/lazy-load architecture (`PlayRoute` behind `React.lazy`, `ReactRouterNavAdapter`)
exactly as-is. Only presentational content changes. **Note:** the Lovable agent's
`bt-copycat` / `bt-design` skills are purpose-built for exactly this kind of cinematic,
re-skinnable landing page (Appendix C) — the front-end redesign is well-supported.

### 4.1 Structure (top to bottom)

1. **Pre-rendered hero loop — not a live canvas.** A live Babylon canvas cannot deliver
   instant motion: mounting the vehicle scene pulls Havok WASM, registers all game modes,
   and downloads remote `.gz.gltf` — ~15 s of loading before first frame (observed in
   testing). Ship a short looping **video/GIF** of the car on the track as the hero (the
   Kling/Veo tooling in `tools/` can generate one); the real WebGL canvas mounts only after
   the user clicks "Play." Instant "this is a real game," zero load cost, no mobile penalty.
2. **One-line positioning**, replacing "React + Vite + BabylonJS":
   *"Make real 3D games from a prompt. Powered by Babylon.js."*
   Sub-line: *"Clone it, paste a prompt, get a playable game. No engine experience required."*
3. **Primary CTA — the copy-paste prompt block.** A code-styled card pre-filled with the
   starter customization prompt (§3.2), a single **"Copy prompt"** button (confirms
   "Copied!"), and one line under it: *"Paste this into your Lovable / AI builder chat — or
   just hit Play to try it now."*
4. **Secondary CTA — Play now.** Reframe `handlePlayerDemo` / `handleVehicleDemo` as
   **"Try the Racing Demo"** / **"Try the Character Demo"** — named by game experience, not
   internal controller class.
5. **Prompt Library preview** (stub now, real in §5): a row of template cards ("Racing Game"
   live; others greyed "Coming soon"). Clicking a live card swaps the copy-prompt block — no
   navigation.
6. **Asset Library teaser** (stub now, real in §6): *"Want a different car or track? Browse
   game-ready assets — or bring your own."* One "Browse Assets" button (disabled until the
   catalog ships).
7. **Footer**: replace Vite/React community links with this project's own — GitHub, docs,
   BabylonToolkit attribution, and a small "Powered by Babylon.js" mark (here, not the hero).

### 4.2 Explicitly remove from the fold
- Vite/React framework logos as hero art.
- The "Documentation / Getting Started / Asset Library / Learn More" panel pointing at
  `vite.dev` / `react.dev` / engine docs. Move to a footer "For developers" section.

### 4.3 Do NOT change yet
- `src/routing/*`, `src/babylon/system/*`, `SceneManager` / `GameManager` — zero changes.
- `/play` behavior stays identical; only entry-point copy and framing change.

## 5. Prompt Library (template gallery)

**Problem it solves:** "start a game" only works if the user knows to ask for the one game we
ship. Each future template needs a discoverable, paste-ready prompt tied to the assets it
requires.

**Design:** a local data file, e.g. `src/data/prompt-templates.ts`:
```ts
export type PromptTemplate = {
  id: string;
  title: string;              // "Racing Game"
  thumbnail: string;          // hero image/gif
  prompt: string;             // paste-ready customization text (§3.2)
  demoRoute?: string;         // optional "Try it" -> /play?gameMode=...
  requiredAssetIds: string[]; // catalog assets this template needs (§6)
  status: 'available' | 'coming-soon';
};
```
A template is `available` only when every `requiredAssetIds` entry exists in the catalog —
so the gallery can never advertise a game the library can't render. Adding a template later
is a data edit.

## 6. Asset strategy — curated game-ready library + bring-your-own

**Decision:** we do **not** integrate a text-to-3D generator (Meshy et al.). Generated 3D is
rarely game-ready (bad topology, wrong scale, no rig, no collision, no LODs) and this engine
needs rigged, physics-ready, controller-bindable assets. Supporting generation well means
owning a conform/rig/validate pipeline — a large, quality-risky commitment that undercuts
"it just works." **Curation is the moat.** Two lanes:

### 6.1 The curated library is the mechanism, not just content
The library exists to keep the agent (and user) working at the level of *"which asset,"*
never *"this asset's internals."* Every entry is pre-built to be **drop-in** against a
documented controller, so "give me a red car" = "select the red car asset," a string swap.

- **Catalog as machine-readable manifest** (static JSON first; backend only if it outgrows
  static hosting). Minimum shape:
  ```jsonc
  {
    "id": "car-neon-gt",
    "title": "Neon GT",
    "category": "vehicle",          // vehicle | track | character | prop
    "assetUrl": "https://…/neon-gt.gz.gltf",
    "controllerType": "StandardCarController",
    "rootNodeName": "NeonGT",       // what getNodeByName() must find (§6.3)
    "startPositionNode": "StartPosition 20",
    "scriptComponents": ["StandardCarController","VehicleInputController","VehicleCameraManager"],
    "thumbnail": "https://…/neon-gt.jpg",
    "price": 0,                     // reserved for later monetization (§6.4)
    "status": "available"
  }
  ```
- The manifest is what an agent reads to answer "what cars/tracks can I choose?" — the
  question it currently **cannot** answer because the remote repo is an unlistable black box.
- Scale-up = append conforming entries. The seed (Mustang + tracks) becomes catalog rows.

### 6.2 Bring-your-own game-ready assets (the escape hatch)
An advanced user drops in their own asset **that meets the game-ready contract (§6.3)** and
references it by URL — mirroring how `assetRepoPath + prefab` already works
([VehicleControllerDemo.ts:20-23](../src/babylon/classes/VehicleControllerDemo.ts)). No
generation and no hosting obligation on our side in v1; the user points the game at their own
file. Tiny surface, unblocks power users.

### 6.3 The "game-ready contract" — derived from what the controllers actually require
"Game-ready" for this engine is **not** "looks good." The current racing code hard-binds to
specific names and structure, so a drop-in asset must satisfy them (or the catalog must carry
per-asset overrides). Observed from
[VehicleControllerDemo.ts](../src/babylon/classes/VehicleControllerDemo.ts):
- **Format & compression**: `.gz.gltf` (gzipped glTF), loadable by the toolkit AssetsManager.
- **Root node name**: code calls `getNodeByName("RiggedMustang")`. A swapped car must expose a
  known root node — either the same name or one declared in the manifest (`rootNodeName`).
- **Start-position transform**: code reads `getNodeByName("StartPosition 20")` for spawn
  pose. The track/car pairing must provide the expected spawn node.
- **Attached script components**: code does `FindScriptComponent(node, "StandardCarController")`,
  `"VehicleInputController"`, `"VehicleCameraManager"`. A drop-in vehicle must ship these
  components (authored in the source DCC/Unity export), or it won't drive.
- **Physics body**: code sets `physicsBody.setMotionType(2)` (kinematic→dynamic). The asset
  must export a physics body / collider.
- **Scale & orientation**: must match the track's world scale and up-axis so spawn and camera
  work without per-asset fudging.

**Deliverable:** a short `docs/game-ready-spec.md` codifying the above (format, node-naming,
required script components, physics, scale) — this is the contract both the first-party
pipeline and BYO users conform to, and the fields the catalog manifest carries. This spec is
the highest-leverage missing artifact: it's what makes swaps reliable instead of fragile.

### 6.4 Monetization — decide the model before building the catalog
Clone-a-public-repo distribution is in tension with paid assets; name it, don't hide it:
- Public repo + plain asset URLs = **no hard DRM is possible** on a client-loaded 3D asset.
- Options, cheapest first:
  - **(a) Free library, monetize elsewhere** (hosting/pro features/support). Simplest;
    strongest for adoption while positioning the product. **Recommended for now.**
  - **(b) Paid packs via Gumroad/Stripe link-out**, soft entitlement (URL handed to buyer;
    leakage tolerated as most asset stores do).
  - **(c) Signed, expiring URLs behind a licensing backend** — real enforcement, real infra;
    only once packs demonstrably sell.
- **Recommendation: (a) now.** Give the library away to win positioning and drive clones;
  revisit paid packs after the loop is proven. The manifest already reserves `price` /
  (add) `ownerId` / `licenseType`, so moving to (b)/(c) later is a data change, not a
  migration.

## 7. Phased roadmap

| Phase | Scope | Depends on |
|---|---|---|
| **−1** | **Validation spike (do first).** Build a minimal 2-entry catalog manifest + wire the agent's edit to it, then test in real Lovable: *"switch this racing game to the \<other\> car and \<other\> track."* Prove the agent can **select from the catalog and swap** reliably (the tractable path), not restyle baked assets. Output: go/no-go + friction list. | A 2nd game-ready car/track (even a recolor variant) so there's something to swap **to** |
| 0 | Write `docs/game-ready-spec.md` (the contract, §6.3). Everything else keys off it. | Phase −1 findings |
| 1 | Landing redesign: pre-rendered hero loop, copy-prompt block (starter prompt matched to seed, §3.2), renamed CTAs, strip Vite/React default content (§4). | — (can parallel 0) |
| 2 | Asset catalog manifest + `game.config.ts` config surface the agent edits; expose "which car / which track / title / theme" as declared fields. | Phase 0 |
| 3 | Prompt Library UI wired to catalog-backed templates (§5). | Phase 2 |
| 4 | Grow the first-party library — add conforming cars/tracks/characters against the spec. Ongoing. | Phase 0 |
| 5 | "Bring your own game-ready asset" flow + docs (§6.2). | Phase 0 |
| 6 | *Optional/deferred:* monetization (Gumroad link-out, entitlement) — only if the library proves worth charging for (§6.4). | Phase 4 |

### 7.1 The critical dependency, restated correctly
The load-bearing question is **not** "can the agent edit an asset" (it can't see inside one,
and shouldn't try). It is **"given a catalog manifest + a `game.config.ts`, can the agent
select the right game-ready asset and wire it in?"** — a config/string edit the agent is good
at. Everything downstream assumes that, plus the **game-ready contract** guaranteeing swaps
are drop-in. Build the spec (§6.3) and a second swappable asset first; then the roadmap holds.

## 8. Open questions for you

1. **Branding**: does "Babylon Game Maker" stay the product name, or is there a separate
   consumer-facing name distinct from the Babylon Toolkit brand?
2. **Second seed asset for the spike**: fastest path to a 2nd swappable car/track — a
   recolor/variant of the existing assets, or sourcing a genuinely different game-ready model?
3. **Game-ready contract ownership**: is there an existing BabylonToolkit / Unity-export asset
   spec we can point to for the node-naming + script-component conventions (§6.3), or do we
   author `game-ready-spec.md` from scratch?
4. **Config surface**: comfortable introducing `game.config.ts` (car id, track id, title,
   theme, handling) as the agent's primary edit target (recommended)?
5. **Monetization stance now**: confirm a **free** library (§6.4a) with paid packs deferred?

## 9. Success signals

- Time from "clone finishes" to "something moving on screen" ≈ 0 (pre-rendered hero, §4.1.1).
- **Phase −1 pass rate**: % of catalog-swap prompts that produce a working game with no human
  fixes — the single most important early metric.
- % of new clones that copy the starter prompt within the first session.
- % of visitors who never see "Vite"/"React" before seeing what the product does.
- Once the library grows: assets swapped-in per project; clones per published asset.

---

## Appendix A — What holds up vs. what changed (review trail)

**Holds up:** the "repo reads as a dev kit, not a product" diagnosis; keep the engine, push
it one layer down; data-driven Prompt Library; landing redesign scoped to `Home()` only.

**Corrected across v2→v3:**
- Live hero → **pre-rendered loop** (real canvas can't load instantly).
- Starter flow → **customize, matched to the seed library's actual assets**; "AAA" dropped.
- **Meshy dropped** → curated game-ready library + bring-your-own.
- **Customization = asset *selection*, not asset *editing*** — the library is the mechanism
  that avoids the asset-opacity wall.
- Validation re-aimed: **"agent swaps a catalog asset"**, not "agent restyles a baked one."

**Must build first:** the **game-ready contract** (`docs/game-ready-spec.md`) and a
**catalog manifest** + a second swappable asset — without these, there is nothing to select
from and swaps are fragile.

## Appendix B — Validation spike results (evidence)

Ran an agent-style edit of the racing game on a throwaway branch:
`spike/agent-customization` — prompt: *restyle to a red car, night track, retitled screen.*

- **UI text (retitle "Midnight Circuit")**: ✅ trivial, worked instantly.
- **Recolor car red**: ❌ compiled, ran, threw no error, **no visible change.** Root cause
  (confirmed by live scene inspection): the body mesh `U_MC02_BodyLow_Mesh` uses a
  **`MultiMaterial`** (`[MM_U_MC02_BodyLow_Mesh]`); the actual paint is a *sub-material one
  level deeper* named `U_MC02_CarBody_White_shdr` (Unity-export naming). An `instanceof
  PBRMaterial` check silently skips the MultiMaterial container — a plausible edit that
  does nothing.
- **Night track**: ❌ `scene.clearColor` / fog / `environmentIntensity` all applied
  correctly, but **no visible change** — the sky is a **"Default Skybox" mesh** that paints
  over `clearColor`.

**Lesson:** these facts live only inside the binary `.gz.gltf`; they are undiscoverable from
the repo or the agent docs. **This entire class of edit is a non-goal** — the product routes
around it by swapping game-ready assets instead. The spike is therefore evidence *for* the
catalog model, and the concrete source of the §6.3 contract. (Branch is uncommitted; keep,
discard, or commit for reference per your call.)

## Appendix C — The real Lovable agent setup (why it's capable, and where the gap is)

Lovable loads, as Knowledge + Skills:
- **Agent Reference** (`babylontoolkit/agent/reference.md`) — a router the agent must fetch
  first; points to 10 sub-docs: ES6/UMD code style, project installer, **scene-components**,
  **shader-materials**, **ui-design-system**, react-framework, skills-repository,
  image/video (kie) servers, and an **AI Training Example Reference** (5 worked projects,
  incl. `05-DemoVehicleScene`) + a `babylon.toolkit.d.ts` for API discovery.
- **Six `bt-*` skills**: plan, spec, design, prototype, execute, and **copycat**
  (clones the design/motion mechanics of a reference website, re-skinned to a brief).

**Implication:** the agent is strong at **conventions, toolkit APIs, and landing-page craft**
(`bt-copycat`/`bt-design` map directly onto §4). But none of this scaffolding contains a
*specific asset's* internal structure (the MultiMaterial paint sub-material, the skybox
mesh) — those are only in the binary asset. So even the well-equipped agent is blind to the
handles a baked-asset restyle needs, which is precisely why **selection-from-catalog is the
right model and asset-editing is out of scope.**
*(Read in depth: `reference.md`, `bt-copycat`, `shader-materials.md`, `scene-components.md`,
`training-reference.md`. Not fully read: `bt-execute` / `bt-prototype` — if either drives a
live inspect-the-running-scene loop, it would only *partially* close the asset-opacity gap;
the definitive check is a real Lovable run.)*
