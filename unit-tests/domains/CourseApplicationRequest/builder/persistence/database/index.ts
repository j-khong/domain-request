import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   SelectMethod,
   TableConfig,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';
import * as Student from '../../../../StudentRequest';
import * as Course from '../../../../CourseRequest';

export async function fetch(req: Request): Promise<Result> {
   return fetchResults(tableConfig, req);
}

const tableName = 'course_application';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'student_id' | 'course_id';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toTableId },
   studentId: { name: 'student_id', convert: toTableId },
   courseId: { name: 'course_id', convert: toTableId },
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
