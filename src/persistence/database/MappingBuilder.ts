import { TableDef, TableMapping } from './mapping.ts';
import { AutoFieldMapper, AutoFieldMapperOptions } from './AutoFieldMapper.ts';
import { SameTableMapping } from './mapping.ts';
import {
   ToDbSqlBooleanConverter,
   ToDbSqlConverter,
   ToDbSqlDateConverter,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToBoolean,
   unknownToIsoDate,
   unknownToNumber,
   unknownToString,
} from './converters.ts';

export class MappingBuilder<Domain extends object, Table extends object> {
   private readonly mapping: Partial<TableMapping<Extract<keyof Domain, string>>> = {};

   constructor(
      private readonly tableDef: TableDef,
      private readonly domainShape: Domain,
      private readonly tableFields: readonly Extract<keyof Table, string>[],
   ) {}

   addAutoMapping(...domainFields: Array<Extract<keyof Domain, string>>): MappingBuilder<Domain, Table> {
      const partialShape = {} as Pick<Domain, Extract<keyof Domain, string>>;
      for (const f of domainFields) {
         (partialShape as any)[f] = this.domainShape[f];
      }

      const generated = AutoFieldMapper.generateMapping<Pick<Domain, Extract<keyof Domain, string>>, Table>(
         this.tableDef,
         partialShape,
         this.tableFields,
      );

      Object.assign(this.mapping, generated);
      return this;
   }

   addAutoMappingWithOptions(
      domainFields: Array<Extract<keyof Domain, string>>,
      options: AutoFieldMapperOptions<Extract<keyof Domain, string>, Extract<keyof Table, string>>,
   ): MappingBuilder<Domain, Table> {
      const partialShape = {} as Pick<Domain, Extract<keyof Domain, string>>;
      for (const f of domainFields) {
         (partialShape as any)[f] = this.domainShape[f];
      }

      const generated = AutoFieldMapper.generateMapping<Pick<Domain, Extract<keyof Domain, string>>, Table>(
         this.tableDef,
         partialShape,
         this.tableFields,
         options,
      );

      Object.assign(this.mapping, generated);
      return this;
   }

   addCustomMapping(
      domainField: Extract<keyof Domain, string>,
      tableField: Extract<keyof Table, string>,
      converter: ToDbSqlConverter<unknown>,
      toDomain: (o: unknown) => unknown | undefined,
   ): MappingBuilder<Domain, Table> {
      if (!this.tableFields.includes(tableField)) {
         throw new Error(
            `MappingBuilder: cannot map domain field [${domainField}] to unknown table field [${String(tableField)}]`,
         );
      }

      this.mapping[domainField] = new SameTableMapping(this.tableDef, tableField, converter, toDomain);
      return this;
   }

   addStringMapping(
      domainField: Extract<keyof Domain, string>,
      tableField: Extract<keyof Table, string>,
   ): MappingBuilder<Domain, Table> {
      return this.addCustomMapping(domainField, tableField, new ToDbSqlStringConverter(), unknownToString);
   }

   addNumberMapping(
      domainField: Extract<keyof Domain, string>,
      tableField: Extract<keyof Table, string>,
   ): MappingBuilder<Domain, Table> {
      return this.addCustomMapping(domainField, tableField, new ToDbSqlNumberConverter(), unknownToNumber);
   }

   addBooleanMapping(
      domainField: Extract<keyof Domain, string>,
      tableField: Extract<keyof Table, string>,
   ): MappingBuilder<Domain, Table> {
      return this.addCustomMapping(domainField, tableField, new ToDbSqlBooleanConverter(), unknownToBoolean);
   }

   addDateMapping(
      domainField: Extract<keyof Domain, string>,
      tableField: Extract<keyof Table, string>,
   ): MappingBuilder<Domain, Table> {
      return this.addCustomMapping(domainField, tableField, new ToDbSqlDateConverter(), unknownToIsoDate);
   }

   build(): TableMapping<Extract<keyof Domain, string>> {
      return this.mapping as TableMapping<Extract<keyof Domain, string>>;
   }
}
