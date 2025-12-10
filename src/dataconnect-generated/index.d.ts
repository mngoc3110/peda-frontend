import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateUserData {
  user_insert: User_Key;
}

export interface GetPublishedWebsitesData {
  websites: ({
    id: UUIDString;
    name: string;
    urlSlug: string;
    description?: string | null;
  } & Website_Key)[];
}

export interface ListWebsitesData {
  websites: ({
    id: UUIDString;
    name: string;
    urlSlug: string;
  } & Website_Key)[];
}

export interface NavigationItem_Key {
  id: UUIDString;
  __typename?: 'NavigationItem_Key';
}

export interface Page_Key {
  id: UUIDString;
  __typename?: 'Page_Key';
}

export interface UpdateWebsiteData {
  website_update?: Website_Key | null;
}

export interface UpdateWebsiteVariables {
  id: UUIDString;
  name: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Website_Key {
  id: UUIDString;
  __typename?: 'Website_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListWebsitesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListWebsitesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListWebsitesData, undefined>;
  operationName: string;
}
export const listWebsitesRef: ListWebsitesRef;

export function listWebsites(): QueryPromise<ListWebsitesData, undefined>;
export function listWebsites(dc: DataConnect): QueryPromise<ListWebsitesData, undefined>;

interface UpdateWebsiteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateWebsiteVariables): MutationRef<UpdateWebsiteData, UpdateWebsiteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateWebsiteVariables): MutationRef<UpdateWebsiteData, UpdateWebsiteVariables>;
  operationName: string;
}
export const updateWebsiteRef: UpdateWebsiteRef;

export function updateWebsite(vars: UpdateWebsiteVariables): MutationPromise<UpdateWebsiteData, UpdateWebsiteVariables>;
export function updateWebsite(dc: DataConnect, vars: UpdateWebsiteVariables): MutationPromise<UpdateWebsiteData, UpdateWebsiteVariables>;

interface GetPublishedWebsitesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublishedWebsitesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublishedWebsitesData, undefined>;
  operationName: string;
}
export const getPublishedWebsitesRef: GetPublishedWebsitesRef;

export function getPublishedWebsites(): QueryPromise<GetPublishedWebsitesData, undefined>;
export function getPublishedWebsites(dc: DataConnect): QueryPromise<GetPublishedWebsitesData, undefined>;

