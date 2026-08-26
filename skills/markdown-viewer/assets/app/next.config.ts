import type { NextConfig } from "next";

const next_config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default next_config;
