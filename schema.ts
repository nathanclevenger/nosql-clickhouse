import type { ClickHouseClient } from '@clickhouse/client-common'

export const initDatabase = (client: ClickHouseClient) => {
  const initTransactions = /* sql */ `
    CREATE TABLE IF NOT EXISTS _transactions (
      project String,
      database String,
      collection String,
      id String,
      name String,
      document String,
      operation LowCardinality(String),
      timestamp DateTime DEFAULT now(),
      user String DEFAULT currentUser(),
      query String DEFAULT queryID(),
    ) ENGINE = MergeTree()
      PARTITION BY (project, database, collection)
      ORDER BY (id, timestamp);
  `
  // Create an AggregatingMergeTree table to store the latest document for each id
  // createdAt, updatedAt, and deletedAt timestamps
  // createdBy, updatedBy, and deletedBy users
  // createdIn, updatedIn, and deletedIn queries
  const initDocuments = /* sql */ `
    CREATE MATERIALIZED VIEW IF NOT EXISTS _documents AS (
      SELECT
        project,
        database,
        collection,
        id,
        name,
        document,
        operation,
        timestamp,
        user,
        query
      FROM _transactions
      WHERE (project, database, collection, id, timestamp) IN (
        SELECT
          project,
          database,
          collection,
          id,
          max(timestamp) AS timestamp
        FROM _transactions
        GROUP BY project, database, collection, id
      )
    ) ENGINE = AggregatingMergeTree()
      PARTITION BY (project, database, collection)
      ORDER BY (id, timestamp);
  `
}