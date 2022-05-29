import {
   DatabaseTable,
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields = Key | 'student_id' | 'course_id';

class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'course_application', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               studentId: { name: 'student_id', convert: toTableId },
               courseId: { name: 'course_id', convert: toTableId },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         student: {
            cardinality: { name: 'oneToOne', foreignKey: 'student_id' },
            tableConfig: allDbTables.student.getTableConfig(),
         },
         course: {
            cardinality: { name: 'oneToOne', foreignKey: 'course_id' },
            tableConfig: allDbTables.course.getTableConfig(),
         },
      };
   }
}

export const dbTable = new Database();
