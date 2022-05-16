import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   SelectMethod,
   TableConfig,
   toNumber,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';
import * as Student from '../../../../StudentRequest';
import * as Course from '../../../../CourseRequest';

export function fetch(req: Request): Result {
   const r = fetchResults(tableConfig, req);
   return {};
}

const tableName = 'course_application';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'student_id' | 'course_id';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toNumber },
   studentId: { name: 'student_id', convert: toNumber },
   courseId: { name: 'course_id', convert: toNumber },
};

export const tableConfig = new TableConfig<Fields, ExpandableFields, TableFields>(
   tableName,
   tablePrimaryKey,
   domainFieldsToTableFieldsMap,
);

export function init(select: SelectMethod): void {
   const domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> = {
      student: { cardinality: 'oneToOne', foreignKey: 'student_id', tableConfig: Student.DataFetch.tableConfig },
      course: { cardinality: 'oneToOne', foreignKey: 'course_id', tableConfig: Course.DataFetch.tableConfig },
   };
   tableConfig.init(domainExpandableFieldsToTable, select);
}
