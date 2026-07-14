import { lazy, Suspense, useRef, useState, type RefObject } from 'react';
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

const AGENT_SKILLS = [
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-copycat",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-design",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-execute",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-plan",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-prototype",
  "https://github.com/babylontoolkit/skills/tree/main/skills/bt-spec",
].join("\n");

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

function Home() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const personaRef = useRef<HTMLElement>(null);
  const skillsRef = useRef<HTMLElement>(null);
  const cloneRef = useRef<HTMLElement>(null);
  const buildRef = useRef<HTMLElement>(null);

  const selectText = (ref: RefObject<HTMLElement | null>) => {
    const el = ref.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const copy = async (text: string, id: string, ref: RefObject<HTMLElement | null>) => {
    // Primary path: async Clipboard API. If it's blocked (some embedded preview iframes deny
    // clipboard-write via Permissions-Policy), fall back to selecting the visible text and
    // trying the legacy copy — and if even that is denied, the text stays selected so the
    // user can Ctrl/Cmd+C it manually. So the button always does something useful.
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      selectText(ref);
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
        <div className="gm-hero-copy">
          <p className="gm-eyebrow">Babylon Game Maker</p>
          <h1>Make real 3D games from a prompt</h1>
          <p className="gm-sub">
            Set up the Babylon Toolkit agent, clone the starter repo, then paste one prompt.
            No engine experience required.
          </p>

          <div className="gm-flow">
            {/* Step 1 — set up the agent (persona + skills). Must come first. */}
            <div className="gm-step">
              <div className="gm-step-head">
                <span className="gm-num">1</span>
                <span className="gm-step-label">Set up the Babylon Toolkit agent in your project</span>
              </div>
              <div className="gm-step-boxes">
                <div>
                  <p className="gm-box-cap">Add to your project's Knowledge / custom instructions</p>
                  <div className="gm-prompt">
                    <code ref={personaRef} className="gm-prompt-text gm-prompt-scroll" onClick={() => selectText(personaRef)}>{AGENT_PERSONA}</code>
                    <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(AGENT_PERSONA, 'persona', personaRef)}>
                      {copiedId === 'persona' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="gm-box-cap">Add these as Skills</p>
                  <div className="gm-prompt">
                    <code ref={skillsRef} className="gm-prompt-text gm-prompt-scroll" onClick={() => selectText(skillsRef)}>{AGENT_SKILLS}</code>
                    <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(AGENT_SKILLS, 'skills', skillsRef)}>
                      {copiedId === 'skills' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 — clone the starter repo */}
            <div className="gm-step">
              <div className="gm-step-head">
                <span className="gm-num">2</span>
                <span className="gm-step-label">Clone the starter repo into Lovable, Replit, or Vercel</span>
              </div>
              <div className="gm-prompt">
                <code ref={cloneRef} className="gm-prompt-text" onClick={() => selectText(cloneRef)}>{CLONE_PROMPT}</code>
                <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(CLONE_PROMPT, 'clone', cloneRef)}>
                  {copiedId === 'clone' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step 3 — paste the build prompt */}
            <div className="gm-step">
              <div className="gm-step-head">
                <span className="gm-num">3</span>
                <span className="gm-step-label">Paste this prompt to build your game</span>
              </div>
              <div className="gm-prompt">
                <code ref={buildRef} className="gm-prompt-text" onClick={() => selectText(buildRef)}>{BUILD_PROMPT}</code>
                <button type="button" className="gm-btn gm-btn-primary" onClick={() => copy(BUILD_PROMPT, 'build', buildRef)}>
                  {copiedId === 'build' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="gm-hero-art">
          {/* Rendered from the actual racing game. Placeholder for a future pre-rendered loop. */}
          <img src="/racing.jpg" alt="The starter racing game — a sports car on the track" />
          <span className="gm-hero-badge">Running in Browser</span>
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
