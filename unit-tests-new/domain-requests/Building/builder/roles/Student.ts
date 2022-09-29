import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

const role = 'student';
const selectedFields = ['id', 'name', 'status', 'pictures', 'sponsors', 'architect'] as const;
type FieldsList = typeof selectedFields[number];
type Fields = Pick<Type.Fields, FieldsList>;
const authorizedFields = selectedFields.map((v) => v as keyof Fields);

export function buildRequestBuilder(): DomainRequestBuilder<DomainRequestName, Type.Fields> {
   return new DomainRequestBuilder<DomainRequestName, Type.Fields>(
      Type.domainRequestName,
      ['id'],
      createDomainConfig(),
   );
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();
   fieldMapping.status.addAuthorized(['opened', 'work in progress']);

   const dc = createDomainConfigGeneric(Type.domainRequestName, fieldMapping, authorizedFields);
   Type.initDomainConfigWithDeps(dc, role);
   return dc;
}
