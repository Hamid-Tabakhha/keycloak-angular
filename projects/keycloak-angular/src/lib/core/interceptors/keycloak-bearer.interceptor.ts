/**
 * @license
 * Copyright Mauricio Gemelli Vigolo and contributors.
 *
 * Use of this source code is governed by a MIT-style license that can be
 * found in the LICENSE file at https://github.com/mauriciovigolo/keycloak-angular/LICENSE
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';

import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { KeycloakService } from '../services/keycloak.service';
import { ExcludedUrlRegex } from '../interfaces/keycloak-options';

/**
 * This interceptor includes the bearer by default in all HttpClient requests.
 *
 * If you need to exclude some URLs from adding the bearer, please, take a look
 * at the {@link KeycloakOptions} bearerExcludedUrls property.
 */
@Injectable()
export class KeycloakBearerInterceptor implements HttpInterceptor {
  constructor(private keycloak: KeycloakService) {}

  /**
   * Checks if the url is excluded from having the Bearer Authorization
   * header added.
   *
   * @param req http request from @angular http module.
   * @param excludedUrlRegex contains the url pattern and the http methods,
   * excluded from adding the bearer at the Http Request.
   */
  private isUrlExcluded(
    { method, url }: HttpRequest<any>,
    { urlPattern, httpMethods }: ExcludedUrlRegex
  ): boolean {
    const httpTest =
      httpMethods.length === 0 ||
      httpMethods.join().indexOf(method.toUpperCase()) > -1;

    const urlTest = urlPattern.test(url);

    return httpTest && urlTest;
  }

  /**
   * Intercept implementation that checks if the request url matches the excludedUrls.
   * If not, adds the Authorization header to the request if the user is logged in.
   *
   * @param req
   * @param next
   */
    public intercept(req, next) {
        const { enableBearerInterceptor, excludedUrls } = this.keycloak;
        if (!enableBearerInterceptor) {
            return next.handle(req);
        }
        const shallPass = excludedUrls.findIndex(item => this.isUrlExcluded(req, item)) > -1;
        if (shallPass) {
            return next.handle(req);
        }
      return this.keycloak.addTokenToHeader(req.headers).pipe(mergeMap((headersWithBearer => {
        const kcReq = req.clone({ headers: headersWithBearer });
        if (req.body !== null) {
          req.body['origin_user'] = this.keycloak.getUsername();
          req.body['origin_user_id'] = this.keycloak.getUserIdentity().user_id;
        }
        return next.handle(kcReq);
      })));
    }

  /**
   * Adds the token of the current user to the Authorization header
   *
   * @param req
   * @param next
   */
  private handleRequestWithTokenHeader(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<any> {
    return this.keycloak.addTokenToHeader(req.headers).pipe(
      mergeMap((headersWithBearer) => {
        const kcReq = req.clone({ headers: headersWithBearer });
        return next.handle(kcReq);
      })
    );
  }
}
