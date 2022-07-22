import { Operator } from '../../DomainRequest/index.ts';

export type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: keyof Fields;
      fullFieldToSelect: string;
      convertToDomain: (o: any) => any;
   }
>;
export type Join = Map<
   string, // table name
   {
      relationship: string;
      filters: string[];
   }
>;
export type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
export type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, value: number | string | number[] | string[]) => string;
   };
};
