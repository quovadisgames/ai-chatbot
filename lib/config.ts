export const appConfig = {
  auth: {
    // Set to false to disable authentication requirement
    required: false,
    // Pages that should always require authentication regardless of auth.required setting
    protectedPages: ['/api/chat', '/api/history']
  }
}; 