import { DomainResult } from '../index';
import { DomainWithExtendedAndExpandablesRequest } from '../../DomainRequest';
import {
   DbRecord,
   DomainExpandableFieldsToTableFieldsMap,
   ExtendableAndExpandablesTableConfig,
   SelectMethod,
} from './TableConfig';
import { getFieldsToSelect } from './functions';
import { FieldsToSelect, Join } from './types';
import { SimpleDatabaseTable } from './simple';
import { AddOnManager } from './addons';

export abstract class DatabaseTableWithExtendedAndExpandables<
   DRN extends string,
   F,
   Ext,
   Exp,
   TF extends string,
> extends SimpleDatabaseTable<DRN, F, TF> {
   private readonly addonManager: AddOnManager;
   constructor(protected readonly tableConfig: ExtendableAndExpandablesTableConfig<F, Ext, Exp, TF>) {
      super(tableConfig);

      this.addonManager = new AddOnManager();
      this.addonManager.setExpandables(tableConfig.tableName);
      this.addonManager.setExtended(tableConfig.tableName);
   }

   getTableConfig(): ExtendableAndExpandablesTableConfig<F, Ext, Exp, TF> {
      return this.tableConfig;
   }

   protected abstract buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<Exp, TF>;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      super.init(select, allDbTables);
      this.extendedTableConfigToInit(select);
      this.tableConfig.init(select, this.buildDomainExpandableFieldsToTableFieldsMap(allDbTables));
   }

   protected abstract extendedTableConfigToInit(select: SelectMethod): void;

   protected getFieldsToSelect(
      tableConfig: ExtendableAndExpandablesTableConfig<F, Ext, Exp, TF>,
      req: DomainWithExtendedAndExpandablesRequest<DRN, F, Ext, Exp>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      const res = getFieldsToSelect(tableConfig, req);

      const fieldsToSelect = this.addonManager
         .getExpandables<DRN, F, Exp, TF>(tableConfig.tableName)
         .processOneToOneFieldsToSelect(res, req, tableConfig);

      this.setPrivateTmpVal(fieldsToSelect as any);

      this.addonManager
         .getExtended<DRN, F, Ext, TF>(this.tableConfig.tableName)
         .checkHasToSelect(res, tableConfig, req);

      return res;
   }

   protected createResultAndPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      if (this.expandablesFieldsToSelectTmpToDel === undefined) {
         throw new Error('investigate, this cannot be undefined');
      }

      return this.addonManager
         .getExpandables<DRN, F, Exp, TF>(this.tableConfig.tableName)
         .createResultAndPopulate(
            dbRecord,
            allFieldsToSelect,
            this.expandablesFieldsToSelectTmpToDel,
            this.tableConfig,
         );
   }

   private expandablesFieldsToSelectTmpToDel: undefined | FieldsToSelect<Exp>;
   private setPrivateTmpVal(v: FieldsToSelect<Exp>): void {
      this.expandablesFieldsToSelectTmpToDel = v;
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExtendedAndExpandablesRequest<DRN, F, Ext, Exp>,
      ids: string[],
   ): Promise<void> {
      await this.addonManager
         .getExpandables<DRN, F, Exp, TF>(this.tableConfig.tableName)
         .fetchOneToMany(resultsToReconcile, req, this.tableConfig, ids);

      this.expandablesFieldsToSelectTmpToDel = undefined;

      return this.addonManager
         .getExtended<DRN, F, Ext, TF>(this.tableConfig.tableName)
         .fetchOneToMany(this.tableConfig, resultsToReconcile, req, ids);
   }
}