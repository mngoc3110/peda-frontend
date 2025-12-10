import { CreateUserData, ListWebsitesData, UpdateWebsiteData, UpdateWebsiteVariables, GetPublishedWebsitesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListWebsites(options?: useDataConnectQueryOptions<ListWebsitesData>): UseDataConnectQueryResult<ListWebsitesData, undefined>;
export function useListWebsites(dc: DataConnect, options?: useDataConnectQueryOptions<ListWebsitesData>): UseDataConnectQueryResult<ListWebsitesData, undefined>;

export function useUpdateWebsite(options?: useDataConnectMutationOptions<UpdateWebsiteData, FirebaseError, UpdateWebsiteVariables>): UseDataConnectMutationResult<UpdateWebsiteData, UpdateWebsiteVariables>;
export function useUpdateWebsite(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateWebsiteData, FirebaseError, UpdateWebsiteVariables>): UseDataConnectMutationResult<UpdateWebsiteData, UpdateWebsiteVariables>;

export function useGetPublishedWebsites(options?: useDataConnectQueryOptions<GetPublishedWebsitesData>): UseDataConnectQueryResult<GetPublishedWebsitesData, undefined>;
export function useGetPublishedWebsites(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublishedWebsitesData>): UseDataConnectQueryResult<GetPublishedWebsitesData, undefined>;
