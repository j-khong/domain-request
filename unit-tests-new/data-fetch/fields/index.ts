// fields
// ✅ - natural key
// - date
// ✅ - iso date
// ✅ - string
// ✅ - number
// ✅ - boolean
// ✅ - custom simple

// user role field restrictions
//  ✅ - on full access role
//    ✅ - no fields authorized
//    ✅ - one field authorized
//  ✅ - on restricted access role
//    ✅ - no fields authorized
//    ✅ - one field authorized
export * from './simple.ts';

// Persistence mapping test
// - name mapping
// - custom structure (agregation)
// ✅ - 1to1
// ✅ - 1to1 (2 fields from the same table)
// ✅ - 1to1 (2 fields from different tables)
// ✅ - chain of 1to1 (2 levels)
// ✅ - chain of 1to1 (3 levels)
// ✅ - 1toN (1 1toN field)
// ✅ - 1toN (1 field, 1 1to1 field, 1 1toN field)
// ✅ - 1toN (1 field, 2 1to1 fields, 2 1toN fields)
// ✅ - 1toN (1 1to1 field who has 1 1toN field))
export * from './extended.ts';

// test with null / empty values from DB
