from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="QA Test Case Generation Agent",
    description="An AI agent that generates structured QA test cases from requirements.",
    version="1.0.0"
)


class RequirementInput(BaseModel):
    requirement: str = Field(
        min_length=10,
        description="Application requirement or user story"
    )


class TestStep(BaseModel):
    step_number: int
    action: str
    expected_result: str


class TestCase(BaseModel):
    test_case_id: str
    title: str
    scenario_type: str
    priority: str
    preconditions: list[str]
    test_data: list[str]
    steps: list[TestStep]


class TestCaseResponse(BaseModel):
    requirement: str
    test_cases: list[TestCase]


@app.get("/")
def home():
    return {
        "message": "QA Test Case Generation Agent API is running"
    }


@app.post(
    "/requirements/analyze",
    response_model=TestCaseResponse
)
def analyze_requirement(data: RequirementInput):
    return TestCaseResponse(
        requirement=data.requirement,
        test_cases=[
            TestCase(
                test_case_id="TC-001",
                title="Reset password using a valid email OTP",
                scenario_type="Positive",
                priority="High",
                preconditions=[
                    "The user is registered",
                    "The user can access the registered email account"
                ],
                test_data=[
                    "Registered email address",
                    "Valid OTP",
                    "Valid new password"
                ],
                steps=[
                    TestStep(
                        step_number=1,
                        action="Open the forgot-password page",
                        expected_result="The password-reset page is displayed"
                    ),
                    TestStep(
                        step_number=2,
                        action="Enter a registered email address",
                        expected_result="An OTP is sent to the registered email address"
                    ),
                    TestStep(
                        step_number=3,
                        action="Enter the valid OTP and a valid new password",
                        expected_result="The password is reset successfully"
                    )
                ]
            )
        ]
    )