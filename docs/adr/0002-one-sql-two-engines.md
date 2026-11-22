# ADR 0002: One set of SQL, two engines (BigQuery in production, DuckDB everywhere else)

**Status:** accepted · **Date:** 2026-10-26

## Context

The transformations and quality checks are the heart of the platform and the part most
likely to drift. BigQuery cannot run on a laptop or in a free CI job; a second copy of the
SQL for a local engine would be a second source of bugs.

## Decision

- Models and checks are plain `.sql` files written in **BigQuery's dialect**, with
  `{{ layer.table }}` references and a small header (`depends_on`, `partition_by`,
  `cluster_by`, `severity`).
- The **BigQuery adapter** runs them verbatim. The **DuckDB adapter** transpiles them with
  [sqlglot](https://github.com/tobymao/sqlglot) at run time.
- The test-suite parses every model and check in both dialects and runs the complete
  pipeline on DuckDB against the demo season, asserting that marts reproduce the app's own
  numbers. CI does this on every change.
- Orchestration is a few hundred lines of Python (topological sort from headers, run
  loop, results tables) rather than dbt.

## Alternatives considered

- *dbt with the BigQuery and DuckDB adapters*: a fine choice at larger scale, and the
  headers here map onto dbt concepts (models, tests, `config`). It would add a build
  tool, Jinja and two adapters for a couple of dozen models; kept as the obvious migration path
  if the project grows (the SQL moves over almost unchanged).
- *Hand-written dialect-neutral SQL*: fragile (`COUNTIF`, `TIMESTAMP_SUB`, `QUALIFY`
  semantics differ) and prevents using BigQuery features such as partition clauses.
- *Python (pandas/Polars) transformations*: harder for analysts to read and extend, and
  moves compute out of the warehouse.

## Consequences

- One copy of each definition; what CI tests is what production runs.
- sqlglot coverage is excellent for the constructs used (window functions, `QUALIFY`,
  `COUNTIF`, `FULL OUTER JOIN`, interval arithmetic) and tested on every change. A
  construct it cannot translate fails the render test immediately, not in production.
- BigQuery-only features (partitioning, clustering, table descriptions) are applied by the
  adapter from headers, so the SELECTs stay portable.
