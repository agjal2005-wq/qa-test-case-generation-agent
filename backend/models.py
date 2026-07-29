from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class RequirementRecord(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    requirement_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    clarity_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    is_ready: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )