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
      ORDER BY (project, database, collection, id, timestamp);
  `
  // Create an AggregatingMergeTree table to store the latest document for each id
  // createdAt and updatedAt timestamps,
  // createdBy and updatedBy users,
  // createdIn and updatedIn queries,
  const initDocuments = /* sql */ `
    CREATE TABLE IF NOT EXISTS _documents (
      project String,
      database String,
      collection String,
      id String,
      name String,
      document String,
      createdAt SimpleAggregateFunction(min, DateTime),
      updatedAt SimpleAggregateFunction(max, DateTime),
      createdBy AggregateFunction(argMin, String),
      updatedBy AggregateFunction(argMax, String),
      createdIn AggregateFunction(argMin, String),
      updatedIn AggregateFunction(argMax, String),
      PROJECTION _documents_inferred_schema (
        SELECT
          id as _id,
          name as _name,
          *
        FROM format(JSON, document)
      )
    ) ENGINE = AggregatingMergeTree()
      PARTITION BY (project, database, collection)
      ORDER BY (project, database, collection, id);
  `

  const initMaterializedViews = /* sql */ `
    CREATE MATERIALIZED VIEW IF NOT EXISTS _updates TO _documents AS
    SELECT * FROM _transactions
  `

  // TODO: Figure out how to create a materalized view for each collection with an inferred schema
}