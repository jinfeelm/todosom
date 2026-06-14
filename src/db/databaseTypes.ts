export interface SqlRunResult {
  lastInsertRowId: number;
  changes: number;
}

/** Repository가 사용하는 최소 DB 인터페이스 */
export interface TodoSomDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
