import { sql } from 'drizzle-orm';
import { defineApiHandler, apiOk } from '../utils/api';
import { db } from '../utils/db';

export default defineApiHandler(async (event) => {
  await db.execute(sql`select 1`);

  return apiOk(event, { status: 'ok', time: new Date().toISOString() });
});
