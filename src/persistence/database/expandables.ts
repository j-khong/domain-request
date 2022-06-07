import { DomainResult } from '../index';
import { DomainWithExpandablesRequest } from '../../DomainRequest';
import { DbRecord, DomainExpandableFieldsToTableFieldsMap, ExpandablesTableConfig, SelectMethod } from './TableConfig';
import { getFieldsToSelect } from './functions';
import { FieldsToSelect, Join } from './types';
import { SimpleDatabaseTable } from './simple';
import { AddOnManager } from './addons';

export abstract class DatabaseTableWithExpandables<
   DRN extends string,
   F,
   E,
   TF extends string,
> extends SimpleDatabaseTable<DRN, F, TF> {
   private readonly addonManager: AddOnManager;
   constructor(protected readonly tableConfig: ExpandablesTableConfig<F, E, TF>) {
      super(tableConfig);

      this.addonManager = new AddOnManager();
      this.addonManager.setExpandables(tableConfig.tableName);
   }

   getTableConfig(): ExpandablesTableConfig<F, E, TF> {
      return this.tableConfig;
   }

   protected abstract buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<E, TF>;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      this.tableConfig.init(select, this.buildDomainExpandableFieldsToTableFieldsMap(allDbTables));
   }

   protected getFieldsToSelect(
      tableConfig: ExpandablesTableConfig<F, E, TF>,
      req: DomainWithExpandablesRequest<DRN, F, E>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      const res = getFieldsToSelect(tableConfig, req);

      const fieldsToSelect = this.addonManager
         .getExpandables<DRN, F, E, TF>(tableConfig.tableName)
         .processOneToOneFieldsToSelect(res, req, tableConfig);

      this.setPrivateTmpVal(fieldsToSelect as any);

      return res;
   }

   protected createResultAndPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      if (this.expandablesFieldsToSelectTmpToDel === undefined) {
         throw new Error('investigate, this cannot be undefined');
      }

      return this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .createResultAndPopulate(
            dbRecord,
            allFieldsToSelect,
            this.expandablesFieldsToSelectTmpToDel,
            this.tableConfig,
         );
   }

   private expandablesFieldsToSelectTmpToDel: undefined | FieldsToSelect<E>;
   private setPrivateTmpVal(v: FieldsToSelect<E>): void {
      this.expandablesFieldsToSelectTmpToDel = v;
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExpandablesRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      await this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .fetchOneToMany(resultsToReconcile, req, this.tableConfig, ids);

      this.expandablesFieldsToSelectTmpToDel = undefined;
   }
}
