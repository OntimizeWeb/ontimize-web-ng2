import { Pipe, PipeTransform, Injector } from '@angular/core';
import { NumberService } from '../services';

export interface IIntegerPipeArgument {
  grouping?: boolean;
  thousandSeparator?: string;
  locale?: string;
}

@Pipe({
  name: 'oInteger'
})

export class OIntegerPipe implements PipeTransform {

  protected numberService: NumberService;

  constructor(protected injector: Injector) {
    this.numberService = this.injector.get(NumberService);
  }

  transform(text: string, args: IIntegerPipeArgument): string {
    return this.numberService.getIntegerValue(text, args);
  }
}
