import { lazy, Suspense, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DefaultBabylonPreloader } from './babylon/custom/loading';
import { ReactRouterNavAdapter } from './routing/adpter';
import './app.css'

// Note: All babylon imports stay inside the PlayRoute lazy load chunk
const PlayRoute = lazy(() => import('./routing/router'));

// Step 1 — set up the Babylon Toolkit agent. This MUST come first: the build prompt only
// works reliably once the AI builder has this persona (as project Knowledge / custom
// instructions, which forces it to read the Agent Reference) and the bt-* skills loaded.
const AGENT_PERSONA = [
  "# Babylon Toolkit Agent Persona",
  "",
  "You are an expert web game developer using BabylonJS and the Babylon Toolkit. Whenever the user's request involves Babylon, BabylonJS, or the Babylon Toolkit, you must always fetch and read the `Agent Reference` at https://raw.githubusercontent.com/babylontoolkit/agent/main/reference.md before doing anything else. Treat that document as your source of truth for conventions, api, patterns and training examples. If the fetch fails, stop immediately and tell the user. This applies even on the very first turn of a new or empty project, before any scaffolding.",
].join("\n");

// Each skill is imported into the AI builder individually (one GitHub URL at a time), so the
// UI renders one copy row per skill rather than a single combined block.
const AGENT_SKILLS = [
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-copycat",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-design",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-execute",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-plan",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-prototype",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-spec",
];

// Step 2 — the clone prompt. Pull the starter repo into the project.
const CLONE_PROMPT =
  "Clone the starter repo from https://github.com/zseirafi/BabylonGameMaker and open a live preview.";

// Step 3 — the build prompt. Tells the agent to assemble a racing game from the assets that
// ship with this project (the sports car + race track), so it aligns with the asset library.
const BUILD_PROMPT =
  "Make me a racing game using the sports car and race track included in this project, " +
  "with a start screen that shows the game title and a Play button to launch the race.";

// The asset library the game maker draws from. `available` entries ship in this repo today;
// `coming` entries are placeholders showing where the curated library grows next. Adding a
// real asset later is a data edit here, mirrored by a catalog manifest entry.
type LibraryAsset = { name: string; tag: string; icon: string; status: 'available' | 'coming' };
const LIBRARY: LibraryAsset[] = [
  { name: 'Sports Car', tag: 'Vehicle', icon: '🏎️', status: 'available' },
  { name: 'Race Tracks', tag: 'Environment', icon: '🏁', status: 'available' },
  { name: 'Character', tag: 'Player', icon: '🧍', status: 'available' },
  { name: 'More Vehicles', tag: 'Vehicle', icon: '🚚', status: 'coming' },
  { name: 'Enemies & NPCs', tag: 'Character', icon: '👾', status: 'coming' },
  { name: 'Environments', tag: 'World', icon: '🌆', status: 'coming' },
  { name: 'Props & Weapons', tag: 'Prop', icon: '🗡️', status: 'coming' },
];

