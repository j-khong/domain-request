import {
   DatabaseTable,
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields = Key | 'id_student' | 'id_course';

class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'course_applications', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               studentId: { name: 'id_student', convert: toTableId },
               courseId: { name: 'id_course', convert: toTableId },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         student: {
            cardinality: { name: 'oneToOne', foreignKey: 'id_student' },
            tableConfig: allDbTables.student.getTableConfig(),
         },
         course: {
            cardinality: { name: 'oneToOne', foreignKey: 'id_course' },
            tableConfig: allDbTables.course.getTableConfig(),
         },
      };
   }
}

export const dbTable = new Database();
