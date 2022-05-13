import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   toNumber,
   toString,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../..';
import { select } from '../../../../../dbUtils';

export function fetch(req: Request): Result {
   const tableConfig = {
      tableName,
      tablePrimaryKey,
      domainFieldsToTableFieldsMap,
      domainExpandableFieldsToTable,
   };
   const r = fetchResults(tableConfig, select, req);
   return {};
}

const tableName = 'country';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'name' | 'timezone';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toNumber },
   name: { name: 'name', convert: toString },
   timezone: { name: 'timezone', convert: toString },
};

const domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> = {};

/*
DROP TABLE IF EXISTS `country`;
CREATE TABLE `country` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `timezone` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `country__NK` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

INSERT INTO `country` (`name`, `timezone`) VALUES
('france', 'Europe/Paris');
  
*/
