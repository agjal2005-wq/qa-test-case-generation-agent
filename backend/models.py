from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    test_cases: Mapped[list["TestCaseRecord"]] = relationship(
        back_populates="requirement",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TestCaseRecord.id"
    )


class TestCaseRecord(Base):
    __tablename__ = "test_cases"

    __table_args__ = (
        UniqueConstraint(
            "requirement_id",
            "test_case_code",
            name="uq_requirement_test_case_code"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    requirement_id: Mapped[int] = mapped_column(
        ForeignKey(
            "requirements.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    test_case_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    scenario_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    preconditions: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False
    )

    test_data: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False
    )

    requirement: Mapped["RequirementRecord"] = relationship(
        back_populates="test_cases"
    )

    steps: Mapped[list["TestStepRecord"]] = relationship(
        back_populates="test_case",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TestStepRecord.step_number"
    )


class TestStepRecord(Base):
    __tablename__ = "test_steps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    test_case_id: Mapped[int] = mapped_column(
        ForeignKey(
            "test_cases.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    step_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    expected_result: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    test_case: Mapped["TestCaseRecord"] = relationship(
        back_populates="steps"
    )

class KnowledgeChunkRecord(Base):
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    source_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    source_reference: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    embedding: Mapped[list] = mapped_column(
        JSONB,
        nullable=False
    )