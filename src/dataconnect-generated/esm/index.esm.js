import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'pedasys-web',
  location: 'us-east4'
};

export const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';

export function createUser(dc) {
  return executeMutation(createUserRef(dc));
}

export const listWebsitesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListWebsites');
}
listWebsitesRef.operationName = 'ListWebsites';

export function listWebsites(dc) {
  return executeQuery(listWebsitesRef(dc));
}

export const updateWebsiteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateWebsite', inputVars);
}
updateWebsiteRef.operationName = 'UpdateWebsite';

export function updateWebsite(dcOrVars, vars) {
  return executeMutation(updateWebsiteRef(dcOrVars, vars));
}

export const getPublishedWebsitesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublishedWebsites');
}
getPublishedWebsitesRef.operationName = 'GetPublishedWebsites';

export function getPublishedWebsites(dc) {
  return executeQuery(getPublishedWebsitesRef(dc));
}

