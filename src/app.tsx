import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DefaultBabylonPreloader, babylonLogo } from './babylon/custom/loading';
import { useUnifiedNavigation } from "./babylon/system/platform";
import { ReactRouterNavAdapter } from './routing/adpter';
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './app.css'

// Note: All babylon imports stay inside the PlayRoute lazy load chunk
const PlayRoute = lazy(() => import('./routing/router'));

function Home() {
  const { navigate } = useUnifiedNavigation();
  const handlePlayerDemo = () => {
    navigate('/play', {
      gameMode: 'PlayerControllerDemo',
      sceneUrl: 'https://repo.babylontoolkit.com/playground/samplescene.gltf',
    });
  };
  const handleVehicleDemo = () => {
    navigate('/play', {
      gameMode: 'VehicleControllerDemo',
      sceneUrl: 'https://repo.babylontoolkit.com/playground/openterrain.gltf',
    });
  };

  return (
    <div id="vite">
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
          <div>
            <a href="https://babylonjs.com" target="_blank">
              <img src={babylonLogo} className="logo babylon" alt="Babylon logo" />
            </a>
          </div>
        </div>
        <div>
          <h1>React + Vite + BabylonJS</h1>
        </div>
        <div>
          <button type="button" className="counter" onClick={handlePlayerDemo}>Player Demo</button>&nbsp;&nbsp;<button type="button" className="counter" onClick={handleVehicleDemo}>Vehicle Demo</button>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://www.babylontoolkit.com/documentation" target="_blank">
                <img className="logo" src={babylonLogo} alt="" />
                Getting Started
              </a>
            </li>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn More
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
      <div>
        <small><a href="https://www.babylontoolkit.com" target="_blank">Babylon Toolkit Game Development</a></small>
      </div>
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
