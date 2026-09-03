import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/account/reviews/**/*.{ts,tsx}",
      "app/account/returns/**/*.{ts,tsx}",
      "app/account/support/**/*.{ts,tsx}",
      "app/admin/dashboard/**/*.{ts,tsx}",
      "app/admin/coupons/**/*.{ts,tsx}",
      "app/admin/categories/**/*.{ts,tsx}",
      "app/admin/products/**/*.{ts,tsx}",
      "app/admin/returns/**/*.{ts,tsx}",
      "app/admin/support/**/*.{ts,tsx}",
      "app/admin/campaigns/**/*.{ts,tsx}",
      "app/admin/logistics/**/*.{ts,tsx}",
      "app/admin/advertising/**/*.{ts,tsx}",
      "app/admin/payouts/**/*.{ts,tsx}",
      "app/admin/reviews/**/*.{ts,tsx}",
      "app/admin/orders/**/*.{ts,tsx}",
      "app/admin/sellers/**/*.{ts,tsx}",
      "app/seller/apply/**/*.{ts,tsx}",
      "app/seller/orders/**/*.{ts,tsx}",
      "app/seller/products/**/*.{ts,tsx}",
      "app/seller/advertising/**/*.{ts,tsx}",
      "app/seller/warehouses/**/*.{ts,tsx}",
      "app/campaigns/**/*.{ts,tsx}",
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
