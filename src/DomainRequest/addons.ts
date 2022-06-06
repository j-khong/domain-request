import { DomainExpandables, DomainWithExpandablesRequest, DomainWithExpandablesRequestBuilder } from './expandables';
import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple';
import { DomainFields, InputErrors, RequestableFields, Tree } from './types';

export class AddOnManager {
   private readonly map: Map<string, any>;
   constructor() {
      this.map = new Map();
   }

   setExtended<Name extends string>(name: Name): void {
      this.map.set(`extended-${name}`, new ExtendedDRBAddOn());
   }

   getExtended<Name extends string, Fields extends DomainFields, Extended>(
      name: Name,
   ): ExtendedDRBAddOn<Name, Fields, Extended> {
      const v = this.map.get(`extended-${name}`);
      if (v === undefined) {
         throw new Error(`Request builder ${name} not initialized with Extended Requests builders`);
      }

      return v;
   }

   setExpandables<Name extends string, Fields extends DomainFields, Expandables extends DomainExpandables>(
      name: Name,
      expandablesRequestsBuilders: {
         [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>;
      },
   ): void {
      this.map.set(`expandables-${name}`, new ExpandablesDRBAddOn(expandablesRequestsBuilders));
   }

   getExpandables<Name extends string, Fields extends DomainFields, Expandables extends DomainExpandables>(
      name: Name,
   ): ExpandablesDRBAddOn<Name, Fields, Expandables> {
      const v = this.map.get(`expandables-${name}`);
      if (v === undefined) {
         throw new Error(`Request builder ${name} not initialized with Expandables Requests builders`);
      }

      return v;
   }
}

export interface IsExtended<Name extends string, Fields extends DomainFields, Extended> {
   isToSelectOrHasToSelect: (key: keyof RequestableFields<Fields>) => boolean;

   getExtendedFields: (k: Extract<keyof Extended, string>) => RequestableFields<Extended> | undefined;

   getExtended: () => {
      [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
   };
}

export interface IsExpandable<Name extends string, Expandables extends DomainExpandables> {
   getExpandables: () => {
      [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
   };
}

export interface HasExpandables<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> {
   setExpandables: (expandablesRequestsBuilders: {
      [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>;
   }) => void;
}

export class ExpandablesDRBAddOn<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> {
   constructor(
      private readonly expReqBuilders:
         | {
              [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>;
           },
   ) {}

   public buildExpandablesRequests(
      drbName: Name,
      camelToInputStyle: (o: any) => any,
      inputFieldsToSelect: Tree,
      dontDoThese: Name[],
   ): {
      requests: {
         [Property in keyof Expandables]: DomainWithExpandablesRequest<Name, Fields, Expandables>;
      };
      errors: InputErrors;
   } {
      if (this.expReqBuilders === undefined) {
         throw new Error(`Request builder ${drbName} not initialized with Expandables Requests builders`);
      }
      const ret: any = { requests: {}, errors: [] };
      for (const key in this.expReqBuilders) {
         // key can be a currentContext name => take the global context name
         const globalContextName = this.expReqBuilders[key].getName();
         if (dontDoThese.includes(globalContextName)) {
            continue;
         }
         const input = inputFieldsToSelect[camelToInputStyle(key)] as Tree;
         const built = this.expReqBuilders[key] // as DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>
            .build(input, [...dontDoThese, drbName]);
         ret.requests[key] = built.request; // as DomainWithExpandablesRequest<Name, Fields, Expandables>;
         ret.errors.push(...built.errors);
      }
      return ret as {
         requests: {
            [Property in keyof Expandables]: DomainWithExpandablesRequest<Name, Fields, Expandables>;
         };
         errors: InputErrors;
      };
   }
}

export class ExtendedDRBAddOn<Name extends string, Fields extends DomainFields, Extended> {
   buildExtendedRequests(
      extended: {
         [Property in keyof Extended]: SimpleDomainRequestBuilder<any, any>;
      },
      camelToInputStyle: (o: any) => any,
      fields: { [key: string]: any },
      sanitizedFields: {
         fields: RequestableFields<Fields>;
         errors: InputErrors;
      },
   ): {
      [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
   } {
      const extendedDomainRequests: any = {};
      for (const field in extended) {
         const snakedFieldName = camelToInputStyle(field);
         const val = fields[snakedFieldName];
         const dr = extended[field].build(val);
         extendedDomainRequests[field] = dr.request;
         sanitizedFields.fields[field] = dr.request.getFields();
         sanitizedFields.errors.push(...dr.errors);
      }
      return extendedDomainRequests as {
         [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
      };
   }
}
