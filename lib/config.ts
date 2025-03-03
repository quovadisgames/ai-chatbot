export const appConfig = {
  auth: {
    // Set to false to disable authentication requirement
    required: false,
    // Pages that should always require authentication regardless of auth.required setting
    protectedPages: ['/api/chat', '/api/history'],
    // Default user when auth is disabled
    defaultUser: {
      id: 'default-user',
      name: 'Default User',
      email: 'default@example.com',
      image: null
    }
  }
}; 