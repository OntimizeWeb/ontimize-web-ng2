import { Injectable } from '@angular/core';
import { TranslateDefaultParser } from '@ngx-translate/core';
import { Util } from '../../utils';

@Injectable()
export class OTranslateParser extends TranslateDefaultParser {
  public templateMatcher: RegExp = /{\s?([0-9][^{}\s]*)\s?}/g;

  public interpolate(expr: string, params?: any): string {
    if (typeof expr !== 'string' || !params) {
      return expr;
    }
    return expr.replace(this.templateMatcher, (substring: string, index: string) => {
      return !isNaN(parseInt(index)) && Util.isDefined(params[index]) ? params[index] : substring;
    });
  }
}


