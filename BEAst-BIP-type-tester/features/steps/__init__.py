"""
Step definitions for BIM2BOM validation framework
"""

from enum import IntEnum


class OutcomeSeverity(IntEnum):
    """Severity levels for validation outcomes"""
    PASSED = 0
    WARNING = 1
    ERROR = 2
    

class ValidationOutcome:
    """
    Represents the outcome of a validation step
    """
    def __init__(self, inst=None, instance_id=None, expected=None, observed=None, severity=OutcomeSeverity.PASSED):
        self.inst = inst
        self.instance_id = instance_id
        self.expected = expected
        self.observed = observed
        self.severity = severity
    
    def __repr__(self):
        if self.severity == OutcomeSeverity.PASSED:
            return f"PASS: {self.inst}"
        else:
            return f"FAIL: Expected {self.expected}, observed {self.observed}"

