import { Types } from "@graphql-codegen/plugin-helpers";
import { ClientSideBaseVisitor, LoadedFragment } from "@graphql-codegen/visitor-plugin-common";
import { concatAST, GraphQLSchema, Kind, visit } from "graphql";
import { Config } from "./config";

export function generateFragments(schema: GraphQLSchema, documents: Types.DocumentFile[], config: Config) {
	const allFragments = documents
		.map((document) => document.document?.definitions ?? [])
		.flat()
		.filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
		.map(
			(definition): LoadedFragment => ({
				node: definition,
				name: definition.name.value,
				onType: definition.typeCondition.name.value,
				isExternal: false,
			}),
		);

	const visitor = new ClientSideBaseVisitor(schema, allFragments, {}, { documentVariableSuffix: "Doc" }, documents);

	const documentNodes = documents.map((document) => document.document).filter((document) => document != null);
	const result = visit(concatAST(documentNodes), visitor);

	return [visitor.fragments, ...result.definitions].join("\n\n");
}
