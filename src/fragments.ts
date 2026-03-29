import { Types } from "@graphql-codegen/plugin-helpers";
import { ClientSideBaseVisitor, LoadedFragment } from "@graphql-codegen/visitor-plugin-common";
import { concatAST, GraphQLSchema, Kind, OperationTypeNode, visit } from "graphql";
import { Config } from "./config";
import { pascalCase } from "change-case";

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

	return result.definitions.join("\n\n");
	// const allAst = concatAST(documents.map((d) => d.document));

	// const allFragments: LoadedFragment[] = [
	// 	...(allAst.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION) as FragmentDefinitionNode[]).map(
	// 		(fragmentDef) => ({
	// 			node: fragmentDef,
	// 			name: fragmentDef.name.value,
	// 			onType: fragmentDef.typeCondition.name.value,
	// 			isExternal: false,
	// 		}),
	// 	),
	// 	...(config.externalFragments ?? []),
	// ];

	// const visitor = new ClientSideBaseVisitor(schema, allFragments, {}, { documentVariableSuffix: "Doc" }, documents);

	// const visitorResult = visit(allAst, visitor);

	// const operations = allAst.definitions.filter(
	// 	(d) => d.kind === Kind.OPERATION_DEFINITION,
	// ) as OperationDefinitionNode[];
}
