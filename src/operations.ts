import { Types } from "@graphql-codegen/plugin-helpers";
import { Kind, OperationTypeNode } from "graphql";
import { Config } from "./config";
import { pascalCase } from "change-case";

export function generateOperations(documents: Types.DocumentFile[], config: Config) {
	const result: string[] = [];

	for (const document of documents) {
		if (document.document == null) {
			continue;
		}

		for (const definition of document.document.definitions) {
			if (definition.kind !== Kind.OPERATION_DEFINITION) {
				continue;
			}

			const opName = definition.name?.value;
			if (opName == null) {
				continue;
			}

			const opType = pascalCase(opName);
			const opTypeWithOp = `${opType}${pascalCase(definition.operation)}`;
			const opVariables = `${opTypeWithOp}Variables`;

			switch (definition.operation) {
				case OperationTypeNode.QUERY:
					result.push(generateQueryOperation(opName, opTypeWithOp, opVariables));
					break;
				case OperationTypeNode.MUTATION:
					result.push(generateMutationOperation(opName, opTypeWithOp, opVariables));
					break;
				case OperationTypeNode.SUBSCRIPTION:
					result.push(generateSubscriptionOperation(opName, opTypeWithOp, opVariables));
					break;
			}
		}
	}

	return result.join("\n\n");
}

const generateQueryOperation = (name: string, typeWithOp: string, variables: string) =>
	`export const ${name} = (
  client: ApolloClient,
  options: Omit<ApolloClient.WatchQueryOptions<${typeWithOp}, ${variables}>, "query" | "returnPartialData"> & { immediate?: boolean }
) => {
  const query = client.watchQuery<${typeWithOp}, ${variables}>({
    query: ${pascalCase(name)}Doc,
    ...options,
  });
  const currentResult = query.getCurrentResult() as any;
  const result = readable<ObservableQuery.Result<${typeWithOp} | undefined, "empty" | "complete">>(
    { ...currentResult },
    (set) => {
      const subscription = query.subscribe((v: any) => set({ ...v }));
      return () => subscription.unsubscribe();
    }
  );
  if (options.immediate !== false) {
    get(result);
  }
  return { ...result, query, };
};

export const Async${name} = (
  client: ApolloClient,
  options: Omit<ApolloClient.QueryOptions<${typeWithOp}, ${variables}>, "query">
) => {
  return client.query<${typeWithOp}, ${variables}>({
    query: ${pascalCase(name)}Doc,
    ...options,
  });
};`;

const generateMutationOperation = (name: string, typeWithOp: string, variables: string) =>
	`export const ${name} = (
  client: ApolloClient,
  options: Omit<ApolloClient.MutateOptions<${typeWithOp}, ${variables}>, "mutation">
) => {
  return client.mutate<${typeWithOp}, ${variables}>({
    mutation: ${pascalCase(name)}Doc,
    ...options,
  });
};`;

const generateSubscriptionOperation = (name: string, typeWithOp: string, variables: string) =>
	`export const ${name} = (
  client: ApolloClient,
  options: Omit<ApolloClient.SubscribeOptions<${typeWithOp}, ${variables}>, "query">
) => {
  return client.subscribe<${typeWithOp}, ${variables}>({
    query: ${pascalCase(name)}Doc,
    ...options,
  });
};`;
