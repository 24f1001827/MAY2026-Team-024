import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "hooks/use-mobile.ts",
    // shadcn CLI-managed files — treated as third-party, not linted
    "components/ui/**",
  ]),
  {
    // No hardcoded internal paths — routing must go through the @/nav platform
    // (publicRoutes for public pages, the generated `routes` builder for the
    // dashboard). See AGENTS.md "Strict Routing (No Hardcoded Paths)".
    // The `nav/` route definitions are object values (not href/router args), so
    // this rule does not match them.
    name: "rastro/no-hardcoded-routes",
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='href'] Literal[value=/^\\//]",
          message:
            "Don't hardcode internal paths in `href`. Import a route from '@/nav' (publicRoutes for public pages, or the generated `routes` builder for dashboard).",
        },
        {
          selector:
            "JSXAttribute[name.name='href'] TemplateLiteral > TemplateElement:first-child[value.raw=/^\\//]",
          message:
            "Don't hardcode internal paths in `href`. Use the '@/nav' `routes` builder (e.g. routes.complaints.detail(id).href).",
        },
        {
          selector:
            "CallExpression[callee.object.name='router'][callee.property.name=/^(push|replace)$/] > Literal[value=/^\\//]",
          message:
            "Don't hardcode internal paths in router navigation. Import a route from '@/nav'.",
        },
        {
          selector:
            "CallExpression[callee.object.name='router'][callee.property.name=/^(push|replace)$/] > TemplateLiteral > TemplateElement:first-child[value.raw=/^\\//]",
          message:
            "Don't hardcode internal paths in router navigation. Use the '@/nav' `routes` builder.",
        },
        {
          selector: "CallExpression[callee.name='redirect'] > Literal[value=/^\\//]",
          message:
            "Don't hardcode internal paths in redirect(). Import a route from '@/nav'.",
        },
      ],
    },
  },
]);

export default eslintConfig;
