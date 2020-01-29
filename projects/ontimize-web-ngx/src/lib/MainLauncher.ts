import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { NgModuleRef } from '@angular/core';

export function ontimizeBootstrap(appModule: any, config?: any): Promise<NgModuleRef<any>> {
  const promise = platformBrowserDynamic().bootstrapModule(appModule);
  promise.then(moduleRef => {
    console.log('Bootstrap Successful');
    return ontimizePostBootstrap(moduleRef);
  }).catch(err => {
    console.error(err.message);
  });

  return promise;
}

export function ontimizePostBootstrap(ngModuleRef: NgModuleRef<any>): NgModuleRef<any> {
  // Hiding loader...
  const loader: HTMLElement = document && document.getElementById('loader-wrapper');
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
  }
  return ngModuleRef;
}
