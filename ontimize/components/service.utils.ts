import { Router } from '@angular/router';
import { OFormComponent } from './form/o-form.component';
import { OFormValue } from '../components/form/OFormValue';
import { Codes, Util } from '../utils';

export interface ISQLOrder {
  columnName: string;
  ascendent: boolean;
}

export class ServiceUtils {

  static getParentItemFromForm(parentItem: any, parentKeysObject: Object, form: OFormComponent) {
    let result = parentItem;
    const parentKeys = Object.keys(parentKeysObject || {});
    const formDataProperties = Object.keys(form ? form.getDataValues() : {});

    if (parentKeys && parentKeys.length > 0 && parentItem === undefined && formDataProperties.length > 0) {
      let partialResult = {};
      parentKeys.forEach(key => {
        const formFieldAttr = parentKeysObject[key];
        if (formDataProperties.indexOf(formFieldAttr) !== -1) {
          let currentData = form.getDataValue(formFieldAttr);
          if (currentData instanceof OFormValue) {
            currentData = currentData.value;
          }
          switch (typeof (currentData)) {
            case 'string':
              if (currentData.trim().length > 0) {
                partialResult[key] = currentData.trim();
              }
              break;
            case 'number':
              if (!isNaN(currentData)) {
                partialResult[key] = currentData;
              }
              break;
          }
        }
      });
      if (Object.keys(partialResult).length > 0) {
        result = partialResult;
      }
    }
    return result;
  }

  static getFilterUsingParentKeys(parentItem: any, parentKeysObject: Object) {
    let filter = {};
    const parentKeys = Object.keys(parentKeysObject || {});

    if ((parentKeys.length > 0) && (typeof (parentItem) !== 'undefined')) {
      for (let k = 0; k < parentKeys.length; ++k) {
        let parentKey = parentKeys[k];
        if (parentItem.hasOwnProperty(parentKey)) {
          let currentData = parentItem[parentKey];
          if (currentData instanceof OFormValue) {
            currentData = currentData.value;
          }
          filter[parentKey] = currentData;
        }
      }
    }
    return filter;
  }

  static getArrayProperties(array: any[], properties: any[]): any[] {
    const result = array.map(item => {
      return ServiceUtils.getObjectProperties(item, properties);
    });
    return result;
  }

  static getObjectProperties(object: any, properties: any[]): any {
    let objectProperties = {};
    properties.forEach(key => {
      objectProperties[key] = object[key];
    });
    return objectProperties;
  }

  static parseSortColumns(sortColumns: string): Array<ISQLOrder> {
    let sortColArray = [];
    if (sortColumns) {
      let cols = Util.parseArray(sortColumns);
      cols.forEach((col) => {
        let colDef = col.split(Codes.TYPE_SEPARATOR);
        if (colDef.length > 0) {
          let colName = colDef[0];
          const colSort = colDef[1] || Codes.ASC_SORT;
          sortColArray.push({
            columnName: colName,
            ascendent: colSort === Codes.ASC_SORT
          });
        }
      });
    }
    return sortColArray;
  }

  static redirectLogin(router: Router, sessionExpired: boolean = false) {
    let arg = {};
    arg[Codes.SESSION_EXPIRED_KEY] = sessionExpired;
    let extras = {};
    extras[Codes.QUERY_PARAMS] = arg;
    router.navigate([Codes.LOGIN_ROUTE], extras);
  }

}
