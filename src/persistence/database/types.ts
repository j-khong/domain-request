export type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: keyof Fields;
      fullFieldToSelect: string;
      convertToDomain: (o: any) => any;
   }
>;
export type Join = Map<
   string, // table name
   {
      relationship: string;
      filters: string[];
   }
>;
