// tester, regrouper les tests selon les features (filter, restrictions, etc...)
// et non selon la structure des donneés (simple, extended, expandables etc...)

export * from './fields/index.ts';
export * from './filters/index.ts';

// export * from './options/simple.ts';
// export * from './user-role-access.ts';

// export * from './extended';
// export * from './expandables';
// export * from './full';

// fields
// - natural key
// - string
// - number
// - boolean
// - custom simple
// - custom structure
// - 1to1
// - 1toN

// TODO
//
// tester toCompute fields
//   si toCompute utilisé comme un filtre => check qu'il est déclaré dans les fields avec une valeur utile au compute
//
// tester fetch field extendable only

// typologie
// field primitifs
// field extendable (one to one ou one to many)
// field expandable (one to one ou one to many)

// tester avec un mapping domain - table different
// ex. domain "student" => table "students" (et pas student)

// tester avec un mapping domain field - table field different
// ex. domain field "studentId" => table field "id_student" (et pas student_id)

/*

selects
- on simple
- on extended (= autre table, donc aspect purement persistence et pas domain)
   - 1to1  
   - 1toN  
- on expandables (= autre domain)
   - 1to1  
   - 1toN  
- with field name mapping (no camelToSnake mapping: buildingID -> id_building)
- with different types (boolean, string, number, Date)
- with value authorisation (role depending)
- with field access (role depending)


test request
 domain
   - expand 1to1
       - expand 1to1


introduce composed field? : sub domain object -> db fields


Test forbidden resource (access by admin but not student)
test direct access
test access through expandable


filters
- all filters
   'equals',
   'greaterThan',
   'greaterThanOrEquals',
   'lesserThan',
   'lesserThanOrEquals',
   'between',
   'contains', // for strings
   'isIn', // for numbers list
- with unauthorized field value
- with unauthorized field

options:
orderby
 - sur champs avec mapping
    asc 
    desc
 - sur champs sans mapping
    asc 
    desc

- sur champs simple avec mapping
    asc 
    desc
 - sur champs simple sans mapping
    asc 
    desc

- sur champs extended avec mapping
    asc 
    desc
 - sur champs extended sans mapping
    asc 
    desc

 */
