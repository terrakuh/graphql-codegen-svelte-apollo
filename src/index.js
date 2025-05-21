"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const graphql_1 = require("graphql");
const pascal_case_1 = require("pascal-case");
// const visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
const operationMap = {
    query: "query",
    subscription: "subscribe",
    mutation: "mutate",
};
module.exports = {
    plugin: (schema, documents, config, info) => {
        const allAst = (0, graphql_1.concatAST)(documents.map((d) => d.document));
        const allFragments = [
            ...allAst.definitions.filter((d) => d.kind === graphql_1.Kind.FRAGMENT_DEFINITION).map((fragmentDef) => ({
                node: fragmentDef,
                name: fragmentDef.name.value,
                onType: fragmentDef.typeCondition.name.value,
                isExternal: false,
            })),
            ...(config.externalFragments || []),
        ];
        const visitor = new visitor_plugin_common_1.ClientSideBaseVisitor(schema, allFragments, {}, { documentVariableSuffix: "Doc" }, documents);
        const visitorResult = (0, graphql_1.visit)(allAst, visitor);
        const operations = allAst.definitions.filter((d) => d.kind === graphql_1.Kind.OPERATION_DEFINITION);
        const operationImport = `${operations.some((op) => op.operation == "query")
            ? `ApolloQueryResult, ObservableQuery, WatchQueryOptions, ${config.asyncQuery ? "QueryOptions, " : ""}`
            : ""}${operations.some((op) => op.operation == "mutation")
            ? "MutationOptions, "
            : ""}${operations.some((op) => op.operation == "subscription")
            ? "SubscriptionOptions, "
            : ""}`.slice(0, -2);
        const imports = [
            `import type {
        ApolloClient, NormalizedCacheObject, TypedDocumentNode,
        ${operationImport}
      } from "@apollo/client/core";`,
            `import { readable } from "svelte/store";`,
            `import gql from "graphql-tag"`,
        ];
        const ops = operations
            .map((o) => {
            var _a, _b;
            const dsl = `export const ${(_a = o.name) === null || _a === void 0 ? void 0 : _a.value}Doc = gql\`${documents.find((d) => d.rawSDL.includes(`${o.operation} ${o.name.value}`)).rawSDL}\` as TypedDocumentNode<${(_b = o.name) === null || _b === void 0 ? void 0 : _b.value}>`;
            const op = `${(0, pascal_case_1.pascalCase)(o.name.value)}${(0, pascal_case_1.pascalCase)(o.operation)}`;
            const opv = `${op}Variables`;
            let operation;
            if (o.operation == "query") {
                operation = `export const ${o.name.value} = (
            client: ApolloClient<NormalizedCacheObject>,
            options: Omit<WatchQueryOptions<${opv}>, "query">
          ) => {
            const query = client.watchQuery<${op}, ${opv}>({
              query: ${(0, pascal_case_1.pascalCase)(o.name.value)}Doc,
              ...options,
            });
            const currentResult = query.getCurrentResult();
            const result = readable<ApolloQueryResult<${op} | undefined>>(
              { ...currentResult },
              (set) => { query.subscribe(v => set({ ...v })) }
            );
            return {
              ...result,
              query,
            };
          }
        `;
                if (config.asyncQuery) {
                    operation =
                        operation +
                            `
              export const Async${o.name.value} = (
                client: ApolloClient<NormalizedCacheObject>,
                options: Omit<
                  QueryOptions<${opv}>,
                  "query"
                >
              ) => {
                return client.query<${op}>({query: ${(0, pascal_case_1.pascalCase)(o.name.value)}Doc, ...options})
              }
            `;
                }
            }
            if (o.operation == "mutation") {
                operation = `export const ${o.name.value} = (
            client: ApolloClient<NormalizedCacheObject>,
            options: Omit<
              MutationOptions<any, ${opv}>, 
              "mutation"
            >
          ) => {
            const m = client.mutate<${op}, ${opv}>({
              mutation: ${(0, pascal_case_1.pascalCase)(o.name.value)}Doc,
              ...options,
            });
            return m;
          }`;
            }
            if (o.operation == "subscription") {
                operation = `export const ${o.name.value} = (
            client: ApolloClient<NormalizedCacheObject>,
            options: Omit<SubscriptionOptions<${opv}>, "query">
          ) => {
            const q = client.subscribe<${op}, ${opv}>(
              {
                query: ${(0, pascal_case_1.pascalCase)(o.name.value)}Doc,
                ...options,
              }
            )
            return q;
          }`;
            }
            return operation;
        })
            .join("\n");
        return {
            prepend: imports,
            content: [
                visitor.fragments,
                ...visitorResult.definitions.filter((t) => typeof t == "string"),
                ops,
            ].join("\n"),
        };
    },
    validate: (schema, documents, config, outputFile, allPlugins) => {
        if (!config.clientPath) {
            console.warn("Client path is not present in config");
        }
    },
};
