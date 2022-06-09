export * from './simple';
export * from './extended';
export * from './expandables';
export * from './full';

// TODO
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
- on extended
- on expandables
- with field name mapping (no camelToSnake mapping: buildingID -> id_building)
- with different types (boolean, string, Date)

introduce composed field? : sub domain object -> db fields



filters


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
