import {
   buildExpandablesToTableMapping,
   buildMapping,
   DatabaseTableWithExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SimpleDatabaseTable,
   DomainToDbTableMapping,
   createFieldMapping,
   ToDbSqlNumberConverter,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, ExpandableFields } from '../../../types.ts';

interface Table {
   id: number;
   id_student: number;
   id_course: number;
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
   ...(createFieldMapping('studentId', 'id_student', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'studentId', 'id_student'>),
   ...(createFieldMapping('courseId', 'id_course', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'courseId', 'id_course'>),
};
class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, keyof Table> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, keyof Table>(
            'course_applications', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, keyof Table>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, keyof Table> {
      return {
         student: buildExpandablesToTableMapping({
            globalContextDomainName: 'student',
            cardinality: { name: 'oneToOne', foreignKey: 'id_student' },
            allDbTables,
         }),
         course: buildExpandablesToTableMapping({
            globalContextDomainName: 'course',
            cardinality: { name: 'oneToOne', foreignKey: 'id_course' },
            allDbTables,
         }),
      };
   }
}

export const dbTable = new Database();
