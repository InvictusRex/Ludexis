import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  {
    rules: {
      // react-hooks v7 "set-state-in-effect" flags the app's standard
      // fetch-on-mount / filter-in-effect patterns, which are intentional.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
