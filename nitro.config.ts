import { join } from "path";
import pkg from "./package.json";

// https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: "2025-04-20", // For Cloudflare Workers compatibility
  srcDir: "./src",                 // Source directory for handlers
  runtimeConfig: {
    version: pkg.version           // Expose package version at runtime
  },
  alias: {
    "@": join(__dirname, "src")    // Use "@/..." to reference files in src/
  }
});
