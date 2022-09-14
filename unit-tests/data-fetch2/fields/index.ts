// fields
// ✅ - natural key
// - date
// ✅ - iso date
// ✅ - string
// ✅ - number
// ✅ - boolean
// ✅ - custom simple

// user role field restrictions
//  - on full access role
//    ✅ - no fields authorized
//    ✅ - one field authorized
//  - on restricted access role
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

export * from './extended.ts';

// test with null / empty values from DB

// filtering
// Persistence mapping test
// - 1toN

// user role field value restrictions
//  - on full access role
//    - 1 value authorized
//    - 2 values authorized
//  - on restricted access role
//    - 1 value authorized
//    - 2 values authorized

// restricted field of 1to1 / 1toN
