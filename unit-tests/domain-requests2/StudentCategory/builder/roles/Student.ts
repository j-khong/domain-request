import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod2.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Type.Fields> {
   constructor() {
      super(Type.domainRequestName, ['id'], createDomainConfig());
   }
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();
   const authorizedFields: Array<keyof Type.Fields> = []; // STUDENT CANNOT GET ANY DATA FROM THIS DOMAIN
   return createDomainConfigGeneric(Type.domainRequestName, fieldMapping, authorizedFields);
}
