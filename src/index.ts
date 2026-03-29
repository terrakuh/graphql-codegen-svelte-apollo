import { CodegenPlugin } from "@graphql-codegen/plugin-helpers";
import { parseConfig } from "./config";
import { generateOperations } from "./operations";
import { generateFragments } from "./fragments";

const plugin: CodegenPlugin["plugin"] = (schema, documents, config, info) => {
	config = parseConfig(config);

	const imports = [
		`import type { ApolloClient, ObservableQuery } from "@apollo/client";`,
		`import { get, readable } from "svelte/store";`,
		`import gql from "graphql-tag";`,
	];
	const fragments = generateFragments(schema, documents, config);
	const operations = generateOperations(documents, config);

	return {
		prepend: imports,
		content: [fragments, operations].join("\n\n"),
	};
};

const validate: CodegenPlugin["validate"] = (schema, documents, config, outputFile, allPlugins) => {
	try {
		parseConfig(config);
	} catch (err) {
		console.error("Invalid config:", err);
	}
};

module.exports = {
	plugin,
	validate,
} as CodegenPlugin;
