import type { Connect } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/", // Ensures assets are correctly referenced
  build: {
    emptyOutDir: true,
    copyPublicDir: true,
    minify: "oxc",
    target: "esnext",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        manualChunks(id) {
          // Inspector is a dev-only tool loaded conditionally — keep it as its own lazy chunk
          if (id.includes("@babylonjs/inspector")) return "inspector";
          // Havok is a large WASM package loaded conditionally — keep it as its own lazy chunk
          if (id.includes("@babylonjs/havok")) return undefined;
          // IMPORTANT: Keep all other Babylon code in one chunk to ensure library files are correctly referenced 
          if (id.includes("@babylonjs") || id.includes("@babylonjs-toolkit")) {
            return "babylon";
          }
        },
      }
    }
  },
  optimizeDeps: {
    exclude: ["@babylonjs/havok", "@babylonjs/inspector"],
    include: mode === 'development' ? [
      "@babylonjs/core",
      "@babylonjs/gui",
      "@babylonjs/loaders",
      "@babylonjs/addons",
      "@babylonjs/materials",
      "@babylonjs/serializers",
      "@babylonjs-toolkit/dlc",
      "@babylonjs-toolkit/next",
      "scheduler",
      "use-sync-external-store/shim"
    ] : [],
  },
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
      name: "gltf-content-type-plugin",
      configureServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl) {
            if (req.originalUrl.endsWith(".gltf") || req.originalUrl.endsWith(".gz.gltf")) {
              res.setHeader("Content-Type", "model/gltf+json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            } else if (req.originalUrl.endsWith(".glb") || req.originalUrl.endsWith(".gz.glb")) {
              res.setHeader("Content-Type", "model/gltf-binary");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            } else if (req.originalUrl.endsWith(".bin") || req.originalUrl.endsWith(".gz.bin")) {
              res.setHeader("Content-Type", "application/octet-stream");
              res.setHeader("Access-Control-Allow-Origin", "*");
            }
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
          if (req.originalUrl) {
            if (req.originalUrl.endsWith(".gltf") || req.originalUrl.endsWith(".gz.gltf")) {
              res.setHeader("Content-Type", "model/gltf+json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            } else if (req.originalUrl.endsWith(".glb") || req.originalUrl.endsWith(".gz.glb")) {
              res.setHeader("Content-Type", "model/gltf-binary");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
              res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            } else if (req.originalUrl.endsWith(".bin") || req.originalUrl.endsWith(".gz.bin")) {
              res.setHeader("Content-Type", "application/octet-stream");
              res.setHeader("Access-Control-Allow-Origin", "*");
            }
          }
          next();
        });
      }
    }
  ]
}))
