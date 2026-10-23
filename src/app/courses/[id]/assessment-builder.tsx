"use client";

import { useEffect, useState } from "react";

type Option = {
  optionText: string;
  isCorrect: boolean;
};

type AssessmentBuilderProps = {
  courseId: number;
};

type ExistingAssessment = {
  id: number;
  title: string;
  status: "draft" | "published";
};

export default function AssessmentBuilder({
  courseId,
}: AssessmentBuilderProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [passingScore, setPassingScore] = useState(50);

  const [assessmentId, setAssessmentId] = useState<number | null>(null);

  const [existingAssessments, setExistingAssessments] = useState<
    ExistingAssessment[]
  >([]);

  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<Option[]>([
    { optionText: "", isCorrect: true },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
    { optionText: "", isCorrect: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const response = await fetch(`/api/courses/${courseId}/assessments`);

        if (!response.ok) {
          throw new Error("Could not load assessments.");
        }

        const data = await response.json();

        setExistingAssessments(data.assessments ?? []);
      } catch (error) {
        console.error("Failed to load assessments:", error);
      }
    }

    loadAssessments();
  }, [courseId]);

  async function createAssessment() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/courses/${courseId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          instructions,
          passingScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Could not create assessment.");
      }

      // Support either a direct assessment object or
      // an object containing an assessment property.
      const assessment = data.assessment ?? data;

      if (!Number.isSafeInteger(assessment.id) || assessment.id <= 0) {
        throw new Error("The server did not return a valid assessment ID.");
      }

      setAssessmentId(assessment.id);
      setMessage("Assessment created as a draft. Now add questions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function updateOption(index: number, optionText: string) {
    setOptions((current) =>
      current.map((option, i) =>
        i === index ? { ...option, optionText } : option,
      ),
    );
  }

  function selectCorrectOption(index: number) {
    setOptions((current) =>
      current.map((option, i) => ({
        ...option,
        isCorrect: i === index,
      })),
    );
  }

  function addOption() {
    if (options.length >= 6) return;

    setOptions((current) => [...current, { optionText: "", isCorrect: false }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;

    setOptions((current) => {
      const next = current.filter((_, i) => i !== index);

      // Ensure a correct answer remains selected.
      if (!next.some((option) => option.isCorrect)) {
        next[0].isCorrect = true;
      }

      return next;
    });
  }

  async function addQuestion() {
    if (!assessmentId) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionText,
            points,
            options,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Could not save question.");
      }

      setQuestionText("");
      setPoints(1);
      setOptions([
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
        { optionText: "", isCorrect: false },
      ]);

      setMessage("Question saved successfully. Add another question.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function publishAssessment() {
    if (!assessmentId) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/assessments/${assessmentId}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Could not publish assessment.");
      }

      setIsPublished(true);
      setMessage("Assessment published successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function resumeAssessment(assessment: ExistingAssessment) {
    setAssessmentId(assessment.id);
    setSelectedAssessmentId(assessment.id);
    setIsPublished(assessment.status === "published");
    setMessage(`Resumed: ${assessment.title}`);
    setError("");
  }

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <section>
        <h2>Existing assessments</h2>

        {existingAssessments.length === 0 ? (
          <p>No assessments created yet.</p>
        ) : (
          <ul>
            {existingAssessments.map((assessment) => (
              <li key={assessment.id}>
                <span>
                  {assessment.title} — {assessment.status}
                </span>

                <button
                  type="button"
                  onClick={() => resumeAssessment(assessment)}
                >
                  {assessment.id === selectedAssessmentId
                    ? "Selected"
                    : "Resume"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="border-b border-slate-100 bg-linear-to-br from-indigo-50/70 via-white to-white px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold tracking-wide text-brand">
          COURSE ASSESSMENT
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Create course assessment
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Build a quiz for your students. Set a passing score, then add
          questions and choose the correct answer for each one.
        </p>
      </div>

      {!assessmentId ? (
        <form
          className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8 sm:py-8"
          onSubmit={(event) => {
            event.preventDefault();
            void createAssessment();
          }}
        >
          <div className="sm:col-span-2">
            <label
              htmlFor="assessment-title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Assessment title
            </label>
            <input
              id="assessment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={200}
              required
              placeholder="e.g. Module 1 knowledge check"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="assessment-instructions"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Instructions{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="assessment-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Tell students what to expect before they begin."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="passing-score"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Passing score
            </label>
            <div className="relative">
              <input
                id="passing-score"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(event) =>
                  setPassingScore(Number(event.target.value))
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-indigo-100"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-400">
                %
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Minimum percentage required to pass.
            </p>
          </div>

          <div className="flex items-end sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Creating..." : "Create assessment"}
              {!loading && <span aria-hidden="true">-&gt;</span>}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-ink">
                Add a question
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Write the question, add answer choices, and mark one correct.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Draft
            </span>
          </div>

          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void addQuestion();
            }}
          >
            <div>
              <label
                htmlFor="question-text"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Question
              </label>
              <textarea
                id="question-text"
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                minLength={5}
                maxLength={2000}
                required
                rows={4}
                placeholder="Type your question here..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="max-w-xs">
              <label
                htmlFor="question-points"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Points
              </label>
              <input
                id="question-points"
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(event) => setPoints(Number(event.target.value))}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <legend className="px-2 text-sm font-semibold text-slate-700">
                Answer options
              </legend>
              <p className="mb-4 text-sm leading-6 text-slate-500">
                Select the radio button beside the correct answer.
              </p>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition sm:flex-nowrap ${
                      option.isCorrect
                        ? "border-indigo-200 bg-indigo-50/70"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <label
                      htmlFor={`correct-option-${index}`}
                      className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"
                    >
                      <input
                        id={`correct-option-${index}`}
                        type="radio"
                        name="correct-option"
                        aria-label={`Mark option ${index + 1} correct`}
                        checked={option.isCorrect}
                        onChange={() => selectCorrectOption(index)}
                        className="size-4 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      />
                      <span>Option {index + 1}</span>
                    </label>

                    <input
                      id={`option-${index}`}
                      value={option.optionText}
                      onChange={(event) =>
                        updateOption(index, event.target.value)
                      }
                      maxLength={500}
                      placeholder={`Enter option ${index + 1}`}
                      required
                      aria-label={`Option ${index + 1} text`}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-indigo-100"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {options.length < 6 ? (
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    +
                  </span>
                  Add option
                </button>
              ) : (
                <p className="text-xs text-slate-500">
                  Maximum of 6 answer options.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Saving..." : "Save question"}
                {!loading && <span aria-hidden="true">-&gt;</span>}
              </button>

              <button
                type="button"
                onClick={publishAssessment}
                disabled={loading || isPublished}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Please wait..." : "Publish assessment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {(message || error) && (
        <div className="space-y-3 px-6 pb-6 sm:px-8 sm:pb-8">
          {message && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
            >
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
