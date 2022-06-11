import { DomainResult } from '../index';
import { DomainWithExpandablesRequest } from '../../DomainRequest';
import { DbRecord, DomainExpandableFieldsToTableFieldsMap, ExpandablesTableConfig, SelectMethod } from './TableConfig';
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
      return this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .getFieldsToSelect(tableConfig, req);
   }

   protected createResultAndPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      return this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .createResultAndPopulate(dbRecord, allFieldsToSelect);
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExpandablesRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      const addon = this.addonManager.getExpandables<DRN, F, E, TF>(this.tableConfig.tableName);

      await addon.fetchOneToOne(resultsToReconcile, req, this.tableConfig);
      await addon.fetchOneToMany(resultsToReconcile, req, this.tableConfig, ids);
   }
}
