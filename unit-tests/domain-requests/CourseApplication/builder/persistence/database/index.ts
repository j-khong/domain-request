import {
   buildExpandablesToTableMapping,
   buildSameTableMapping,
   DatabaseTableWithExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SimpleDatabaseTable,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields = Key | 'id_student' | 'id_course';

class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, TableFields>(
            'course_applications', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               studentId: buildSameTableMapping('id_student', toTableId, (o) => o.toString()),
               courseId: buildSameTableMapping('id_course', toTableId, (o) => o.toString()),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         student: buildExpandablesToTableMapping({
            cardinality: { name: 'oneToOne', foreignKey: 'id_student' },
            dbTable: allDbTables.student,
         }),
         course: buildExpandablesToTableMapping({
            cardinality: { name: 'oneToOne', foreignKey: 'id_course' },
            dbTable: allDbTables.course,
         }),
      };
   }
}

export const dbTable = new Database();
