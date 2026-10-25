import { headers } from "next/headers";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

type AttemptResult = {
  id: number | string;
  name: string | null;
  email: string;
  score: number | null;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  passed: boolean | null;
};
export default async function AssessmentResultsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main>
      <h1>Assessment Results</h1>
      <p>Review student submissions and performance.</p>

      <AssessmentResults assessmentId={id} />
    </main>
  );
}
async function AssessmentResults({ assessmentId }: { assessmentId: string }) {
  const requestHeaders = await headers();

  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return <p>Unable to determine the application URL.</p>;
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

  console.error("Assessment results API error:", {
    status: response.status,
    body: errorText,
  });

  return (
    <p>
      Unable to load assessment results.
      Status: {response.status}
      — {errorText}
    </p>
  );
}

  const data = await response.json();
  const results: AttemptResult[] = data.results ?? [];

  if (results.length === 0) {
    return <p>No student attempts have been recorded yet.</p>;
  }

  return (
    <section>
      <p>Total attempts: {results.length}</p>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>Score</th>
            <th>Status</th>
            <th>Result</th>
            <th>Submitted</th>
          </tr>
        </thead>

        <tbody>
          {results.map((attempt) => (
            <tr key={attempt.id}>
              <td>{attempt.name ?? "Unknown student"}</td>
              <td>{attempt.email}</td>
              <td>{attempt.score ?? "Not graded"}</td>
              <td>{attempt.status}</td>
              <td>
                {attempt.passed === null
                  ? "Pending"
                  : attempt.passed
                    ? "Passed"
                    : "Failed"}
              </td>
              <td>
                {attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleString()
                  : "Not submitted"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
