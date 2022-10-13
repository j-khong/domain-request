// filters
// - 'equals',
//   - natural key
//   - date
//   ✅ - string
//   ✅ - boolean
//   ✅ - number
//   ✅ - iso date
//   ✅ - custom simple
//       ✅ - with unauthorized field value
// - 'greaterThan',
//   ✅ - string
//   ✅ - number
//   ✅ - iso date
// - 'greaterThanOrEquals',
// - 'lesserThan',
//   ✅ - string
//   ✅ - number
//   ✅ - iso date
// - 'lesserThanOrEquals',
// - 'between',
//   ✅ - string
//   ✅ - number
//   ✅ - iso date
// - 'contains',
//   ✅ - string
//   ✅ - number
//   ✅ - iso date
export * from './simple.ts';

export * from './extended.ts';
// TODO add filter test on
// - 1to1
// - chains of 1to1
// - test filter on 1toN of 1to1 of a domain

// - with unauthorized field value
// - with unauthorized field

// user role field value restrictions
//  - on full access role
//    - 1 value authorized
//    - 2 values authorized
//  - on restricted access role
//    - 1 value authorized
//    - 2 values authorized

// Persistence mapping test
// - 1toN

// restricted field of 1to1 / 1toN

// Persistence mapping test
// - name mapping
// - custom structure (agregation)
// - 1to1
// - 1to1 (2 fields from the same table)
// - 1to1 (2 fields from different tables)
// - chain of 1to1 (2 levels)
// - chain of 1to1 (3 levels)
// export * from './extended.ts';

// test with null / empty values from DB
