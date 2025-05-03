// Main index file to re-export all modules

// Core exports
export * from './core/Skills';

// Types exports
export * from './types/Repo';

// Interfaces exports
export * from './interfaces/IIdentity';

// UI exports
export * from './ui/Stylez';
export * from './ui/highlight/Main';

// API exports
export { default as GetAllRepos } from './api/GitHubRepos';

