import { headers } from "next/headers";
import styles from "./page.module.css";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

type AttemptResult = {
  attemptId: number | string;
  studentName: string | null;
  studentEmail: string;
  score: number | null;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  passed: boolean | null;
};

export default async function AssessmentResultsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>COURSE ANALYTICS</span>
            <h1>Assessment results</h1>
            <p>Review student submissions and performance at a glance.</p>
          </div>
          <span className={styles.viewLabel}>INSTRUCTOR VIEW</span>
        </header>
      <AssessmentResults assessmentId={id} />
      </div>
    </main>
  );
}
async function AssessmentResults({ assessmentId }: { assessmentId: string }) {
  const requestHeaders = await headers();

  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return (
      <p className={styles.errorState} role="alert">
        Unable to determine the application URL.
      </p>
    );
  }

  const response = await fetch(
    `${protocol}://${host}/api/assessments/${assessmentId}/results`,
    {
      cache: "no-store",
      headers: {
        cookie: requestHeaders.get("cookie") ?? "",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status >= 500) {
      console.error("Assessment results API error:", {
        status: response.status,
        body: errorText,
      });
    }

    return (
      <p className={styles.errorState} role="alert">
        Unable to load assessment results. Status: {response.status}—{" "}
        {errorText}
      </p>
    );
  }

  const data = await response.json();
  const results: AttemptResult[] = data.results ?? [];
  const gradedResults = results.filter((attempt) => attempt.score !== null);
  const averageScore =
    gradedResults.length > 0
      ? Math.round(
          gradedResults.reduce((total, attempt) => total + (attempt.score ?? 0), 0) /
            gradedResults.length,
        )
      : null;
  const passedCount = gradedResults.filter((attempt) => attempt.passed).length;
  const passRate =
    gradedResults.length > 0
      ? Math.round((passedCount / gradedResults.length) * 100)
      : null;

  return (
    <section className={styles.resultsContent}>
      <div className={styles.metrics} aria-label="Assessment summary">
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Total attempts</span>
          <strong>{results.length}</strong>
          <span className={styles.metricNote}>All student submissions</span>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Average score</span>
          <strong>{averageScore === null ? "—" : `${averageScore}%`}</strong>
          <span className={styles.metricNote}>Across graded attempts</span>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Pass rate</span>
          <strong>{passRate === null ? "—" : `${passRate}%`}</strong>
          <span className={styles.metricNote}>Of graded attempts</span>
        </article>
      </div>

      <section className={styles.attemptsPanel} aria-labelledby="attempts-title">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>SUBMISSIONS</span>
            <h2 id="attempts-title">Student attempts</h2>
          </div>
          <span className={styles.attemptCount}>
            {results.length} {results.length === 1 ? "attempt" : "attempts"}
          </span>
        </div>

        {results.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyMark} aria-hidden="true">0</span>
            <h3>No attempts yet</h3>
            <p>Student submissions will appear here once they complete this assessment.</p>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Email</th>
                  <th scope="col">Score</th>
                  <th scope="col">Status</th>
                  <th scope="col">Result</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((attempt) => (
                  <tr key={attempt.attemptId}>
                    <td className={styles.studentName}>
                      {attempt.studentName ?? "Unknown student"}
                    </td>
                    <td className={styles.studentEmail}>{attempt.studentEmail}</td>
                    <td className={styles.scoreCell}>
                      {attempt.score === null ? "—" : `${attempt.score}%`}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>
                        {attempt.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          attempt.score === null
                            ? styles.resultPending
                            : attempt.passed
                              ? styles.resultPassed
                              : styles.resultFailed
                        }`}
                      >
                        {attempt.score === null
                          ? "Pending"
                          : attempt.passed
                            ? "Passed"
                            : "Failed"}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleString()
                        : "Not submitted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
