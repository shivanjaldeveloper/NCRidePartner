// Type declarations for the '@env' virtual module that react-native-dotenv
// provides at build time (via its babel plugin — see babel.config.js).
// Without this, TypeScript doesn't know what `import { X } from '@env'`
// resolves to. Add a line here for every var used in .env / .env.example.
declare module '@env' {
  export const API_BEARER_TOKEN: string;
  export const GOOGLE_MAPS_API_KEY: string;
  export const RAZORPAY_KEY_ID: string;
}
