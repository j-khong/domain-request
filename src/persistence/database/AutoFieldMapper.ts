import { camelToSnake } from '../../domain-request/converters.ts';
import { SameTableMapping, TableDef, TableMapping } from './mapping.ts';
import {
   ToDbSqlBooleanConverter,
   ToDbSqlDateConverter,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToBoolean,
   unknownToIsoDate,
   unknownToNumber,
   unknownToString,
} from './converters.ts';

export type AutoMapFieldKind = 'string' | 'number' | 'boolean' | 'date' | 'isoDate';

export type AutoMapConvention<DomainField extends string, TableField extends string> = {
   namingPattern?: 'camelToSnakeCase' | 'identity';
   explicit?: Partial<Record<DomainField, TableField>>;
};

export type AutoFieldMapperOptions<DomainField extends string, TableField extends string> = {
   conventions?: AutoMapConvention<DomainField, TableField>;
   fieldKinds?: Partial<Record<DomainField, AutoMapFieldKind>>;
   domainConverters?: Partial<Record<DomainField, (o: unknown) => unknown | undefined>>;
};

function inferFieldKind(v: unknown): AutoMapFieldKind {
   if (typeof v === 'number') {
      return 'number';
   }
   if (typeof v === 'boolean') {
      return 'boolean';
   }
   if (v instanceof Date) {
      return 'date';
   }
   return 'string';
}

function buildDefaultMapper(kind: AutoMapFieldKind): {
   toDb: ToDbSqlStringConverter | ToDbSqlNumberConverter | ToDbSqlBooleanConverter | ToDbSqlDateConverter;
   toDomain: (o: unknown) => unknown | undefined;
} {
   switch (kind) {
      case 'number':
         return { toDb: new ToDbSqlNumberConverter(), toDomain: unknownToNumber };
      case 'boolean':
         return { toDb: new ToDbSqlBooleanConverter(), toDomain: unknownToBoolean };
      case 'date':
      case 'isoDate':
         return { toDb: new ToDbSqlDateConverter(), toDomain: unknownToIsoDate };
      case 'string':
      default:
         return { toDb: new ToDbSqlStringConverter(), toDomain: unknownToString };
   }
}

export class AutoFieldMapper {
   static generateMapping<Domain extends object, Table extends object>(
      tableDef: TableDef,
      domainShape: Domain,
      tableFields: readonly Extract<keyof Table, string>[],
      options?: AutoFieldMapperOptions<Extract<keyof Domain, string>, Extract<keyof Table, string>>,
   ): TableMapping<Extract<keyof Domain, string>> {
      const domainFields = Object.keys(domainShape) as Array<Extract<keyof Domain, string>>;
      const convention = options?.conventions;
      const namingPattern = convention?.namingPattern ?? 'camelToSnakeCase';

      const ret: Partial<TableMapping<Extract<keyof Domain, string>>> = {};

      for (const domainField of domainFields) {
         const explicitField = convention?.explicit?.[domainField];
         const autoField =
            namingPattern === 'identity'
               ? (domainField as unknown as Extract<keyof Table, string>)
               : camelToSnake(domainField as string);

         const tableField = (explicitField ?? autoField) as Extract<keyof Table, string>;
         if (!tableFields.includes(tableField)) {
            throw new Error(
               `AutoFieldMapper: cannot map domain field [${domainField}] to table field [${String(tableField)}]`,
            );
         }

         const fieldKind = options?.fieldKinds?.[domainField] ?? inferFieldKind(domainShape[domainField]);
         const defaultMapper = buildDefaultMapper(fieldKind);
         const toDomain = options?.domainConverters?.[domainField] ?? defaultMapper.toDomain;

         ret[domainField] = new SameTableMapping(tableDef, tableField, defaultMapper.toDb, toDomain);
      }

      return ret as TableMapping<Extract<keyof Domain, string>>;
   }
}
