export const environment = {
  production: true,
  apiUrl: '/api/v1',
  // Same origin in prod; nginx routes /api/v1/documents to the documents-service.
  documentsApiUrl: '/api/v1',
};
