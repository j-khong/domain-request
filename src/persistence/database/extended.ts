import { DomainResult } from '../index.ts';
import { DomainWithExtendedRequest } from '../../DomainRequest/index.ts';
import { ExtendableTableConfig, SelectMethod } from './TableConfig.ts';
import { FieldsToSelect, Join } from './types.ts';
import { SimpleDatabaseTable } from './simple.ts';
import { AddOnManager } from './addons.ts';
import { getFieldsToSelect } from './functions.ts';

export abstract class ExtendableDatabaseTable<DRN extends string, F, E, TF extends string> extends SimpleDatabaseTable<
   DRN,
   F,
   TF
> {
   private readonly addonManager: AddOnManager;
   constructor(protected readonly tableConfig: ExtendableTableConfig<F, E, TF>) {
      super(tableConfig);
      this.addonManager = new AddOnManager();
      this.addonManager.setExtended(tableConfig.tableName);
   }

   getTableConfig(): ExtendableTableConfig<F, E, TF> {
      return this.tableConfig;
   }

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      super.init(select, allDbTables);
      this.extendedTableConfigToInit(select);
   }

   protected abstract extendedTableConfigToInit(select: SelectMethod): void;

   protected getFieldsToSelect(
      tableConfig: ExtendableTableConfig<F, E, TF>,
      req: DomainWithExtendedRequest<DRN, F, E>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      const res = getFieldsToSelect(tableConfig, req);
      this.addonManager.getExtended<DRN, F, E, TF>(this.tableConfig.tableName).checkHasToSelect(res, tableConfig, req);

      return res;
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExtendedRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      return this.addonManager
         .getExtended<DRN, F, E, TF>(this.tableConfig.tableName)
         .fetchOneToMany(this.tableConfig, resultsToReconcile, req, ids);
   }
}
