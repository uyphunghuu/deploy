from typing import Annotated

from fastapi import Query

DEFAULT_LIMIT = 20
MAX_LIMIT = 100

LimitQuery = Annotated[int, Query(ge=1, le=MAX_LIMIT)]
OffsetQuery = Annotated[int, Query(ge=0)]

