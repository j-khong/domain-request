/**
 * Legacy / Deprecated APIs
 *
 * This folder contains the old APIs that have been replaced with better alternatives.
 * These are kept for backwards compatibility but should not be used in new code.
 *
 * MIGRATION GUIDE:
 *
 * 1. buildDomainRequestBuilderByRole → Use DomainRoleBuilder instead
 *    From: ../roles/DomainRoleBuilder.ts
 *
 * 2. StringFieldConfiguration, NumberFieldConfiguration, etc. → Use FieldConfigFactory
 *    From: ../field-configuration/FieldConfigFactory.ts
 *
 * See README.md in this folder for the migration examples.
 */

export * from './Factory.ts';
export * from './field-config-classes.ts';
