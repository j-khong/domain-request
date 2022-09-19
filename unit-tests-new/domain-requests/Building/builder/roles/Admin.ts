import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

const role = 'admin';

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Type.Fields> {
   constructor() {
      super(Type.domainRequestName, ['id'], createDomainConfig());
   }
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();

   const dc = createDomainConfigGeneric(Type.domainRequestName, fieldMapping);
   Type.initDomainConfigWithDeps(dc, role);
   return dc;
}
