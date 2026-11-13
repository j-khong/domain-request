import {
   TableDef,
   TableMapping,
   MappingBuilder,
   SelectMethod,
   Table,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'course_applications',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = new MappingBuilder<
   Fields,
   { id: number; id_student: number; id_course: number }
>(tableDef, { id: '', studentId: '', courseId: '' }, ['id', 'id_student', 'id_course'])
   .addAutoMapping('id')
   .addAutoMappingWithOptions(['studentId', 'courseId'], {
      conventions: { explicit: { studentId: 'id_student', courseId: 'id_course' } },
      fieldKinds: { studentId: 'number', courseId: 'number' },
   })
   .build();

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
