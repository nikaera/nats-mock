module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "prettier"],
  ignorePatterns: [".eslintrc.*", "/node_modules/", "/lib/"],
  rules: {},
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2019,
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.eslint.json"],
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
      ],
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};
