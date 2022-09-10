import { DomainRequestBuilder, createDomainConfig as createDomainConfigGeneric } from '../../../../mod2.ts';
import { DomainRequestName } from '../../../types.ts';
import * as Type from '../../types.ts';

const selectedFields = ['id', 'name', 'publishedDate', 'isMultilanguage', 'status'] as const;
type FieldsList = typeof selectedFields[number];
type Fields = Pick<Type.Fields, FieldsList>;
const authorizedFields = selectedFields.map((v) => v as keyof Fields);

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Type.Fields> {
   constructor() {
      super(Type.domainRequestName, ['id'], createDomainConfig());
   }
}

export function createDomainConfig() {
   const fieldMapping = Type.generateFieldsSetup();
   fieldMapping.status.addAuthorized(['opened', 'validating']);

   const dc = createDomainConfigGeneric(Type.domainRequestName, fieldMapping, authorizedFields);
   return dc;
}
