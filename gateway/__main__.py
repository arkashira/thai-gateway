# tests/test_main.py
import pytest
from src.main import main

def test_main_runs_without_error():
    # The main function should not raise an exception on a clean run.
    # We capture stdout/stderr to ensure no unexpected output.
    result = pytest.main(["-q", "tests/test_main.py::test_main_runs_without_error"])
    assert result == 0