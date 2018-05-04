import { Injector, Injectable, ReflectiveInjector } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { OntimizeService, LoginService, OUserInfoService } from '../services';
import { AppConfig, Config } from '../config/app-config';
import { Util } from '../util/util';
import { dataServiceFactory } from './data-service.provider';

export interface IProfileService {
  isRestricted(route: string): Promise<boolean>;
  getPermissions(route: string, attr: string): Promise<any>;
}

@Injectable()
export class AuthGuardService implements CanActivate, IProfileService {

  public static PROFILE_ROUTE_PROPERTY = 'route';
  public static PROFILE_COMPONENTS_PROPERTY = 'components';

  protected router: Router;
  protected loginService: LoginService;
  protected oUserInfoService: OUserInfoService;
  protected config: Config;
  protected ontimizeService: any;
  protected service: any;
  protected entity: any;
  protected keyColumn: any;
  protected valueColumn: any;
  protected user: any;
  protected profile: any;
  protected profileObservable: Observable<any>;


  constructor(protected injector: Injector) {

    this.user = undefined;
    this.profile = undefined;
    this.router = this.injector.get(Router);
    this.loginService = this.injector.get(LoginService);
    this.oUserInfoService = this.injector.get(OUserInfoService);

    this.config = this.injector.get(AppConfig).getConfiguration();

    this.entity = undefined;
    this.keyColumn = undefined;
    this.valueColumn = undefined;
    if (typeof (this.config.authGuard) !== 'undefined') {
      if (typeof (this.config.authGuard.entity) !== 'undefined') {
        this.entity = this.config.authGuard.entity;
      }
      if (typeof (this.config.authGuard.keyColumn) !== 'undefined') {
        this.keyColumn = this.config.authGuard.keyColumn;
      }
      if (typeof (this.config.authGuard.valueColumn) !== 'undefined') {
        this.valueColumn = this.config.authGuard.valueColumn;
      }
      if (typeof (this.config.authGuard.service) !== 'undefined') {
        this.service = this.config.authGuard.service;
      }
    }
  }

  configureService() {
    let localInjector = ReflectiveInjector.resolveAndCreate([{ provide: OntimizeService, useFactory: dataServiceFactory, deps: [Injector] }], this.injector);

    this.ontimizeService = localInjector.get(OntimizeService);

    if (Util.isDataService(this.ontimizeService)) {
      let serviceCfg: Object = this.ontimizeService.getDefaultServiceConfiguration(this.service);
      if (this.entity) {
        serviceCfg['entity'] = this.entity;
        //serviceCfg[Codes.SESSION_KEY] = this.loginService.getSessionInfo();
      }
      this.ontimizeService.configureService(serviceCfg);
    }
  }

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let isLoggedIn = this.loginService.isLoggedIn();
    if (!isLoggedIn) {
      this.profile = undefined;
      this.router.navigate([LoginService.LOGIN_ROUTE]);
    } else if ((Util.isDefined(this.entity)) && (typeof (this.keyColumn) !== 'undefined') &&
      (typeof (this.valueColumn) !== 'undefined')) {
      if ((typeof (this.profile) === 'undefined') || (this.user !== this.loginService.user)) {
        this.user = undefined;
        this.profile = undefined;
        this.profileObservable = new Observable(observer => {
          // get user profile from service

          this.configureService();
          let filter: Object = {};
          filter[this.keyColumn] = this.loginService.user;
          this.ontimizeService.query(filter, [this.valueColumn], this.entity)
            .subscribe(
            (res: any) => {
              this.user = this.loginService.user;
              if ((res.code === 0) && (typeof (res.data) !== 'undefined') && (res.data.length === 1) &&
                (typeof (res.data[0]) === 'object')) {
                this.profile = res.data[0].hasOwnProperty(this.valueColumn) ? JSON.parse(res.data[0][this.valueColumn]) : {};
              } else {
                //TODO JEE?
              }
              observer.next();
              observer.complete();
            },
            (err: any) => {
              console.log('[AuthGuardService.canActivate]: error', err);
              observer.error(err);
            }
            );
        }).share();
        this.profileObservable
          .subscribe(
          res => {
            let restricted = this._isRestricted(state.url);
            if (restricted) {
              this.router.navigate([LoginService.LOGIN_ROUTE]);
            }
            return restricted;
          },
          err => {
            this.router.navigate([LoginService.LOGIN_ROUTE]);
            return false;
          }
          );
      } else if (this._isRestricted(state.url)) {
        this.router.navigate([LoginService.LOGIN_ROUTE]);
      }
    }
    if (isLoggedIn) {
      this.setUserInformation();
    }
    return isLoggedIn;
  }

  setUserInformation() {
    const sessionInfo = this.loginService.getSessionInfo();
    // TODO query user information
    this.oUserInfoService.setUserInfo({
      username: sessionInfo.user,
      avatar: './assets/images/user_profile.png'
    });
  }

  public isRestricted(route: string): Promise<boolean> {
    return new Promise(
      (resolve: any, reject: any) => {
        if ((Util.isDefined(this.entity)) && (typeof (this.keyColumn) !== 'undefined') &&
          (typeof (this.valueColumn) !== 'undefined') && (typeof (this.profile) === 'undefined')) {
          this.profileObservable
            .subscribe(
            res => {
              resolve(this._isRestricted(route));
            },
            err => {
              reject(false);
            }
            );
        } else {
          resolve(this._isRestricted(route));
        }
      }
    );
  }

  protected _isRestricted(route: string): boolean {
    let restricted = false;
    if (typeof (this.profile) !== 'undefined' && typeof (this.profile[AuthGuardService.PROFILE_ROUTE_PROPERTY]) !== 'undefined') {
      for (let routePrefix in this.profile[AuthGuardService.PROFILE_ROUTE_PROPERTY]) {
        if (this.profile[AuthGuardService.PROFILE_ROUTE_PROPERTY].hasOwnProperty(routePrefix)) {
          if (route.startsWith(routePrefix) && this.profile[AuthGuardService.PROFILE_ROUTE_PROPERTY][routePrefix] === false) {
            restricted = true;
            break;
          }
        }
      }
    }
    return restricted;
  }

  public getPermissions(route: string, attr: string): Promise<any> {
    return new Promise(
      (resolve: any, reject: any) => {
        if ((Util.isDefined(this.entity)) && (typeof (this.keyColumn) !== 'undefined') &&
          (typeof (this.valueColumn) !== 'undefined') && (typeof (this.profile) === 'undefined')) {
          this.profileObservable
            .subscribe(
            res => {
              resolve(this._getPermissions(route, attr));
            },
            err => {
              reject(undefined);
            }
            );
        } else {
          resolve(this._getPermissions(route, attr));
        }
      }
    );
  }

  protected _getPermissions(route: string, attr: string): any {
    let permissions = undefined;
    if (typeof (this.profile) !== 'undefined' && typeof (this.profile[AuthGuardService.PROFILE_COMPONENTS_PROPERTY]) !== 'undefined' &&
      typeof (this.profile[AuthGuardService.PROFILE_COMPONENTS_PROPERTY][route]) !== 'undefined' &&
      typeof (this.profile[AuthGuardService.PROFILE_COMPONENTS_PROPERTY][route][attr]) !== 'undefined') {
      permissions = this.profile[AuthGuardService.PROFILE_COMPONENTS_PROPERTY][route][attr];
    }
    return permissions;
  }

}
