module.exports = {
    env: {
      node: true,
      es6: true
    },
    extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    globals: {
      Atomics: "readonly",
      SharedArrayBuffer: "readonly"
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: "module"
    },
    plugins: ["@typescript-eslint"],
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        typescript: {}
      }
    },
    rules: {
      "linebreak-style": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "import/no-unresolved": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prettier/prettier": "error",
      "no-underscore-dangle": ["error", { "allow": ["_id"]}]
    }
  };
  