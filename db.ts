import { createClient } from '@clickhouse/client-web'
import type { ClickHouseClientConfigOptions, ResponseJSON } from '@clickhouse/client-web'
import type { ParsedUrlQueryInput } from 'querystring'

export const DB = (options: ClickHouseClientConfigOptions) => {
  const clickhouse = createClient({
    url: process.env.CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD,
    keep_alive: { enabled: true },
    ...options
  })
  function sql(strings: TemplateStringsArray) {
    return (queryParams: ParsedUrlQueryInput = {}) => {
      return clickhouse.query({
        query: strings[0],
        format: 'JSON',
        query_params: queryParams,
        clickhouse_settings: {
          max_estimated_execution_time: 90000,
          timeout_overflow_mode: 'break',
          http_make_head_request: false, 
          schema_inference_make_columns_nullable: 0,
        }
      }).then((res) => res.json()) as Promise<ResponseJSON>
    }
  }
  return { clickhouse, sql }
}


