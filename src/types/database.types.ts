// This file is a hand-written placeholder for Phase 1.
// In Phase 2, once the schema in supabase/migrations/0001_init.sql is applied
// to a real Supabase project, regenerate this file with:
//
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
//
// Keeping it minimal now avoids drift between fake and real types.

// `any` here (not `Record<string, unknown>`) is deliberate: supabase-js uses
// this type to infer table/column/rpc shapes, and a placeholder object type
// makes every `.from()/.rpc()` call reject its arguments as `never`. Once
// Phase 2 generates the real type from the live schema, this becomes fully
// strict again with no changes needed elsewhere.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
