import type { Connect } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// MIME type map for all common web game / media asset extensions.
// Strips query strings before matching so ?v=123 cache-busters don't break lookups.
const MEDIA_MIME_TYPES: Record<string, string> = {
  // 3D models
  ".gltf":   "model/gltf+json",
  ".glb":    "model/gltf-binary",
  ".bin":    "application/octet-stream",
  // Images — raster
  ".png":    "image/png",
  ".jpg":    "image/jpeg",
  ".jpeg":   "image/jpeg",
  ".webp":   "image/webp",
  ".gif":    "image/gif",
  ".bmp":    "image/bmp",
  ".tiff":   "image/tiff",
  ".tif":    "image/tiff",
  ".avif":   "image/avif",
  ".ico":    "image/x-icon",
  ".svg":    "image/svg+xml",
  // Images — HDR / compressed textures (Babylon)
  ".hdr":    "application/octet-stream",
  ".exr":    "application/octet-stream",
  ".ktx":    "image/ktx",
  ".ktx2":   "image/ktx2",
  ".basis":  "application/octet-stream",
  ".dds":    "application/octet-stream",
  // Audio
  ".mp3":    "audio/mpeg",
  ".ogg":    "audio/ogg",
  ".wav":    "audio/wav",
  ".aac":    "audio/aac",
  ".flac":   "audio/flac",
  ".m4a":    "audio/mp4",
  ".opus":   "audio/opus",
  ".weba":   "audio/webm",
  // Video
  ".mp4":    "video/mp4",
  ".m4v":    "video/mp4",
  ".webm":   "video/webm",
  ".ogv":    "video/ogg",
  ".mov":    "video/quicktime",
  ".avi":    "video/x-msvideo",
};

// Extensions that also need CORS + method headers (3D model fetches from BabylonJS loaders)
const CORS_FULL_EXTS = new Set([".gltf", ".glb"]);

function applyMediaContentType(req: Connect.IncomingMessage, res: { setHeader: (k: string, v: string) => void }) {
  if (!req.originalUrl) return;
  const path = req.originalUrl.split("?")[0].toLowerCase();
  // Handle double-extension gzip variants e.g. scene.gz.gltf
  const normalized = path.endsWith(".gz.gltf") ? ".gltf"
    : path.endsWith(".gz.glb") ? ".glb"
    : path.endsWith(".gz.bin") ? ".bin"
    : "";
  const ext = normalized || path.substring(path.lastIndexOf("."));
  const mime = MEDIA_MIME_TYPES[ext];
  if (mime) {
    res.setHeader("Content-Type", mime);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (CORS_FULL_EXTS.has(ext)) {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Ensures assets are correctly referenced
  build: {
    emptyOutDir: true,
    copyPublicDir: true,
    // No module-preload helper: the generated __vitePreload helper is a module
    // shared by every chunk with dynamic imports, and rolldown emits it into
    // the babylon chunk — forcing the eager landing/auth entry to statically
    // import 10MB of Babylon. Plain import() keeps the graphs fully separate.
    modulePreload: false,
    minify: "esbuild",
    target: "esnext",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        inlineDynamicImports: false,
        // IMPORTANT: Keep all Babylon code in one chunk to ensure the library
        // files are correctly referenced. Remaining third-party code (react,
        // react-router, ...) gets its own vendor chunk so shared modules and
        // vite runtime helpers are never emitted into the babylon chunk —
        // otherwise the eager landing/auth entry would statically import the
        // 10MB babylon chunk just to reach a shared helper.
        advancedChunks: {
          groups: [
            // Vite's injected preload helper ("\0vite/preload-helper.js") is used
            // by every chunk with dynamic imports. Isolate it in its own tiny
            // eager chunk so it is never emitted into the babylon chunk (which
            // would force the landing/auth entry to import 10MB of Babylon).
            { name: "preload-helper", test: /preload-helper/ },
            { name: "babylon", test: /babylonjs/ },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      }
    }
  },
  resolve: {
    dedupe: [
      "@babylonjs/core",
      "@babylonjs/loaders",
      "@babylonjs/gui",
      "@babylonjs/materials",
      "@babylonjs/serializers",
      "@babylonjs/addons",
      "@babylonjs/havok",
    ],
  },
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
    include: mode === 'development' ? [
      "scheduler",
      "use-sync-external-store/shim"
    ] : [],
  },
  assetsInclude: ["**/*.wasm"],  
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    fs: {
      allow: [".."]
    },
    middlewareMode: false,
    allowedHosts: true,    // allow the .replit.dev domain through without whitelisting it
    strictPort: true,      // fail loudly if the port is taken — never silently fall back
    host: "0.0.0.0",       // bind all interfaces — required for the Replit proxy to reach it
    port: parseInt(process.env.PORT || "5173"),  // read PORT from the workflow env var
    open: true, // Automatically open the browser
    // Pre-transform the entire babylon entry chain so the first /play click
    // doesn't have to crawl + optimize a half-dozen UMD packages mid-navigation.
    // Globs auto-pick up any new files you add under src/babylon/.
    warmup: {
      clientFiles: [
        "./src/routing/router.tsx",
        "./src/babylon/**/*.{ts,tsx}",
        "./src/scripts/**/*.{ts,tsx}",
      ],
    },

  },
  plugins: [
    react(),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
      configurePreviewServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      }
    },
    {
      name: "wasm-content-type-plugin",
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl && req.originalUrl.endsWith(".wasm")) {
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl && req.originalUrl.endsWith(".wasm")) {
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      }
    },
    {
      name: "gzip-response-headers",
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl && req.originalUrl.includes(".gz.")) {
            res.setHeader("Content-Encoding", "gzip");
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl && req.originalUrl.includes(".gz.")) {
            res.setHeader("Content-Encoding", "gzip");
          }
          next();
        });
      }
    },
    {
      name: "media-content-type-plugin",
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          applyMediaContentType(req, res);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          applyMediaContentType(req, res);
          next();
        });
      }
    }
  ]
}))
