import React, { lazy, ComponentType } from 'react';

export function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<any>,
  exportName?: string
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('lazy-retry-refreshed') === 'true';
    try {
      const module = await componentImport();
      sessionStorage.setItem('lazy-retry-refreshed', 'false');
      
      if (exportName && module[exportName]) {
        return { default: module[exportName] };
      }
      if (module.default) {
        return { default: module.default };
      }
      // Fallback if exported with named export
      const keys = Object.keys(module);
      if (keys.length > 0 && module[keys[0]]) {
        return { default: module[keys[0]] };
      }
      return module;
    } catch (error) {
      console.error('[lazyRetry] Failed to dynamically load module:', error);
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem('lazy-retry-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}
