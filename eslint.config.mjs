import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/account/reviews/**/*.{ts,tsx}",
      "app/admin/dashboard/**/*.{ts,tsx}",
      "app/admin/coupons/**/*.{ts,tsx}",
      "app/admin/categories/**/*.{ts,tsx}",
      "app/seller/apply/**/*.{ts,tsx}",
      "app/seller/orders/**/*.{ts,tsx}",
      "app/seller/products/**/*.{ts,tsx}",
      "components/seller/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  {
    files: ["app/seller/dashboard/actions.ts"],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
