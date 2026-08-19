"""Tiny progress helper — works with or without tqdm."""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from typing import TypeVar

T = TypeVar("T")


def progress(iterable: Iterable[T], desc: str = "", total: int | None = None) -> Iterator[T]:
    try:
        from tqdm import tqdm

        yield from tqdm(iterable, desc=desc, total=total)
        return
    except Exception:
        pass

    items = list(iterable) if total is None else iterable
    n = total if total is not None else (len(items) if hasattr(items, "__len__") else None)
    i = 0
    for x in items:  # type: ignore[assignment]
        i += 1
        if n:
            if i == 1 or i == n or i % max(1, n // 10) == 0:
                print(f"  {desc} {i}/{n}", flush=True)
        elif i == 1 or i % 10 == 0:
            print(f"  {desc} {i}", flush=True)
        yield x
