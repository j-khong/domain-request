import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

export function buildRequestBuilder(): DomainRequestBuilder<DomainRequestName, Type.Fields> {
   return new DomainRequestBuilder<DomainRequestName, Type.Fields>(
      Type.domainRequestName,
      ['id'],
      createDomainConfig(),
   );
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();
   return createDomainConfigGeneric(Type.domainRequestName, fieldMapping);
}
