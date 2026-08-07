import pytest

from rag import cosine_similarity


def test_identical_vectors_have_maximum_similarity():
    first_vector = [1.0, 2.0, 3.0]
    second_vector = [1.0, 2.0, 3.0]

    score = cosine_similarity(
        first_vector,
        second_vector
    )

    assert score == pytest.approx(1.0)


def test_orthogonal_vectors_have_zero_similarity():
    first_vector = [1.0, 0.0]
    second_vector = [0.0, 1.0]

    score = cosine_similarity(
        first_vector,
        second_vector
    )

    assert score == pytest.approx(0.0)


def test_zero_vector_is_handled_safely():
    first_vector = [0.0, 0.0]
    second_vector = [1.0, 1.0]

    score = cosine_similarity(
        first_vector,
        second_vector
    )

    assert score == 0.0


def test_opposite_vectors_have_negative_similarity():
    first_vector = [1.0, 0.0]
    second_vector = [-1.0, 0.0]

    score = cosine_similarity(
        first_vector,
        second_vector
    )

    assert score == pytest.approx(-1.0)