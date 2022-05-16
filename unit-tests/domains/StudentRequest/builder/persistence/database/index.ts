import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   TableConfig,
   SelectMethod,
   toNumber,
   toString,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';
import * as Country from '../../../../CountryRequest';
import * as CourseApplication from '../../../../CourseApplicationRequest';

export function fetch(req: Request): Result {
   const r = fetchResults(tableConfig, req);
   return {};
}

const tableName = 'student';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields =
   | Key
   | 'firstname'
   | 'lastname'
   | 'year_of_birth'
   | 'national_card_id'
   | 'country_id'
   | 'has_scholarship';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toNumber },
   firstname: { name: 'firstname', convert: toString },
   lastname: { name: 'lastname', convert: toString },
   yearOfBirth: { name: 'year_of_birth', convert: toString },
   nationalCardId: { name: 'national_card_id', convert: toString },
   countryId: { name: 'country_id', convert: toString },
   hasScholarship: { name: 'has_scholarship', convert: toString },
};

export const tableConfig = new TableConfig<Fields, ExpandableFields, TableFields>(
   tableName,
   tablePrimaryKey,
   domainFieldsToTableFieldsMap,
);

export function init(select: SelectMethod): void {
   const domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> = {
      country: {
         cardinality: 'oneToOne',
         foreignKey: 'country_id',
         tableConfig: Country.DataFetch.tableConfig,
      },
      courseApplication: { cardinality: 'oneToMany', tableConfig: CourseApplication.DataFetch.tableConfig },
   };
   tableConfig.init(domainExpandableFieldsToTable, select);
}
