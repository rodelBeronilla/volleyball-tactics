"""Every model and check must render for both targets, and parse in BigQuery's dialect."""

from __future__ import annotations

import sqlglot

from vt_pipeline.models import Registry
from vt_pipeline.warehouse import Warehouse


class _BigQueryRender(Warehouse):
    """Renders exactly what the BigQuery adapter would send, without Google libraries."""

    dialect = "bigquery"

    def ref(self, layer: str, table: str) -> str:
        return f"`my-project.vt_{layer}.{table}`"

    def execute(self, sql):
        raise NotImplementedError

    def query(self, sql):
        raise NotImplementedError

    def ensure_layers(self):
        raise NotImplementedError

    def load_parquet(self, table, uri):
        raise NotImplementedError

    def create_table_as(self, *a, **k):
        raise NotImplementedError

    def ensure_table(self, *a, **k):
        raise NotImplementedError

    def insert_rows(self, *a, **k):
        raise NotImplementedError


class _DuckDBRender(_BigQueryRender):
    dialect = "duckdb"

    def ref(self, layer: str, table: str) -> str:
        return f"{layer}.{table}"

    def transpile(self, sql: str) -> str:
        return sqlglot.transpile(sql, read="bigquery", write="duckdb")[0]


PARAMS = {"freshness_hours": 48}


def test_models_are_ordered_by_dependency():
    names = [f"{m.layer}.{m.name}" for m in Registry().models]
    assert names.index("marts.dim_matches") < names.index("marts.fct_rallies")
    assert names.index("marts.fct_rallies") < names.index("marts.agg_team_set_results")
    assert names.index("staging.stg_lineups") < names.index("staging.stg_lineup_slots")
    assert names.index("marts.agg_player_match_box") < names.index("marts.rec_scoresheet_players")
    assert all(n.startswith("staging.") for n in names[: names.index("marts.dim_players")])


def test_every_model_and_check_renders_in_both_dialects():
    reg = Registry()
    bq, duck = _BigQueryRender(PARAMS), _DuckDBRender(PARAMS)
    assert reg.models and reg.checks
    for item in [*reg.models, *reg.checks]:
        rendered_bq = bq.render(item.sql)
        assert "{{" not in rendered_bq, item.name
        assert "`my-project.vt_" in rendered_bq, item.name
        sqlglot.parse_one(rendered_bq, read="bigquery")  # syntax check in the production dialect
        rendered_duck = duck.render(item.sql)
        assert "`my-project" not in rendered_duck and "{{" not in rendered_duck, item.name


def test_headers_are_parsed():
    reg = Registry()
    fct = next(m for m in reg.models if m.name == "fct_stat_events")
    assert fct.layer == "marts"
    assert fct.partition_by == "match_date"
    assert fct.cluster_by == ("player_id", "stat")
    assert "staging.stg_stat_events" in fct.depends_on
    assert fct.description
    assert not fct.sql.startswith("--")
    severities = {c.name: c.severity for c in reg.checks}
    assert severities["set_scores_match_rally_outcomes"] == "error"
    assert severities["kills_have_assists"] == "warn"


def test_unknown_template_parameter_is_an_error():
    import pytest

    with pytest.raises(KeyError):
        _BigQueryRender({}).render("SELECT {{ nope }}")
