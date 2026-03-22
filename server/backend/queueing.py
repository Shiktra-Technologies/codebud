"""
Async execution queue primitives for judge jobs.
"""

from __future__ import annotations

import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional


JobExecutor = Callable[[Dict[str, Any]], Dict[str, Any]]


@dataclass
class JobRecord:
    job_id: str
    status: str
    request: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None


class MemoryJobStore:
    """Thread-safe in-memory job storage."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: Dict[str, JobRecord] = {}

    def create(self, request_payload: Dict[str, Any]) -> JobRecord:
        job = JobRecord(
            job_id=f"job_{uuid.uuid4().hex}",
            status="queued",
            request=request_payload,
        )
        with self._lock:
            self._jobs[job.job_id] = job
        return job

    def get(self, job_id: str) -> Optional[JobRecord]:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **fields: Any) -> Optional[JobRecord]:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            for key, value in fields.items():
                setattr(job, key, value)
            return job


class AsyncExecutionManager:
    """Dispatches code-execution jobs to background workers."""

    def __init__(self, job_store: MemoryJobStore, executor: JobExecutor, max_workers: int = 2) -> None:
        self.job_store = job_store
        self.executor = executor
        self.pool = ThreadPoolExecutor(max_workers=max_workers)

    def submit(self, request_payload: Dict[str, Any]) -> str:
        job = self.job_store.create(request_payload)
        self.pool.submit(self._run_job, job.job_id)
        return job.job_id

    def _run_job(self, job_id: str) -> None:
        self.job_store.update(job_id, status="running", started_at=time.time())
        job = self.job_store.get(job_id)
        if job is None:
            return

        try:
            result = self.executor(job.request)
            self.job_store.update(
                job_id,
                status="completed",
                result=result,
                finished_at=time.time(),
            )
        except Exception as exc:  # defensive guard for worker thread safety
            self.job_store.update(
                job_id,
                status="failed",
                error=str(exc),
                finished_at=time.time(),
            )

