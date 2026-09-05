/**
 * DRY_RUN behavior helpers. When true, no Apollo contacts/enrollments/
 * sequence activations happen (see Workflow 05's sending gate); records
 * written elsewhere in the pipeline are stamped is_test_data=true so the
 * dashboard can badge them clearly instead of hiding them.
 */

export function isDryRun(settings: Record<string, unknown>): boolean {
  const value = settings["dry_run"];
  // Fail SAFE: anything other than an explicit boolean/string false means
  // dry-run stays on. This mirrors every workflow's Parse Config Code node.
  return value !== false && value !== "false";
}

export interface TestDataStampable {
  is_test_data?: boolean;
}

export function stampTestData<T extends object>(record: T, dryRun: boolean): T & TestDataStampable {
  return { ...record, is_test_data: dryRun };
}
