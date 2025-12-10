const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'pedasys-web',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const listWebsitesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListWebsites');
}
listWebsitesRef.operationName = 'ListWebsites';
exports.listWebsitesRef = listWebsitesRef;

exports.listWebsites = function listWebsites(dc) {
  return executeQuery(listWebsitesRef(dc));
};

const updateWebsiteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateWebsite', inputVars);
}
updateWebsiteRef.operationName = 'UpdateWebsite';
exports.updateWebsiteRef = updateWebsiteRef;

exports.updateWebsite = function updateWebsite(dcOrVars, vars) {
  return executeMutation(updateWebsiteRef(dcOrVars, vars));
};

const getPublishedWebsitesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublishedWebsites');
}
getPublishedWebsitesRef.operationName = 'GetPublishedWebsites';
exports.getPublishedWebsitesRef = getPublishedWebsitesRef;

exports.getPublishedWebsites = function getPublishedWebsites(dc) {
  return executeQuery(getPublishedWebsitesRef(dc));
};
