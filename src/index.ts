import { CodegenPlugin } from "@graphql-codegen/plugin-helpers";
import {
  ClientSideBaseVisitor,
  LoadedFragment,
} from "@graphql-codegen/visitor-plugin-common";
import {
  concatAST,
  FragmentDefinitionNode,
  Kind,
  OperationDefinitionNode,
  visit,
} from "graphql";
import { pascalCase } from "pascal-case";

// const visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");

const operationMap = {
  query: "query",
  subscription: "subscribe",
  mutation: "mutate",
};

module.exports = {
  plugin: (schema, documents, config, info) => {
    const allAst = concatAST(documents.map((d) => d.document));

    const allFragments: LoadedFragment[] = [
      ...(
        allAst.definitions.filter(
          (d) => d.kind === Kind.FRAGMENT_DEFINITION
        ) as FragmentDefinitionNode[]
      ).map((fragmentDef) => ({
        node: fragmentDef,
        name: fragmentDef.name.value,
        onType: fragmentDef.typeCondition.name.value,
        isExternal: false,
      })),
      ...(config.externalFragments || []),
    ];

    const visitor = new ClientSideBaseVisitor(
      schema,
      allFragments,
      {},
      { documentVariableSuffix: "Doc" },
      documents
    );
    const visitorResult = visit(allAst, visitor);

    const operations = allAst.definitions.filter(
      (d) => d.kind === Kind.OPERATION_DEFINITION
    ) as OperationDefinitionNode[];

    const imports = [
      `import type { ApolloClient, ObservableQuery } from "@apollo/client";`,
      `import { readable } from "svelte/store";`,
      `import gql from "graphql-tag"`,
    ];

    const ops = operations
      .map((o) => {
        // const dsl = `export const ${o.name?.value}Doc: TypedDocumentNode<${o.name?.value}> = gql\`${
        //   documents.find((d) =>
        //     d.rawSDL.includes(`${o.operation} ${o.name.value}`)
        //   ).rawSDL
        // }\``;
        const op = `${pascalCase(o.name.value)}${pascalCase(o.operation)}`;
        const opv = `${op}Variables`;
        let operation;
        if (o.operation == "query") {
          operation = `export const ${o.name.value} = (
            client: ApolloClient,
            options: Omit<ApolloClient.WatchQueryOptions<${op}, ${opv}>, "query" | "returnPartialData">
          ) => {
            const query = client.watchQuery<${op}, ${opv}>({
              query: ${pascalCase(o.name.value)}Doc,
              ...options,
            });
            const currentResult = query.getCurrentResult() as any;
            const result = readable<ObservableQuery.Result<${op} | undefined, "empty" | "complete">>(
              { ...currentResult },
              (set) => { query.subscribe((v: any) => set({ ...v })) }
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
                client: ApolloClient,
                options: Omit<ApolloClient.QueryOptions<${op}, ${opv}>, "query">
              ) => {
                return client.query<${op}>({query: ${pascalCase(
                o.name.value
              )}Doc, ...options})
              }
            `;
          }
        }
        if (o.operation == "mutation") {
          operation = `export const ${o.name.value} = (
            client: ApolloClient,
            options: Omit<ApolloClient.MutateOptions<${op}, ${opv}>, "mutation">
          ) => {
            const m = client.mutate<${op}, ${opv}>({
              mutation: ${pascalCase(o.name.value)}Doc,
              ...options,
            });
            return m;
          }`;
        }
        if (o.operation == "subscription") {
          operation = `export const ${o.name.value} = (
            client: ApolloClient,
            options: Omit<ApolloClient.SubscribeOptions<${op}, ${opv}>, "query">
          ) => {
            const q = client.subscribe<${op}, ${opv}>({
                query: ${pascalCase(o.name.value)}Doc,
                ...options,
            });
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
} as CodegenPlugin;
