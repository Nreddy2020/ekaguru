"use client";
import React, { useMemo, useState } from "react";
import styles from "./ApprovedClassroom.module.css";
import type { GuruNotesView } from "../../lib/learning/guru-notes-api";
import {
  deriveTeacherParentEdition,
  type TeacherParentEdition,
} from "../../lib/learning/teacher-parent-api";

export function TeacherParentEditionView({
  view,
  customEdition,
}: {
  view: GuruNotesView;
  customEdition?: TeacherParentEdition;
}) {
  const edition = useMemo(
    () => customEdition || deriveTeacherParentEdition(view),
    [customEdition, view],
  );

  const [activeSection, setActiveSection] = useState<
    "all" | "teacher" | "parent" | "assessment"
  >("all");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div
      data-testid="teacher-parent-edition"
      className={styles.teacherParentWrapper}
    >
      <header className={styles.tpHeader}>
        <div className={styles.tpBadgeRow}>
          <span className={styles.tpBadge}>🍎 Teacher & Parent Edition</span>
          <span className={styles.tpPagePill}>Page {edition.page}</span>
        </div>
        <h3 className={styles.tpTitle}>{edition.title}</h3>
        <p className={styles.tpSubtitle}>
          Complete instructional companion: classroom board layout, home analogies, guided inquiry, misconceptions, and assessment.
        </p>

        {/* Section Filter Pills */}
        <div className={styles.tpFilterRow}>
          {(
            [
              { id: "all", label: "Full Edition" },
              { id: "teacher", label: "📋 Teacher Board Plan" },
              { id: "parent", label: "🏡 Parent Home Guide" },
              { id: "assessment", label: "📝 Assessment & Homework" },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={styles.tpFilterBtn}
              data-active={activeSection === filter.id ? "true" : undefined}
              onClick={() => setActiveSection(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* 1. Objectives & Prerequisites */}
      {(activeSection === "all" || activeSection === "teacher") && (
        <section className={styles.tpCard} data-testid="tp-objectives-prereqs">
          <div className={styles.tpCardGrid}>
            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>🎯 Learning Objectives</h4>
              <ul className={styles.tpList}>
                {edition.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>🔗 Prerequisites & Readiness</h4>
              <div className={styles.tpPrereqList}>
                {edition.prerequisites.map((prereq, i) => (
                  <div key={i} className={styles.tpPrereqItem}>
                    <strong>
                      {prereq.concept} {prereq.page ? `(Page ${prereq.page})` : ""}
                    </strong>
                    <p>{prereq.reason}</p>
                    {prereq.checkQuestion && (
                      <em>{prereq.checkQuestion}</em>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Board Plan for Teachers */}
      {(activeSection === "all" || activeSection === "teacher") && (
        <section className={styles.tpCard} data-testid="tp-board-plan">
          <div className={styles.tpCardHeader}>
            <span className={styles.tpSectionTag}>Classroom Instruction</span>
            <h4>📋 {edition.boardPlan.title}</h4>
            <p className={styles.tpCardDesc}>{edition.boardPlan.summary}</p>
          </div>
          <ol className={styles.tpBoardSteps}>
            {edition.boardPlan.steps.map((step) => (
              <li key={step.stepNumber} className={styles.tpBoardStepItem}>
                <div className={styles.tpStepNum}>Step {step.stepNumber}</div>
                <div className={styles.tpStepContent}>
                  <div className={styles.tpStepPhase}>{step.phase.toUpperCase()}</div>
                  <div className={styles.tpBoardSnippet}>
                    <strong>Board chalk & drawing:</strong>
                    <pre>{step.whatToWriteOrDraw}</pre>
                  </div>
                  <p className={styles.tpTeacherVoice}>
                    <strong>Teacher Voice:</strong> "{step.teacherSpeechGuidance}"
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 3. Parent Home Guide */}
      {(activeSection === "all" || activeSection === "parent") && (
        <section className={styles.tpCard} data-testid="tp-home-guide">
          <div className={styles.tpCardHeader}>
            <span className={styles.tpSectionTag}>For Parents at Home</span>
            <h4>🏡 How to Explain It at Home</h4>
          </div>

          <div className={styles.tpAnalogyCallout}>
            <strong>💡 Everyday Analogy to Share:</strong>
            <p>{edition.homeExplanation.everydayAnalogy}</p>
          </div>

          <div className={styles.tpCardGrid}>
            <div className={styles.tpColumn}>
              <h5>💬 Dinnertime & Car-Ride Conversation Starters:</h5>
              <ul className={styles.tpList}>
                {edition.homeExplanation.conversationStarters.map((starter, i) => (
                  <li key={i}>{starter}</li>
                ))}
              </ul>
            </div>
            <div className={styles.tpColumn}>
              <h5>🌱 Tips for Encouraging Understanding:</h5>
              <ul className={styles.tpList}>
                {edition.homeExplanation.parentTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 4. Hands-on Activity */}
      {(activeSection === "all" || activeSection === "teacher" || activeSection === "parent") && (
        <section className={styles.tpCard} data-testid="tp-activity">
          <div className={styles.tpCardHeader}>
            <span className={styles.tpSectionTag}>Hands-On Learning</span>
            <h4>🧪 {edition.activity.title}</h4>
          </div>
          <div className={styles.tpActivityGrid}>
            <div>
              <strong>Materials:</strong>
              <ul className={styles.tpList}>
                {edition.activity.materials.map((mat, i) => (
                  <li key={i}>{mat}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Instructions:</strong>
              <ol className={styles.tpNumberedList}>
                {edition.activity.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className={styles.tpNoticeCallout}>
            <strong>What to look for:</strong> {edition.activity.whatToNotice}
          </div>
        </section>
      )}

      {/* 5. Questions to Ask & Misconceptions */}
      {(activeSection === "all" || activeSection === "teacher" || activeSection === "parent") && (
        <section className={styles.tpCard} data-testid="tp-questions-misconceptions">
          <div className={styles.tpCardGrid}>
            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>❓ Guided Questions to Ask</h4>
              <div className={styles.tpQuestionList}>
                {edition.questionsToAsk.map((q, i) => (
                  <div key={i} className={styles.tpQuestionItem}>
                    <span className={styles.tpBloomBadge} data-level={q.level}>
                      {q.level.toUpperCase()}
                    </span>
                    <strong>{q.question}</strong>
                    <p className={styles.tpExpectedAnswer}>
                      <strong>Expected:</strong> {q.expectedAnswer}
                    </p>
                    {q.followUpPrompt && (
                      <p className={styles.tpFollowUp}>
                        <em>Follow-up: {q.followUpPrompt}</em>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>⚠️ Common Misconceptions</h4>
              <div className={styles.tpMisconceptionList}>
                {edition.misconceptions.map((m, i) => (
                  <div key={i} className={styles.tpMisconceptionItem}>
                    <p className={styles.tpMisconceptionWrong}>
                      ❌ <em>"{m.misconception}"</em>
                    </p>
                    <p className={styles.tpMisconceptionWhy}>
                      <strong>Why they think this:</strong> {m.whyChildThinksThis}
                    </p>
                    <p className={styles.tpMisconceptionFix}>
                      ✅ <strong>Gentle correction:</strong> {m.correctionStrategy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Assessment & Homework */}
      {(activeSection === "all" || activeSection === "assessment") && (
        <section className={styles.tpCard} data-testid="tp-assessment-homework">
          <div className={styles.tpCardGrid}>
            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>📝 Short Diagnostic Assessment</h4>
              <div className={styles.tpAssessmentList}>
                {edition.assessment.map((item, i) => (
                  <div key={i} className={styles.tpAssessmentItem}>
                    <p>
                      <strong>Q{item.questionNumber}:</strong> {item.question}
                    </p>
                    {item.options && (
                      <div className={styles.tpAssessmentOptions}>
                        {item.options.map((opt, oIdx) => (
                          <span key={oIdx} className={styles.tpOptionBadge}>
                            {["A", "B", "C", "D"][oIdx]}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.tpRevealBtn}
                      onClick={() => toggleAnswer(i)}
                    >
                      {revealedAnswers[i] ? "Hide answer" : "Show answer key"}
                    </button>
                    {revealedAnswers[i] && (
                      <div className={styles.tpAnswerKeyBlock}>
                        <strong>Answer:</strong> {item.correctAnswer}
                        <p>{item.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.tpColumn}>
              <h4 className={styles.tpSectionHeading}>🏠 Home Discovery Mission</h4>
              <div className={styles.tpHomeworkCard}>
                <h5>{edition.homework.title}</h5>
                <p className={styles.tpHomeworkTask}>
                  <strong>Task:</strong> {edition.homework.task}
                </p>
                <p className={styles.tpHomeworkPrompt}>
                  <strong>Observation Prompt:</strong> {edition.homework.observationPrompt}
                </p>
                <div className={styles.tpParentRole}>
                  <strong>Parent Role:</strong> {edition.homework.parentRole}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
