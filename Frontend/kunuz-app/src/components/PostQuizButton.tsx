"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

const API_URL = "http://127.0.0.1:8000";

type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation?: string;
};

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") || "";
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...options, headers });
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function QuizIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9a3 3 0 1 1 4.7 2.5c-1 .6-1.7 1.2-1.7 2.5" />
      <path d="M12 18h.01" />
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export default function PostQuizButton({
  postId,
  title,
  buttonClassName = "flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--accent-gold)] cursor-pointer",
  buttonStyle,
}: {
  postId: string;
  title: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const score = questions.reduce((total, question, index) => total + (answers[index] === question.answer_index ? 1 : 0), 0);
  const allAnswered = questions.length > 0 && questions.every((_, index) => answers[index] !== undefined);

  const loadQuiz = async () => {
    if (questions.length > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${API_URL}/api/posts/${postId}/quiz/`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not generate quiz.");
      const generated = data?.data?.questions ?? [];
      if (!Array.isArray(generated) || generated.length === 0) throw new Error("Could not generate quiz.");
      setQuestions(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen(true);
    await loadQuiz();
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const modal = open && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center px-4 py-6"
        style={{ backgroundColor: "rgba(0,0,0,0.44)" }}
        onClick={(event) => { event.stopPropagation(); setOpen(false); }}
      >
        <div
          className="flex w-[min(94vw,760px)] max-h-[86vh] flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: "var(--border-soft)" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: "#8B6914" }}>
                <QuizIcon size={16} />
                Quiz
              </div>
              <h3 className="mt-1 truncate text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {stripHtml(title)}
              </h3>
            </div>
            <button
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: "var(--foreground)" }}
              onClick={() => setOpen(false)}
              aria-label="Close quiz"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto feed-scroll px-6 py-5">
            {loading ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="h-8 w-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--border-soft)", borderTopColor: "#8B6914" }} />
                Generating quiz...
              </div>
            ) : error ? (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FDE8E8", color: "#8B1E1E" }}>
                {error}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {submitted && (
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
                    <p className="m-0 text-sm font-black" style={{ color: "var(--foreground)" }}>
                      Score: {score}/{questions.length}
                    </p>
                    <p className="m-0 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      {score === questions.length ? "Excellent. You got everything right." : "Review the corrections below and try again."}
                    </p>
                  </div>
                )}

                {questions.map((question, questionIndex) => (
                  <div key={`${question.question}-${questionIndex}`} className="rounded-xl p-4" style={{ backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-soft)" }}>
                    <p className="m-0 mb-3 text-sm font-black" style={{ color: "var(--foreground)" }}>
                      {questionIndex + 1}. {question.question}
                    </p>
                    <div className="grid gap-2">
                      {question.options.map((option, optionIndex) => {
                        const selected = answers[questionIndex] === optionIndex;
                        const isCorrect = submitted && optionIndex === question.answer_index;
                        const isWrong = submitted && selected && optionIndex !== question.answer_index;
                        return (
                          <button
                            key={`${option}-${optionIndex}`}
                            type="button"
                            className="rounded-xl px-3 py-2 text-left text-sm font-semibold transition-opacity hover:opacity-85"
                            style={{
                              backgroundColor: isCorrect ? "#DDF7E5" : isWrong ? "#FDE8E8" : selected ? "var(--foreground)" : "var(--background)",
                              color: isCorrect ? "#176C35" : isWrong ? "#8B1E1E" : selected ? "var(--background)" : "var(--foreground)",
                              border: "1px solid var(--border-soft)",
                            }}
                            onClick={() => {
                              if (!submitted) setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && question.explanation && (
                      <p className="m-0 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {question.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && !error && questions.length > 0 && (
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4" style={{ borderColor: "var(--border-soft)" }}>
              {submitted && (
                <button type="button" className="rounded-full px-4 py-2 text-sm font-bold" style={{ color: "var(--foreground)" }} onClick={resetQuiz}>
                  Try again
                </button>
              )}
              <button
                type="button"
                className="rounded-full px-5 py-2 text-sm font-black disabled:opacity-50"
                style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
                disabled={!allAnswered}
                onClick={() => setSubmitted(true)}
              >
                {submitted ? `Score ${score}/${questions.length}` : "Show score"}
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <button
        className={buttonClassName}
        style={{ color: open ? "#8B6914" : "var(--foreground)", ...buttonStyle }}
        onClick={handleClick}
        title="Generate quiz"
        aria-label="Generate quiz for this post"
      >
        <QuizIcon />
        <span>Quiz</span>
      </button>
      {modal}
    </>
  );
}
