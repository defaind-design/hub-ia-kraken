// Environment configuration for development
export const environment = {
  production: false,
  
  // Firebase Configuration
  firebase: {
    apiKey: 'AIzaSyDexample1234567890abcdefghijklmnopqrstuvwxyz',
    authDomain: 'hub-kraken-ia.firebaseapp.com',
    projectId: 'hub-kraken-ia',
    storageBucket: 'hub-kraken-ia.appspot.com',
    messagingSenderId: '1234567890',
    appId: '1:1234567890:web:abcdef123456'
  },
  
  // Cloud Function URL
  cloudFunctionUrl: 'https://ontick-lqmsjj5pua-uc.a.run.app',
  
  // Default session configuration
  defaultSessionId: 'demo-session-123',
  defaultOrganizationId: 'demo-org-123',
  defaultUserId: 'demo-user-123',
  
  // Typewriter settings
  typewriterSpeed: 20, // ms per character
  autoScrollThreshold: 50 // pixels from bottom
};