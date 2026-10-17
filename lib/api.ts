import 'server-only';
import { NextResponse } from 'next/server';
import { assertStaff, type Permission } from './auth';
import { ZodError } from 'zod';
import { StockError } from './store';

/** Wraps a staff-only API handler: checks the session and turns errors into plain messages. */
export function staffRoute<T>(permission: Permission, handler: (staff: Awaited<ReturnType<typeof assertStaff>>, req: Request) => Promise<T>) {
  return async (req: Request) => {
    let staff;
    try {
      staff = await assertStaff(permission);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 401 });
    }
    try {
      return NextResponse.json(await handler(staff, req));
    } catch (err) {
      if (err instanceof ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? 'Check the details and try again.' }, { status: 400 });
      const status = err instanceof StockError ? 409 : 400;
      if (!(err instanceof StockError)) console.error(err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong.' }, { status });
    }
  };
}
