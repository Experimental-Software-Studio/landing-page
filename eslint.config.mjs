import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ["generated/repoMirror.ts", ".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
