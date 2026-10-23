
"use client";

import { useState } from "react";
import styles from "./assessment-taker.module.css";

type QuizOption = {
  id: number;
  optionText: string;
  position: number;
};

type QuizQuestion = {
  id: number;
  questionText: string;
  points: number;
  position: number;
  options: QuizOption[];
  selectedOptionId: number | null;
};

type QuizData = {
  assessment: {
    id: number;
    title: string;
    instructions: string | null;
    passingScore: number;
  };
  attempt: {
    id: number;
    status: string;
  };
  questions: QuizQuestion[];
};

type AssessmentResult = {
  attemptId: number;
  score: number;
  passingScore: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  status: string;
};

type ApiResponse = {
  error?: string;
  message?: string;
  attempt?: {
    id: number;
  };
  result?: AssessmentResult;
};

type Props = {
  assessmentId: string;
};

export default function AssessmentTaker({
  assessmentId,
}: Props) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});

  const [result, setResult] = useState<AssessmentResult | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const answeredCount = quiz
    ? quiz.questions.filter(
        (question) => selectedAnswers[question.id] != null,
      ).length
    : 0;
  const progress =
    quiz && quiz.questions.length > 0
      ? (answeredCount / quiz.questions.length) * 100
      : 0;

  // Start an attempt, then load its questions.
  async function startAssessment() {
    setLoading(true);
    setError("");

    try {
      const startResponse = await fetch(
        `/api/assessments/${assessmentId}/attempts`,
        {
          method: "POST",
        },
      );

      const startData =
        (await startResponse.json()) as ApiResponse;

      if (!startResponse.ok || !startData.attempt) {
        throw new Error(
          startData.error ?? "Could not start the assessment.",
        );
      }

      const attemptId = startData.attempt.id;

      const quizResponse = await fetch(
        `/api/assessments/${assessmentId}/attempts/${attemptId}`,
      );

      const quizData = (await quizResponse.json()) as
        | QuizData
        | { error?: string };

      if (!quizResponse.ok || !("questions" in quizData)) {
        throw new Error(
          "error" in quizData
            ? quizData.error ?? "Could not load the quiz."
            : "Could not load the quiz.",
        );
      }

      setQuiz(quizData);

      // Restore saved answers if this attempt already had any.
      const restoredAnswers: Record<number, number | null> = {};

      for (const question of quizData.questions) {
        restoredAnswers[question.id] = question.selectedOptionId;
      }

      setSelectedAnswers(restoredAnswers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Submit answers. The server calculates the actual score.
  async function submitAssessment() {
    if (!quiz) return;

    const unansweredCount = quiz.questions.filter(
      (question) => selectedAnswers[question.id] == null,
    ).length;

    const confirmed = window.confirm(
      unansweredCount > 0
        ? `You have ${unansweredCount} unanswered question(s). Submit anyway?`
        : "Are you sure you want to submit your assessment?",
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/attempts/${quiz.attempt.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: quiz.questions.map((question) => ({
              questionId: question.id,
              selectedOptionId:
                selectedAnswers[question.id] ?? null,
            })),
          }),
        },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.result) {
        throw new Error(
          data.error ?? "Could not submit the assessment.",
        );
      }

      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Initial screen.
  if (!quiz) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.breadcrumb}>
            <span className={styles.breadcrumbMark} aria-hidden="true" />
            CampusFlow <span className={styles.breadcrumbDivider}>/</span>{" "}
            Assessments
          </p>

          <section className={styles.welcomeCard}>
            <div className={styles.welcomeCopy}>
              <span className={styles.kicker}>A MOMENT TO FOCUS</span>
              <h1>Take Assessment</h1>
              <p>
                Start when you are ready. Your attempt will be created
                securely and your answers will be saved as you go.
              </p>
              <div className={styles.welcomeNote}>
                <span className={styles.noteIcon} aria-hidden="true">
                  i
                </span>
                Take your time and review each answer before submitting.
              </div>
            </div>

            <div className={styles.startPanel}>
              <div className={styles.startPanelIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className={styles.panelLabel}>YOUR NEXT STEP</p>
              <h2>Ready to begin?</h2>
              <p className={styles.panelDescription}>
                Your assessment will open in this window.
              </p>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button
                className={styles.primaryButton}
                type="button"
                onClick={startAssessment}
                disabled={loading}
              >
                {loading ? "Loading assessment..." : "Start Assessment"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
              <p className={styles.secureNote}>
                <span aria-hidden="true">●</span> Your progress is saved
                securely
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Results screen.
  if (result) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <p className={styles.breadcrumb}>
            <span className={styles.breadcrumbMark} aria-hidden="true" />
            CampusFlow <span className={styles.breadcrumbDivider}>/</span>{" "}
            Results
          </p>

          <section className={styles.resultCard}>
            <div
              className={`${styles.resultIcon} ${
                result.passed ? styles.resultIconPassed : styles.resultIconFailed
              }`}
              aria-hidden="true"
            >
              {result.passed ? "✓" : "!"}
            </div>
            <span
              className={`${styles.resultStatus} ${
                result.passed ? styles.statusPassed : styles.statusFailed
              }`}
            >
              {result.passed ? "ASSESSMENT PASSED" : "ASSESSMENT COMPLETE"}
            </span>
            <h1>{result.passed ? "You did it!" : "Keep building on this"}</h1>
            <p className={styles.resultMessage}>
              Your assessment has been submitted and graded.
            </p>

            <div className={styles.resultStats}>
              <div className={styles.resultStat}>
                <span>Your score</span>
                <strong>{result.score}%</strong>
              </div>
              <div className={styles.resultStat}>
                <span>Points earned</span>
                <strong>
                  {result.earnedPoints}
                  <small> / {result.totalPoints}</small>
                </strong>
              </div>
              <div className={styles.resultStat}>
                <span>Passing score</span>
                <strong>{result.passingScore}%</strong>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Quiz screen.
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.breadcrumb}>
          <span className={styles.breadcrumbMark} aria-hidden="true" />
          CampusFlow <span className={styles.breadcrumbDivider}>/</span>{" "}
          Assessment
        </p>

        <header className={styles.quizHeader}>
          <div>
            <span className={styles.kicker}>ASSESSMENT</span>
            <h1>{quiz.assessment.title}</h1>
            <p>
              {quiz.assessment.instructions ||
                "Answer each question below, then submit your assessment."}
            </p>
          </div>
          <div className={styles.progressCard}>
            <div className={styles.progressText}>
              <span>YOUR PROGRESS</span>
              <strong>
                {answeredCount}
                <small> / {quiz.questions.length}</small>
              </strong>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Questions answered"
              aria-valuenow={answeredCount}
              aria-valuemin={0}
              aria-valuemax={quiz.questions.length}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {answeredCount === quiz.questions.length
                ? "All questions answered"
                : `${quiz.questions.length - answeredCount} ${
                    quiz.questions.length - answeredCount === 1
                      ? "question"
                      : "questions"
                  } left to answer`}
            </p>
          </div>
        </header>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <form
          className={styles.quizForm}
          onSubmit={(event) => {
            event.preventDefault();
            void submitAssessment();
          }}
        >
          <div className={styles.questionList}>
            {quiz.questions.map((question, index) => (
              <fieldset className={styles.questionCard} key={question.id}>
                <div className={styles.questionTopline}>
                  <span className={styles.questionNumber}>
                    QUESTION {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.pointsBadge}>
                    {question.points}{" "}
                    {question.points === 1 ? "point" : "points"}
                  </span>
                </div>
                <legend className={styles.questionTitle}>
                  {question.questionText}
                </legend>

                <div className={styles.options}>
                  {question.options.map((option, optionIndex) => {
                    const selected =
                      selectedAnswers[question.id] === option.id;

                    return (
                      <label
                        className={`${styles.option} ${
                          selected ? styles.optionSelected : ""
                        }`}
                        key={option.id}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={selected}
                          onChange={() => {
                            setSelectedAnswers((previous) => ({
                              ...previous,
                              [question.id]: option.id,
                            }));
                          }}
                          disabled={submitting}
                        />
                        <span className={styles.optionLetter}>
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className={styles.optionText}>
                          {option.optionText}
                        </span>
                        <span
                          className={styles.optionCheck}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className={styles.submitBar}>
            <p>
              <strong>{answeredCount}</strong> of {quiz.questions.length}{" "}
              answered
            </p>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
