import {
   TableDef,
   TableMapping,
   SameTableMapping,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToString,
} from '../../../../../mod2.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'student_categories',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(tableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
   otherData: new SameTableMapping(tableDef, 'other_data', new ToDbSqlStringConverter(), unknownToString),
};

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
