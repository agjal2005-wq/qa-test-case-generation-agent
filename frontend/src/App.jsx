import { useState } from "react";
import "./App.css";


const API_BASE_URL = "http://127.0.0.1:8000";

function escapeCsvValue(value) {
  let text = Array.isArray(value)
    ? value.join(" | ")
    : String(value ?? "");

  if (/^[=+\-@]/.test(text.trimStart())) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}


function App() {
  const [requirement, setRequirement] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const [testSuite, setTestSuite] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [refinementInstruction, setRefinementInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const [coverageReview, setCoverageReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const [isAutoImproving, setIsAutoImproving] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/requirements/quality-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement
          })
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "The requirement could not be analysed.";

        throw new Error(message);
      }

      setAnalysis(responseData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setTestSuite(null);
    setCoverageReview(null);
    setAgentMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/requirements/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement
          })
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "The test cases could not be generated.";

        throw new Error(message);
      }

      setTestSuite(responseData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefine() {
    setIsRefining(true);
    setError("");
    setCoverageReview(null);
    setAgentMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/test-cases/refine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement,
            refinement_instruction: refinementInstruction,
            current_test_cases: testSuite.test_cases
          })
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "The test suite could not be refined.";

        throw new Error(message);
      }

      setTestSuite(responseData);
      setRefinementInstruction("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRefining(false);
    }
  }


  async function handleReviewCoverage() {
    setIsReviewing(true);
    setError("");
    setCoverageReview(null);
    setAgentMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/test-cases/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement,
            test_cases: testSuite.test_cases
          })
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "The test suite could not be reviewed.";

        throw new Error(message);
      }

      setCoverageReview(responseData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleAutoImprove() {
    if (!testSuite || !coverageReview) {
      return;
    }

    const previousScore = coverageReview.coverage_score;

    if (
      coverageReview.coverage_score >= 90 &&
      coverageReview.verdict === "Strong"
    ) {
      setAgentMessage(
        "The critic considers this suite strong. No automatic refinement was required."
      );
      return;
    }

    setIsAutoImproving(true);
    setError("");
    setAgentMessage("");

    const refinementPrompt = `
Improve the current test suite using the QA critic's findings.

Missing scenarios:
${coverageReview.missing_scenarios.join("\n")}

Duplicate or overlapping cases:
${coverageReview.duplicate_or_overlapping_cases.join("\n")}

Unsupported assumptions:
${coverageReview.unsupported_assumptions.join("\n")}

Recommendations:
${coverageReview.recommendations.join("\n")}

Preserve useful existing cases. Add missing coverage, remove or merge
substantial duplicates, and replace unsupported assumptions with clearly
labelled conditions or clarification-dependent tests. Keep IDs sequential.
  `.trim();

    try {
      const refinementResponse = await fetch(
        `${API_BASE_URL}/test-cases/refine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement,
            refinement_instruction: refinementPrompt,
            current_test_cases: testSuite.test_cases
          })
        }
      );

      const refinedSuite = await refinementResponse.json();

      if (!refinementResponse.ok) {
        throw new Error(
          typeof refinedSuite.detail === "string"
            ? refinedSuite.detail
            : "Automatic refinement failed."
        );
      }

      const reviewResponse = await fetch(
        `${API_BASE_URL}/test-cases/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirement: requirement,
            test_cases: refinedSuite.test_cases
          })
        }
      );

      const newReview = await reviewResponse.json();

      if (!reviewResponse.ok) {
        throw new Error(
          typeof newReview.detail === "string"
            ? newReview.detail
            : "The improved suite could not be reviewed."
        );
      }

      setTestSuite(refinedSuite);
      setCoverageReview(newReview);

      setAgentMessage(
        `Agentic improvement completed. Coverage changed from ${previousScore} to ${newReview.coverage_score}.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAutoImproving(false);
    }
  }

  function handleExportCsv() {
    if (!testSuite) {
      return;
    }

    const headers = [
      "Test Case ID",
      "Title",
      "Scenario Type",
      "Priority",
      "Preconditions",
      "Test Data",
      "Step Number",
      "Action",
      "Expected Result"
    ];

    const rows = testSuite.test_cases.flatMap((testCase) =>
      testCase.steps.map((step) => [
        testCase.test_case_id,
        testCase.title,
        testCase.scenario_type,
        testCase.priority,
        testCase.preconditions,
        testCase.test_data,
        step.step_number,
        step.action,
        step.expected_result
      ])
    );

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      )
    ].join("\n");

    const csvFile = new Blob(
      ["\uFEFF", csvContent],
      {
        type: "text/csv;charset=utf-8"
      }
    );

    const downloadUrl = URL.createObjectURL(csvFile);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = "qa-test-suite.csv";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="brand-label">AI-POWERED QUALITY ASSURANCE</p>
          <h1>QA Test Case Generation Agent</h1>
        </div>

        <span className="status-badge">
          <span className="status-dot"></span>
          Agent ready
        </span>
      </header>

      <main className="main-content">
        <section className="intro-section">
          <p className="section-label">Requirement workspace</p>
          <h2>Turn requirements into reliable test cases</h2>

          <p className="intro-text">
            Analyse requirement quality, identify ambiguities and generate
            structured positive, negative, boundary, validation and security
            test cases.
          </p>
        </section>

        <section className="requirement-card">
          <div className="card-heading">
            <div>
              <h3>Application requirement</h3>
              <p>Enter a requirement or user story for the QA agent.</p>
            </div>

            <span>{requirement.length} characters</span>
          </div>

          <textarea
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
            placeholder="Example: The university chatbot should answer admission questions and provide a link to the relevant official source."
            rows="8"
          />

          <div className="action-row">
            <button
              className="secondary-button"
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || requirement.trim().length < 10}
            >
              {isAnalyzing ? "Analysing..." : "Analyse quality"}
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || requirement.trim().length < 10}
            >
              {isGenerating ? "Generating..." : "Generate test cases"}
            </button>
          </div>
        </section>

        {error && (
          <section className="error-message">
            <strong>Analysis failed:</strong> {error}
          </section>
        )}

        {analysis ? (
          <section className="analysis-card">
            <div className="analysis-header">
              <div>
                <p className="section-label">Requirement analysis</p>
                <h3>{analysis.summary}</h3>
              </div>

              <div className="score-block">
                <strong>{analysis.clarity_score}</strong>
                <span>Clarity score</span>
              </div>
            </div>

            <div
              className={
                analysis.is_ready_for_test_generation
                  ? "readiness ready"
                  : "readiness not-ready"
              }
            >
              {analysis.is_ready_for_test_generation
                ? "Ready for test generation"
                : "Clarification recommended before generation"}
            </div>

            <div className="analysis-grid">
              <div>
                <h4>Ambiguities</h4>
                <ul>
                  {analysis.ambiguities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Assumptions to avoid</h4>
                <ul>
                  {analysis.assumptions_to_avoid.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="question-section">
              <h4>Clarification questions</h4>

              <ol>
                {analysis.clarification_questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ol>
            </div>
          </section>
        ) : (
          !error && !testSuite && (
            <section className="result-placeholder">
              <div className="placeholder-icon">✓</div>
              <h3>Your analysis will appear here</h3>
              <p>
                Enter a requirement and select Analyse quality to begin.
              </p>
            </section>
          )
        )}

        {testSuite && (
          <section className="refinement-card">
            <div>
              <p className="section-label">Iterative refinement</p>
              <h3>Improve the current test suite</h3>
              <p>
                Tell the QA agent what should be added, removed or changed.
              </p>
            </div>

            <textarea
              value={refinementInstruction}
              onChange={(event) =>
                setRefinementInstruction(event.target.value)
              }
              placeholder="Example: Add security test cases for prompt injection, malicious URLs and repeated requests."
              rows="4"
            />

            <div className="refinement-action">
              <button
                className="primary-button"
                type="button"
                onClick={handleRefine}
                disabled={
                  isRefining ||
                  refinementInstruction.trim().length < 3
                }
              >
                {isRefining ? "Refining suite..." : "Refine test suite"}
              </button>
            </div>
          </section>
        )}

        {coverageReview && (
          <section className="coverage-card">
            <div className="coverage-heading">
              <div>
                <p className="section-label">QA critic review</p>
                <h3>Test-suite coverage evaluation</h3>
              </div>

              <div className="coverage-score">
                <strong>{coverageReview.coverage_score}</strong>
                <span>{coverageReview.verdict}</span>
              </div>
            </div>

            <div className="coverage-grid">
              <div>
                <h4>Covered areas</h4>
                <ul>
                  {coverageReview.covered_areas.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Missing scenarios</h4>
                <ul>
                  {coverageReview.missing_scenarios.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4>Duplicates or overlaps</h4>
                <ul>
                  {coverageReview.duplicate_or_overlapping_cases.length > 0
                    ? coverageReview.duplicate_or_overlapping_cases.map(
                      (item, index) => <li key={index}>{item}</li>
                    )
                    : <li>No substantial duplication detected.</li>}
                </ul>
              </div>

              <div>
                <h4>Unsupported assumptions</h4>
                <ul>
                  {coverageReview.unsupported_assumptions.length > 0
                    ? coverageReview.unsupported_assumptions.map(
                      (item, index) => <li key={index}>{item}</li>
                    )
                    : <li>No unsupported assumptions detected.</li>}
                </ul>
              </div>
            </div>

            <div className="recommendation-section">
              <h4>Critic recommendations</h4>
              <ol>
                {coverageReview.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="agent-action">
              <div>
                <p className="section-label">Controlled agentic workflow</p>
                <p>
                  The critic findings will guide one automatic refinement and
                  re-evaluation cycle.
                </p>
              </div>

              <button
                className="agent-button"
                type="button"
                onClick={handleAutoImprove}
                disabled={isAutoImproving}
              >
                {isAutoImproving
                  ? "Agent improving suite..."
                  : "Auto-improve with critic"}
              </button>
            </div>

            {agentMessage && (
              <div className="agent-message">
                {agentMessage}
              </div>
            )}
          </section>
        )}

        {testSuite && (
          <section className="test-suite">
            <div className="suite-heading">
              <div>
                <p className="section-label">Generated test suite</p>
                <h3>{testSuite.test_cases.length} test cases generated</h3>
              </div>

              <div className="suite-actions">
                <span className="saved-badge">
                  Saved to PostgreSQL
                </span>

                <button
                  className="review-button"
                  type="button"
                  onClick={handleReviewCoverage}
                  disabled={isReviewing}
                >
                  {isReviewing ? "Reviewing..." : "Review coverage"}
                </button>

                <button
                  className="export-button"
                  type="button"
                  onClick={handleExportCsv}
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="test-case-list">
              {testSuite.test_cases.map((testCase) => (
                <article
                  className="test-case-card"
                  key={testCase.test_case_id}
                >
                  <div className="test-case-header">
                    <div>
                      <span className="case-id">
                        {testCase.test_case_id}
                      </span>

                      <h4>{testCase.title}</h4>
                    </div>

                    <div className="case-badges">
                      <span className="scenario-badge">
                        {testCase.scenario_type}
                      </span>

                      <span className="priority-badge">
                        {testCase.priority} priority
                      </span>
                    </div>
                  </div>

                  <div className="case-details">
                    <div>
                      <h5>Preconditions</h5>
                      <ul>
                        {testCase.preconditions.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5>Test data</h5>
                      <ul>
                        {testCase.test_data.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="steps-section">
                    <h5>Test steps</h5>

                    <div className="steps-table-wrapper">
                      <table className="steps-table">
                        <thead>
                          <tr>
                            <th>Step</th>
                            <th>Action</th>
                            <th>Expected result</th>
                          </tr>
                        </thead>

                        <tbody>
                          {testCase.steps.map((step) => (
                            <tr key={step.step_number}>
                              <td>{step.step_number}</td>
                              <td>{step.action}</td>
                              <td>{step.expected_result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;