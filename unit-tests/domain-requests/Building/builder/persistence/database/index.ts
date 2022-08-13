import {
   createFieldMapping,
   ValueMapper,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   DomainToDbTableMapping,
   buildExpandablesToTableMapping,
   buildMapping,
   DatabaseTableWithExtendedAndExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExtendableAndExpandablesTableConfig,
   SelectMethod,
   SimpleDatabaseTable,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, Status, ExtendedFields, ExpandableFields } from '../../../types.ts';
import { openingHoursTable } from './opening-hours.ts';
import { picturesTable } from './pictures.ts';

interface Table {
   id: number;
   name: string;
   status: DbStatus;
   field_private: string;
}

type DbStatus = 'o' | 'wip' | 'c';
const dbToDomain = new Map<DbStatus, Status>([
   ['o', 'opened'],
   ['wip', 'work in progress'],
   ['c', 'closed'],
]);

class ToDbSqlStatusConverter extends ToDbSqlStringConverter {
   constructor() {
      super(toDbStatus);
   }
}

type MappedType<F1 extends keyof Fields, T1 extends keyof Table> = DomainToDbTableMapping<
   Pick<Fields, F1>,
   Pick<Table, T1>
>;

const c: DomainToDbTableMapping<Fields, Table> = {
   ...(createFieldMapping('id', 'id', new ToDbSqlNumberConverter(), (o: any) => o.toString()) as MappedType<
      'id',
      'id'
   >),
   ...(createFieldMapping('name', 'name', new ToDbSqlStringConverter(), (o: any) => o.toString()) as MappedType<
      'name',
      'name'
   >),
   ...(createFieldMapping('privateField', 'field_private', new ToDbSqlStringConverter(), (o: any) => o) as MappedType<
      'privateField',
      'field_private'
   >),
   ...(createFieldMapping('status', 'status', new ToDbSqlStatusConverter(), toDomainStatus) as MappedType<
      'status',
      'status'
   >),
};

class Database extends DatabaseTableWithExtendedAndExpandables<
   DomainRequestName,
   Fields,
   ExtendedFields,
   ExpandableFields,
   keyof Table
> {
   constructor() {
      super(
         new ExtendableAndExpandablesTableConfig<Fields, ExtendedFields, ExpandableFields, keyof Table>(
            'buildings', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
            {
               openingHours: {
                  cardinality: { name: 'oneToMany' },
                  tableConfig: openingHoursTable,
               },
               pictures: {
                  cardinality: { name: 'oneToMany' },
                  tableConfig: picturesTable,
               },
            },
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, keyof Table>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, any> {
      return {
         sponsors: buildExpandablesToTableMapping({
            globalContextDomainName: 'buildingSponsor',
            localContextDomainName: 'sponsors',
            cardinality: { name: 'oneToMany' },
            allDbTables,
         }),
      };
   }

   protected extendedTableConfigToInit(select: SelectMethod): void {
      openingHoursTable.init(select, {
         cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
         tableConfig: this.getTableConfig(),
      });

      picturesTable.init(select, {
         cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
         tableConfig: this.getTableConfig(),
      });
   }
}

const statusValueMapper = new ValueMapper<DbStatus, Status>(dbToDomain);

function toDbStatus(o: unknown): string {
   return statusValueMapper.toDbValue(o as any, '' as DbStatus) as string;
}

function toDomainStatus(o: any): Status {
   return statusValueMapper.toDomainValue(o, 'closed');
}

export const dbTable = new Database();
