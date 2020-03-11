import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

import { AppConfig } from '../config/app-config';
import { IAuthService } from '../interfaces/auth-service.interface';
import { IDataService } from '../interfaces/data-service.interface';
import { Config } from '../types/config.type';
import { Codes } from '../util/codes';
import { ServiceUtils } from '../util/service.utils';
import { Util } from '../util/util';
import { LoginStorageService } from './login-storage.service';
import { OntimizeServiceResponseParser } from './parser/o-service-response.parser';

@Injectable()
export class OntimizeEEService implements IAuthService, IDataService {

  public path: string = '';
  public kv: object = {};
  public av: Array<string> = [];
  public sqltypes: object = {};
  public pagesize: number = 10;
  public offset: number = 0;
  public orderby: Array<object> = [];
  public totalsize: number = -1;

  protected httpClient: HttpClient;
  protected _sessionid: string;
  protected _urlBase: string;
  protected _appConfig: Config;
  protected _config: AppConfig;
  protected _startSessionPath: string;
  protected responseParser: OntimizeServiceResponseParser;
  protected loginStorageService: LoginStorageService;

  constructor(protected injector: Injector) {
    this.httpClient = this.injector.get(HttpClient);
    this._config = this.injector.get(AppConfig);
    this._appConfig = this._config.getConfiguration();
    this.responseParser = this.injector.get(OntimizeServiceResponseParser);
    this.loginStorageService = this.injector.get(LoginStorageService);
  }

  public getDefaultServiceConfiguration(serviceName?: string) {
    const configuration = this._config.getServiceConfiguration();

    let servConfig = {};
    if (serviceName && configuration.hasOwnProperty(serviceName)) {
      servConfig = configuration[serviceName];
    }
    servConfig[Codes.SESSION_KEY] = this.loginStorageService.getSessionInfo();
    return servConfig;
  }

  public configureService(config: any): void {
    this._urlBase = config.urlBase ? config.urlBase : this._appConfig.apiEndpoint;
    this._sessionid = config.session ? config.session.id : -1;
    this.path = config.path;
    this._startSessionPath = this._appConfig.startSessionPath ? this._appConfig.startSessionPath : '/users/login';
    // TODO init other params
  }

  public get urlBase(): string {
    return this._urlBase;
  }

  public set urlBase(value: string) {
    this._urlBase = value;
  }

  public startsession(user: string, password: string) {
    const url = this.urlBase + this._startSessionPath;
    const options: any = {
      headers: new HttpHeaders({
        Authorization: 'Basic ' + btoa(user + ':' + password)
      }),
      observe: 'response'
    };
    const self = this;
    const startSessionObservable = new Observable(_startSessionObserver => {
      self.httpClient.post(url, null, options).subscribe((resp: any) => {
        if (Util.isDefined(resp) && Util.isDefined(resp.headers) && Util.isDefined(resp.headers.get('X-Auth-Token'))) {
          _startSessionObserver.next(resp.headers.get('X-Auth-Token'));
        } else {
          // Invalid sessionId...
          _startSessionObserver.error('Invalid user or password');
        }
      }, error => _startSessionObserver.error(error));
    });
    return startSessionObservable;
  }

  public endsession(user: string, sessionId: any): Observable<any> {
    let _closeSessionObserver: any;
    const closeSessionObservable = new Observable(observer => _closeSessionObserver = observer).pipe(share());
    setTimeout(() => {
      _closeSessionObserver.next(0);
    }, 0);
    return closeSessionObservable;
  }

  public hassession(user: string, sessionId: any): Observable<any> {
    let _observer: any;
    const observable = new Observable(observer => _observer = observer).pipe(share());
    return observable;
  }

  public query(kv?: object, av?: Array<string>, entity?: string, sqltypes?: object): Observable<any> {
    // TODO improve this -> merge between global conf and specific params of method calling
    kv = (Util.isDefined(kv)) ? kv : this.kv;
    av = (Util.isDefined(av)) ? av : this.av;
    sqltypes = (Util.isDefined(sqltypes)) ? sqltypes : this.sqltypes;

    const url = this._urlBase + this.path + '/' + entity + '/search';
    const options = {
      headers: this.buildHeaders()
    };
    const body = JSON.stringify({
      filter: kv,
      columns: av,
      sqltypes: sqltypes
    });
    const self = this;
    const dataObservable: Observable<any> = new Observable(_innerObserver => {
      self.httpClient.post(url, body, options).subscribe(resp => {
        self.parseSuccessfulQueryResponse(resp, _innerObserver);
      }, error => {
        self.parseUnsuccessfulQueryResponse(error, _innerObserver);
      }, () => _innerObserver.complete());
    });
    return dataObservable.pipe(share());
  }

  public advancedQuery(kv?: object, av?: Array<string>, entity?: string, sqltypes?: object,
    offset?: number, pagesize?: number, orderby?: Array<object>): Observable<any> {

    // TODO improve this -> merge between global conf and specific params of method calling
    kv = (Util.isDefined(kv)) ? kv : this.kv;
    av = (Util.isDefined(av)) ? av : this.av;
    sqltypes = (Util.isDefined(sqltypes)) ? sqltypes : this.sqltypes;
    orderby = (Util.isDefined(orderby)) ? orderby : this.orderby;

    offset = (Util.isDefined(offset)) ? offset : this.offset;
    pagesize = (Util.isDefined(pagesize)) ? pagesize : this.pagesize;

    const url = this._urlBase + this.path + '/' + entity + '/advancedsearch';
    const options = {
      headers: this.buildHeaders()
    };
    const body = JSON.stringify({
      filter: kv,
      columns: av,
      sqltypes: sqltypes,
      offset: offset,
      pageSize: pagesize,
      orderBy: orderby
    });
    const self = this;
    const dataObservable: Observable<any> = new Observable(_innerObserver => {
      self.httpClient.post(url, body, options).subscribe(resp => {
        self.parseSuccessfulAdvancedQueryResponse(resp, _innerObserver);
      }, error => {
        self.parseUnsuccessfulAdvancedQueryResponse(error, _innerObserver);
      }, () => _innerObserver.complete());
    });
    return dataObservable.pipe(share());
  }

