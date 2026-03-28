import type { ApolloClient, ObservableQuery } from "@apollo/client";
import { get, readable } from "svelte/store";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: number; output: number; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Message = {
  __typename?: 'Message';
  id: Scalars['ID']['output'];
  tstamp?: Maybe<Scalars['String']['output']>;
  value: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  post?: Maybe<Message>;
};


export type MutationPostArgs = {
  msg: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  messages?: Maybe<Array<Message>>;
};

export type GetMessagesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMessagesQuery = { __typename?: 'Query', messages?: Array<{ __typename?: 'Message', id: number, value: string, tstamp?: string | null }> | null };

export type PostMessageMutationVariables = Exact<{
  msg: Scalars['String']['input'];
}>;


export type PostMessageMutation = { __typename?: 'Mutation', post?: { __typename?: 'Message', id: number, value: string } | null };


export const GetMessages = (
  client: ApolloClient,
  options: Omit<ApolloClient.WatchQueryOptions<GetMessagesQuery, GetMessagesQueryVariables>, "query" | "returnPartialData"> & { immediate?: boolean }
) => {
  const query = client.watchQuery<GetMessagesQuery, GetMessagesQueryVariables>({
    query: GetMessagesDoc,
    ...options,
  });
  const currentResult = query.getCurrentResult() as any;
  const result = readable<ApolloClient.ApolloQueryResult<GetMessagesQuery | undefined>>(
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

export const AsyncGetMessages = (
  client: ApolloClient,
  options: Omit<ApolloClient.QueryOptions<GetMessagesQuery, GetMessagesQueryVariables>, "query">
) => {
  return client.query<GetMessagesQuery, GetMessagesQueryVariables>({
    query: GetMessagesDoc,
    ...options,
  });
};

export const PostMessage = (
  client: ApolloClient,
  options: Omit<ApolloClient.MutateOptions<PostMessageMutation, PostMessageMutationVariables>, "mutation">
) => {
  return client.mutate<PostMessageMutation, PostMessageMutationVariables>({
    mutation: PostMessageDoc,
    ...options,
  });
};