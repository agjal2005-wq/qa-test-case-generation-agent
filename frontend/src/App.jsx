import { useState } from "react";
import "./App.css";


const API_BASE_URL = "http://127.0.0.1:8000";


function App() {
  const [requirement, setRequirement] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");


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

            <button className="primary-button" type="button">
              Generate test cases
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
          !error && (
            <section className="result-placeholder">
              <div className="placeholder-icon">✓</div>
              <h3>Your analysis will appear here</h3>
              <p>
                Enter a requirement and select Analyse quality to begin.
              </p>
            </section>
          )
        )}
      </main>
    </div>
  );
}

export default App;