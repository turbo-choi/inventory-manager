import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    files: ["**/*.{ts,tsx,vue,js}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }]
    }
  },
  {
    files: ["src/components/Empty.vue"],
    rules: {
      "vue/multi-word-component-names": "off"
    }
  }
];
