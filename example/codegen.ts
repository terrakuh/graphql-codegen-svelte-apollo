import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: "./schema.graphql",
	documents: "./src/**/*.graphql",
	generates: {
		"./src/index.ts": {
			plugins: ["typescript", "typescript-operations", "../dist/index.js"],
			config: {
				useImplementingTypes: true,
				scalars: {
					ID: "number",
				},
			},
		},
	},
};

export default config;
