import {
   buildSameTableMapping,
   DatabaseTable,
   DatabaseTableWithExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields = Key | 'id_student' | 'id_course';

class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
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
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         student: {
            cardinality: { name: 'oneToOne', foreignKey: 'id_student' },
            tableConfig: allDbTables.student.getTableConfig(),
            dbt: allDbTables.student,
         },
         course: {
            cardinality: { name: 'oneToOne', foreignKey: 'id_course' },
            tableConfig: allDbTables.course.getTableConfig(),
            dbt: allDbTables.course,
         },
      };
   }
}

export const dbTable = new Database();
