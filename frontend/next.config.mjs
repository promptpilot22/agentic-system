import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Two lockfiles exist (repo root, for db/ tooling, and this frontend/) —
  // without this, Turbopack infers the wrong workspace root and breaks
  // the RSC client manifest on every route (500 on "/" and "/login").
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
