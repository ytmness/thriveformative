import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { getPool } from "@/lib/db";

export type TxQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => Promise<QueryResult<T>>;

export async function withTx<T>(fn: (q: TxQuery) => Promise<T>): Promise<T> {
  const client: PoolClient = await getPool().connect();
  const q: TxQuery = (text, params) => client.query(text, params);
  try {
    await client.query("BEGIN");
    const result = await fn(q);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
