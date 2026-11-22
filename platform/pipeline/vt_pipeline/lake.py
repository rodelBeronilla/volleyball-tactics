"""The lake: immutable Parquet files plus one JSON manifest per extraction batch.

Layout (identical on disk and in Cloud Storage)::

    raw/<table>/dt=YYYY-MM-DD/<batch_id>.parquet
    raw/_batches/<batch_id>.json          written last; its presence means the batch is complete
"""

from __future__ import annotations

import json
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .config import PipelineSettings


class Lake(ABC):
    @abstractmethod
    def put_file(self, local_path: Path, rel_path: str) -> str:
        """Store a local file at ``rel_path``; returns the URI the warehouse can load from."""

    @abstractmethod
    def write_text(self, text: str, rel_path: str) -> str: ...

    @abstractmethod
    def read_text(self, rel_path: str) -> str: ...

    @abstractmethod
    def list(self, rel_prefix: str) -> list[str]:
        """Relative paths under a prefix, sorted."""

    @abstractmethod
    def uri(self, rel_path: str) -> str: ...

    # Manifests -----------------------------------------------------------------

    def write_manifest(self, manifest: dict[str, Any]) -> str:
        return self.write_text(json.dumps(manifest, indent=2, default=str), f"raw/_batches/{manifest['batch_id']}.json")

    def manifests(self) -> list[dict[str, Any]]:
        out = []
        for rel in self.list("raw/_batches/"):
            if rel.endswith(".json"):
                out.append(json.loads(self.read_text(rel)))
        return sorted(out, key=lambda m: m["batch_id"])


class LocalLake(Lake):
    def __init__(self, root: Path):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, rel_path: str) -> Path:
        p = (self.root / rel_path).resolve()
        if self.root not in p.parents and p != self.root:
            raise ValueError(f"path escapes lake root: {rel_path}")
        return p

    def put_file(self, local_path: Path, rel_path: str) -> str:
        dest = self._path(rel_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(local_path), str(dest))
        return self.uri(rel_path)

    def write_text(self, text: str, rel_path: str) -> str:
        dest = self._path(rel_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_suffix(dest.suffix + ".tmp")
        tmp.write_text(text, encoding="utf-8")
        tmp.replace(dest)
        return self.uri(rel_path)

    def read_text(self, rel_path: str) -> str:
        return self._path(rel_path).read_text(encoding="utf-8")

    def list(self, rel_prefix: str) -> list[str]:
        base = self._path(rel_prefix)
        if not base.exists():
            return []
        return sorted(p.relative_to(self.root).as_posix() for p in base.rglob("*") if p.is_file())

    def uri(self, rel_path: str) -> str:
        return self._path(rel_path).as_posix()


class GcsLake(Lake):
    """Cloud Storage. Imports the client lazily so the local target needs no Google libraries."""

    def __init__(self, bucket: str, prefix: str = "lake", project: str | None = None):
        from google.cloud import storage  # type: ignore[import-not-found]

        self.client = storage.Client(project=project)
        self.bucket = self.client.bucket(bucket)
        self.prefix = prefix.strip("/")

    def _key(self, rel_path: str) -> str:
        return f"{self.prefix}/{rel_path}" if self.prefix else rel_path

    def put_file(self, local_path: Path, rel_path: str) -> str:
        self.bucket.blob(self._key(rel_path)).upload_from_filename(str(local_path))
        Path(local_path).unlink(missing_ok=True)
        return self.uri(rel_path)

    def write_text(self, text: str, rel_path: str) -> str:
        self.bucket.blob(self._key(rel_path)).upload_from_string(text, content_type="application/json")
        return self.uri(rel_path)

    def read_text(self, rel_path: str) -> str:
        return self.bucket.blob(self._key(rel_path)).download_as_text()

    def list(self, rel_prefix: str) -> list[str]:
        key = self._key(rel_prefix)
        names = [b.name for b in self.client.list_blobs(self.bucket, prefix=key)]
        strip = len(self.prefix) + 1 if self.prefix else 0
        return sorted(n[strip:] for n in names)

    def uri(self, rel_path: str) -> str:
        return f"gs://{self.bucket.name}/{self._key(rel_path)}"


def make_lake(settings: PipelineSettings) -> Lake:
    if settings.pipeline_target == "gcp":
        if not settings.gcs_bucket:
            raise SystemExit("GCS_BUCKET is required for the gcp target")
        return GcsLake(settings.gcs_bucket, settings.gcs_prefix, settings.gcp_project)
    return LocalLake(settings.lake_dir)
