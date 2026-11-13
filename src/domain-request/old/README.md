# Deprecated APIs

This folder is the only place where the deprecated APIs are implemented.
They are kept for backwards compatibility and **should not be used in new code**.

They are still exported by the main entry point (`src/index.ts`), so existing code keeps working without changes.

## What's here

### `Factory.ts`: `buildDomainRequestBuilderByRole`

**Replacement**: `createDomainRoleBuilder` / `DomainRoleBuilder` (see `../roles/DomainRoleBuilder.ts`)

```typescript
// deprecated
const mapping = buildDomainRequestBuilderByRole({
   domainRequestName,
   generateFieldsSetup,
   rolesList: getRoles(),
   initDomainConfig,
   rolesSpecifics: {
      admin: {},
      student: {
         authorizedFields: ['id', 'name'],
         modifyFieldsSetup: (setup) => { ... },
      },
   },
});

// replacement
const mapping = createDomainRoleBuilder(domainRequestName, generateFieldsSetup, getRoles())
   .withDependencyInitializer(initDomainConfig)
   .role('admin').withAllFields().and()
   .role('student').withFields('id', 'name').modifyFields((setup) => { ... }).and()
   .build();
```

### `field-config-classes.ts`: field configuration classes

`StringFieldConfiguration`, `NumberFieldConfiguration`, `BooleanFieldConfiguration`, `DateFieldConfiguration`, `IsoDateFieldConfiguration`

**Replacement**: `FieldConfigFactory` (see `../field-configuration/FieldConfigFactory.ts`)

```typescript
// deprecated
new StringFieldConfiguration({ filtering: { byListOfValue: true } });

// replacement
FieldConfigFactory.createString({ filtering: { byListOfValue: true } });
```

## Tests

The unit tests run against the same domains declared with both APIs:

- `unit-tests-new/domain-requests-old`: deprecated APIs (`make unit-tests UNIT_TESTS_API=old`)
- `unit-tests-new/domain-requests-new`: new APIs (`make unit-tests UNIT_TESTS_API=new`)

When the deprecated APIs are removed, this folder and `unit-tests-new/domain-requests-old` can be deleted.