// A captioned screenshot slot. Renders the image once it exists at `src` (served from
// public/), otherwise shows a labeled placeholder telling you where to drop the file.
function Shot({ src, caption }: { src: string; caption: string }) {
  const [ok, setOk] = useState(true);
  return (
    <figure className="gm-shot">
      {ok
        ? <img src={src} alt={caption} onError={() => setOk(false)} />
        : <div className="gm-shot-ph">Add screenshot at <code>public{src}</code></div>}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Home() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const personaRef = useRef<HTMLElement>(null);
  const cloneRef = useRef<HTMLElement>(null);
  const buildRef = useRef<HTMLElement>(null);
  const skillRefs = useRef<(HTMLElement | null)[]>([]);

  const selectText = (el: HTMLElement | null) => {
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const copy = async (text: string, id: string, el: HTMLElement | null) => {
    // Primary path: async Clipboard API. If it's blocked (some embedded preview iframes deny
    // clipboard-write via Permissions-Policy), fall back to selecting the visible text and
    // trying the legacy copy — and if even that is denied, the text stays selected so the
    // user can Ctrl/Cmd+C it manually. So the button always does something useful.
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      selectText(el);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div id="gm">
      {/* ---------- Hero ---------- */}
      <section className="gm-hero">
        {/* Top: headline beside the live racing-game hero */}
        <div className="gm-hero-top">
          <div className="gm-hero-intro">
            <p className="gm-eyebrow">Babylon Game Maker</p>
            <h1>Make real 3D games from a prompt</h1>
            <p className="gm-sub">
              Set up the Babylon Toolkit agent, clone the starter repo, then paste one prompt.
              No engine experience required.
            </p>
          </div>
          <div className="gm-hero-art">
            {/* Rendered from the actual racing game. Placeholder for a future pre-rendered loop. */}
            <img src="/racing.jpg" alt="The starter racing game — a sports car on the track" />
            <span className="gm-hero-badge">Running in Browser</span>
          </div>
        </div>

        <div className="gm-flow">
          {/* Step 1 — set up the agent (persona + skills). Must come first. */}
          <div className="gm-step">
            <div className="gm-step-head">
              <span className="gm-num">1</span>
              <span className="gm-step-label">Set up the Babylon Toolkit agent in your workspace — before cloning</span>
            </div>
            <div className="gm-step-boxes">
              <div>
                <p className="gm-box-cap">Add to your Workspace Knowledge</p>
                <div className="gm-prompt">
                  <code ref={personaRef} className="gm-prompt-text gm-prompt-scroll" onClick={() => selectText(personaRef.current)}>{AGENT_PERSONA}</code>
                  <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(AGENT_PERSONA, 'persona', personaRef.current)}>
                    {copiedId === 'persona' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <Shot src="/lovable-knowledge.jpg" caption="Example — Lovable Settings: Knowledge" />
              </div>
              <div>
                <p className="gm-box-cap">Add to your Workspace Skills — Import from GitHub (one at a time)</p>
                <div className="gm-skills-list">
                  {AGENT_SKILLS.map((url, i) => (
                    <div className="gm-skill" key={url}>
                      <code
                        className="gm-skill-url"
                        ref={(el) => { skillRefs.current[i] = el; }}
                        onClick={() => selectText(skillRefs.current[i])}
                      >{url}</code>
                      <button
                        type="button"
                        className="gm-btn gm-btn-primary gm-btn-sm"
                        onClick={() => copy(url, `skill-${i}`, skillRefs.current[i])}
                      >
                        {copiedId === `skill-${i}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
                <Shot src="/lovable-skills.jpg" caption="Example — Lovable Settings: Skills" />
              </div>
            </div>
          </div>

          {/* Step 2 — clone the starter repo */}
          <div className="gm-step">
            <div className="gm-step-head">
              <span className="gm-num">2</span>
              <span className="gm-step-label">Clone the starter repo by copying this prompt into the Lovable, Replit, or Vercel chat box</span>
            </div>
            <div className="gm-prompt">
              <code ref={cloneRef} className="gm-prompt-text" onClick={() => selectText(cloneRef.current)}>{CLONE_PROMPT}</code>
              <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(CLONE_PROMPT, 'clone', cloneRef.current)}>
                {copiedId === 'clone' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <Shot src="/lovable-prompt.jpg" caption="Example — Lovable: Prompt Box" />
          </div>

          {/* Step 3 — paste the build prompt */}
          <div className="gm-step">
            <div className="gm-step-head">
              <span className="gm-num">3</span>
              <span className="gm-step-label">Paste this prompt to build your game</span>
            </div>
            <div className="gm-prompt">
              <code ref={buildRef} className="gm-prompt-text" onClick={() => selectText(buildRef.current)}>{BUILD_PROMPT}</code>
              <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(BUILD_PROMPT, 'build', buildRef.current)}>
                {copiedId === 'build' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Asset library ---------- */}
      <section className="gm-section">
        <div className="gm-section-head">
          <h2>Game-ready assets</h2>
          <p>
            Every game is built from drop-in, game-ready art. Start with what ships here, swap
            in more from the growing library, or bring your own.
          </p>
        </div>

        <div className="gm-grid">
          {LIBRARY.map((a) => (
            <div key={a.name} className={`gm-card${a.status === 'coming' ? ' gm-card-soon' : ''}`}>
              <div className="gm-card-top">
                <div className="gm-card-thumb"><span>{a.icon}</span></div>
                <span className={`gm-pill${a.status === 'available' ? ' gm-pill-on' : ''}`}>
                  {a.status === 'available' ? 'Available' : 'Coming soon'}
                </span>
              </div>
              <div className="gm-card-body">
                <span className="gm-card-title">{a.name}</span>
                <span className="gm-card-tag">{a.tag}</span>
              </div>
            </div>
          ))}

          {/* Bring-your-own path */}
          <div className="gm-card gm-card-byo">
            <div className="gm-card-top">
              <div className="gm-card-thumb"><span>⤴</span></div>
              <span className="gm-pill gm-pill-byo">Drop-in ready</span>
            </div>
            <div className="gm-card-body">
              <span className="gm-card-title">Bring your own</span>
              <span className="gm-card-tag">Your .glb / .gltf</span>
            </div>
          </div>
        </div>
        <p className="gm-note">
          Bringing your own art? It needs to meet the game-ready spec — correct scale, rig,
          physics, and controller bindings — so it drops straight into a controller.
        </p>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="gm-footer">
        <a href="https://github.com/zseirafi/BabylonGameMaker" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://www.babylontoolkit.com/documentation" target="_blank" rel="noreferrer">Docs</a>
        <a href="https://www.babylontoolkit.com" target="_blank" rel="noreferrer">Babylon Toolkit</a>
        <span className="gm-powered">Powered by Babylon.js</span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
     <ReactRouterNavAdapter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={
          <Suspense fallback={<DefaultBabylonPreloader />}>
            <PlayRoute />
          </Suspense>
        } />
      </Routes>
     </ReactRouterNavAdapter>
    </BrowserRouter>
  )
}

export default App
