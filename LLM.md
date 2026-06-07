# Domain Request Library - LLM Context & Implementation Notes

> **Purpose**: Quick reference for AI assistants resuming work on this project without full conversation history.

## 🎯 Project Quick Summary
**Domain Request** = CQRS Query API with Business Domain ↔ Persistence Mapping

- Implements GraphQL-like queries (field selection, filtering, pagination)
- Maps camelCase domain model to snake_case database tables
- Role-based field authorization per domain
- Type-safe at compile time via TypeScript

**Repository**: `https://github.com/j-khong/domain-request`

---

## 🔴 THE MAIN PROBLEM

**Mapping definition is extremely verbose & repetitive**

```typescript
// Current - 9+ lines, 9+ type castings for 9 fields
const mapping: DomainToDbTableMapping<Fields, Table> = {
   ...(createFieldMapping('id', 'id', new ToDbSqlNumberConverter(), ...) as MappedType<'id', 'id'>),
   ...(createFieldMapping('firstname', 'firstname', new ToDbSqlStringConverter(), ...) as MappedType<...>),
   ...(createFieldMapping('lastname', 'lastname', new ToDbSqlStringConverter(), ...) as MappedType<...>),
   // ... 6 more identical lines
}
```

**Why it's a problem**: 
- Team of 4+ developers finds this hard to understand/maintain
- New devs need time to learn the pattern
- Every new field = copy-paste boilerplate
- Type casting required but doesn't add safety

---

## ✅ PROPOSED SOLUTIONS

### 1. AutoFieldMapper (Core Solution)
```typescript
// NEW - Simple, readable, 1 line for all standard fields
const mapping = AutoFieldMapper.generateMapping<Fields, Table>(
  domainFieldInstance,
  tableStructure,
  { conventions: { namingPattern: 'camelToSnakeCase' } }
)
```

**Implementation**:
- Auto-detect camelCase ↔ snake_case conversion
- Infer converter type from TypeScript type (string→StringConverter, number→NumberConverter)
- No type casting needed
- Override specific fields easily

### 2. MappingBuilder for Edge Cases
```typescript
// For ~10% of fields with custom logic (e.g., distance calculation)
new MappingBuilder<Fields, Table>()
  .addAutoMapping('id', 'firstname', 'yearOfBirth') // Uses AutoFieldMapper internally
  .addCustomMapping('distanceFrom', 'distance_from', 
    new ToDbSqlNumberConverter(),
    havrsineFormula
  )
  .build()
```

### 3. Conventions Layer in Factory
```typescript
const factory = buildDomainRequestFactory(
  { /* config */ },
  datastore,
  {
    conventions: {
      namingPattern: 'camelCaseToSnakeCase', // Applied globally
      autoConverterMap: true, // Use type inference
    }
  }
)
```

### 4. CLI Scaffolding Tool
```bash
npm run generate-mapping --domain Student --table students
# Generates template with all fields pre-mapped, ready to customize
```

---

## 📁 Key Files by Purpose

| Purpose | File |
|---------|------|
| **Mapping Definition** | `src/persistence/database/mapping.ts` (SameTableMapping class) |
| **Type Converters** | `src/persistence/database/converters.ts` (ToDbSqlXxxConverter classes) |
| **Factory Pattern** | `src/domain-request/Factory.ts` (buildDomainRequestFactory) |
| **Real Example** | `A-migrer/Student/builder/persistence/database/index.ts` |
| **Field Config** | `src/domain-request/field-configuration/` (FieldConfiguration class) |
| **Domain Builder** | `src/domain-request/builder.ts` (DomainRequestBuilder) |

---

## 📊 Team Context
- **Size**: 4+ developers
- **Pain Points**: Boilerplate verbosity, onboarding difficulty
- **Mapping Frequency**: Infrequent (several per project)
- **Naming Pattern**: 95% camelCase ↔ snake_case
- **Complex Transforms**: ~10% of fields need custom logic

**Expected Impact**: 
- Code reduction: 70% fewer lines in mapping files
- Onboarding: 2 days → 2 hours for new devs
- Maintenance: Fewer bugs from copy-paste errors

---

## 🛠️ Implementation Checklist
- [ ] `AutoFieldMapper` class with type inference
- [ ] `MappingBuilder` fluent API
- [ ] Conventions config in Factory options
- [ ] CLI tool for scaffold generation
- [ ] Unit tests for auto-detection logic
- [ ] Documentation & examples
- [ ] Migration guide for existing projects

---

## 💾 Type System Notes
**Converters are already well-designed**:
- `ToDbSqlStringConverter`
- `ToDbSqlNumberConverter`
- `ToDbSqlBooleanConverter`
- `ToDbSqlDateConverter`
- `ToDbSqlCoordinatesConverter` (special: for geographic queries)

**Opportunity**: TypeScript's conditional types can auto-select converter based on domain field type.

```typescript
// Type inference example
type FieldTypeToConverter<T> = 
  T extends string ? ToDbSqlStringConverter :
  T extends number ? ToDbSqlNumberConverter :
  T extends boolean ? ToDbSqlBooleanConverter :
  T extends Date ? ToDbSqlDateConverter :
  never;
```

---

**Last Updated**: June 7, 2026
**Status**: Ready for implementation starting with AutoFieldMapper
