/**
 * Global Google Maps API type declarations
 * Centralized to prevent TS2687 conflicts
 */

export {};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, options?: any) => any;
        };
        event?: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
    __mapsApiLoader?: {
      loading: boolean;
      loaded: boolean;
      promise?: Promise<void>;
    };
    isMapsApiBlocked?: boolean;
  }
}