  public insert(av: object = {}, entity: string, sqltypes?: object): Observable<any> {
    const url = this._urlBase + this.path + '/' + entity;
    const options = {
      headers: this.buildHeaders()
    };
    const body = JSON.stringify({
      data: av,
      sqltypes: sqltypes
    });
    const self = this;
    const dataObservable: Observable<any> = new Observable(_innerObserver => {
      self.httpClient.post(url, body, options).subscribe(resp => {
        self.parseSuccessfulInsertResponse(resp, _innerObserver);
      }, error => {
        self.parseUnsuccessfulInsertResponse(error, _innerObserver);
      }, () => _innerObserver.complete());
    });
    return dataObservable.pipe(share());
  }

  public update(kv: object = {}, av: object = {}, entity?: string, sqltypes?: object): Observable<any> {
    const url = this._urlBase + this.path + '/' + entity;
    const options = {
      headers: this.buildHeaders()
    };
    const body = JSON.stringify({
      filter: kv,
      data: av,
      sqltypes: sqltypes
    });
    const self = this;
    const dataObservable: Observable<any> = new Observable(_innerObserver => {
      self.httpClient.put(url, body, options).subscribe(resp => {
        self.parseSuccessfulUpdateResponse(resp, _innerObserver);
      }, error => {
        self.parseUnsuccessfulUpdateResponse(error, _innerObserver);
      }, () => _innerObserver.complete());
    });
    return dataObservable.pipe(share());
  }

  public delete(kv: object = {}, entity?: string, sqltypes?: object): Observable<any> {
    const url = this._urlBase + this.path + '/' + entity;
    const headers: HttpHeaders = this.buildHeaders();
    const options: any = {
      headers: headers,
      body: JSON.stringify({
        filter: kv,
        sqltypes: sqltypes
      })
    };
    const self = this;
    const dataObservable: Observable<any> = new Observable(_innerObserver => {
      self.httpClient.delete(url, options).subscribe(resp => {
        self.parseSuccessfulDeleteResponse(resp, _innerObserver);
      }, error => {
        self.parseUnsuccessfulDeleteResponse(error, _innerObserver);
      }, () => _innerObserver.complete());
    });
    return dataObservable.pipe(share());
  }

  redirectLogin(sessionExpired: boolean = false) {
    const router = this.injector.get(Router);
    if (sessionExpired) {
      this.loginStorageService.sessionExpired();
    }
    ServiceUtils.redirectLogin(router, sessionExpired);
  }

  protected buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: 'Bearer ' + this._sessionid
    });
  }

  /*
   * Successful response parsers, there is one parser for each CRUD method which calls to the common parser.
   * User can overwrite the chosen methods parsers or the common parser
   */
  protected parseSuccessfulResponse(resp: any, _innerObserver: any) {
    this.responseParser.parseSuccessfulResponse(resp, _innerObserver, this);
  }

  protected parseSuccessfulQueryResponse(resp: any, _innerObserver: any) {
    this.parseSuccessfulResponse(resp, _innerObserver);
  }

  protected parseSuccessfulAdvancedQueryResponse(resp: any, _innerObserver: any) {
    this.parseSuccessfulResponse(resp, _innerObserver);
  }

  protected parseSuccessfulInsertResponse(resp: any, _innerObserver: any) {
    this.parseSuccessfulResponse(resp, _innerObserver);
  }

  protected parseSuccessfulUpdateResponse(resp: any, _innerObserver: any) {
    this.parseSuccessfulResponse(resp, _innerObserver);
  }

  protected parseSuccessfulDeleteResponse(resp: any, _innerObserver: any) {
    this.parseSuccessfulResponse(resp, _innerObserver);
  }

  /*
   * Unsuccessful response parsers, there is one parser for each CRUD method which calls to the common parser.
   * User can overwrite the chosen methods parsers or the common parser
   */
  protected parseUnsuccessfulResponse(error: any, _innerObserver: any) {
    this.responseParser.parseUnsuccessfulResponse(error, _innerObserver, this);
  }

  protected parseUnsuccessfulQueryResponse(resp: any, _innerObserver: any) {
    this.parseUnsuccessfulResponse(resp, _innerObserver);
  }

  protected parseUnsuccessfulAdvancedQueryResponse(resp: any, _innerObserver: any) {
    this.parseUnsuccessfulResponse(resp, _innerObserver);
  }

  protected parseUnsuccessfulInsertResponse(resp: any, _innerObserver: any) {
    this.parseUnsuccessfulResponse(resp, _innerObserver);
  }

  protected parseUnsuccessfulUpdateResponse(resp: any, _innerObserver: any) {
    this.parseUnsuccessfulResponse(resp, _innerObserver);
  }

  protected parseUnsuccessfulDeleteResponse(resp: any, _innerObserver: any) {
    this.parseUnsuccessfulResponse(resp, _innerObserver);
  }

}
