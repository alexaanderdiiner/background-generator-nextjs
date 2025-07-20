// Version information for the app
// This file can be auto-generated or manually updated

import packageJson from '../../package.json'

export const APP_VERSION = packageJson.version
export const ALPHA_VERSION = packageJson.alphaVersion

// For display purposes
export const getDisplayVersion = () => {
  return ALPHA_VERSION || 'alpha'
} 