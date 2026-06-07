# Deprecated / Old APIs

This folder contains the deprecated APIs that have been superseded by better implementations.
These are kept for backwards compatibility but **should not be used in new code**.

## What's Here

### 1. Factory.ts - Old Factory Builder API
**Status**: ⚠️ DEPRECATED  
**Replacement**: `DomainRoleBuilder` (see `../roles/DomainRoleBuilder.ts`)  
**Function**: `buildDomainRequestBuilderByRole`

This function had complex nested parameters that were hard to understand. The new fluent API is much cleaner.

**Example Migration**:
```typescript
// ❌ OLD - Hard to read
const mapping = buildDomainRequestBuilderByRole({
  rolesSpecifics: {
    admin: {},
    student: { authorizedFields: [...], modifyFieldsSetup: (...) => {} }
  }
});

// ✅ NEW - Clear intent
const mapping = new DomainRoleBuilder(...)
  .role('admin').withAllFields().and()
  .role('student').withFields(...).modifyFields(...).and()
  .build();
```

### 2. field-config-classes.ts - Old Field Configuration Classes
**Status**: ⚠️ DEPRECATED  
**Replacement**: `FieldConfigFactory` (see `../field-configuration/FieldConfigFactory.ts`)  
**Classes**:
- `StringFieldConfiguration`
- `NumberFieldConfiguration`
- `BooleanFieldConfiguration`
- `DateFieldConfiguration`
- `IsoDateFieldConfiguration`

These 6 nearly identical classes with 96 lines of boilerplate have been replaced with a configurable factory.

**Example Migration**:
```typescript
// ❌ OLD - Duplicated code
new StringFieldConfiguration({ filtering: { byListOfValue: true } })

// ✅ NEW - Centralized factory
FieldConfigFactory.createString({ filtering: { byListOfValue: true } })
```

## Migration Guide

To migrate away from these deprecated APIs:

1. **Replace buildDomainRequestBuilderByRole with DomainRoleBuilder**
   - See: `../roles/DomainRoleBuilder.ts`
   - See: `../../MIGRATION_GUIDE.md` for detailed steps

2. **Replace field configuration classes with FieldConfigFactory**
   - See: `../field-configuration/FieldConfigFactory.ts`
   - Example: `FieldConfigFactory.createString()` instead of `new StringFieldConfiguration()`

3. **Update imports**
   - Old: `import { StringFieldConfiguration } from '...field-configuration/field.ts'`
   - New: `import { FieldConfigFactory } from '...field-configuration/FieldConfigFactory.ts'`

## Backwards Compatibility

These deprecated APIs are still available through:

- Direct import from old files: `import { buildDomainRequestBuilderByRole } from '.../old/Factory.ts'`
- Re-export from main index: `import { StringFieldConfiguration } from '.../index.ts'`
- Re-export from field-configuration: `import { StringFieldConfiguration } from '.../field-configuration/index.ts'`

The main entry point (`src/index.ts`) re-exports all deprecated APIs, so existing code continues to work without changes.

## Why These Changes?

### Cognitive Load Reduction
- ❌ Old API: Complex nested parameters with hidden logic
- ✅ New API: Fluent builder with clear, chainable steps

### Code Reduction
- ❌ Old: 96 lines of field config classes (pure boilerplate)
- ✅ New: Centralized factory that generates all variants

### Discoverability
- ❌ Old: 6 different classes to choose from
- ✅ New: One factory with named methods (createString, createNumber, etc.)

### Maintainability
- ❌ Old: Changes needed in multiple classes
- ✅ New: All logic in one place

## Timeline

- **Phase 1** (Complete): Factory refactoring + new APIs created
- **Phase 2** (Current): Old APIs moved to `old/` folder with deprecation warnings
- **Phase 3** (Future): Gradual migration of existing code
- **Phase 4** (Future): Consider removing old APIs after migration window

## Questions?

See the top-level docs:
- `REFACTOR.md` - Refactoring overview and before/after examples
- `MIGRATION_GUIDE.md` - Step-by-step migration checklist
- `EXAMPLES_REFACTOR.ts` - Detailed code examples
