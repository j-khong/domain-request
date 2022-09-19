import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Type.Fields> {
   constructor() {
      super(Type.domainRequestName, ['id'], createDomainConfig());
   }
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();

   return createDomainConfigGeneric(Type.domainRequestName, fieldMapping);
}
