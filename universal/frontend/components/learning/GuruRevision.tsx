"use client";
import React, { useState } from "react";
import type { GuruNotesView } from "../../lib/learning/guru-notes-api";
import { RevisionFormat, flashCards, memoryNotes, onePage, questionBank, quickNotes } from "../../lib/learning/notes-revision";

/**
 * Revision formats for the open page, all derived from the same Guru Notes: quick notes, memory
 * notes, flash cards, a question bank by difficulty with answers, and a one-page sheet.
 */
export function GuruRevision({ view, format }: { view: GuruNotesView; format: RevisionFormat }) {
  if (format === "Quick notes") {
    const q = quickNotes(view);
    return (
      <div data-testid="revision-quick" className="space-y-3">
        <p className="font-semibold">{q.title}</p>
        <p className="text-xs uppercase tracking-wide opacity-70">You will be able to</p>
        <ul className="list-disc pl-5">
          {q.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
        <p className="text-xs uppercase tracking-wide opacity-70">Topic by topic</p>
        <ol className="list-decimal pl-5 space-y-1">
          {q.topics.map((t) => (
            <li key={t.id}>
              <strong>{t.heading}.</strong> {t.line}
            </li>
          ))}
        </ol>
        <p className="text-xs uppercase tracking-wide opacity-70">In short</p>
        <ul className="list-disc pl-5">
          {q.summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (format === "Memory notes") {
    const m = memoryNotes(view);
    return (
      <div data-testid="revision-memory" className="space-y-3">
        <p className="text-xs uppercase tracking-wide opacity-70">Words to remember</p>
        <dl className="space-y-1">
          {m.terms.map((t) => (
            <div key={t.topic + t.term}>
              <dt className="inline font-semibold">{t.term}: </dt>
              <dd className="inline">{t.meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs uppercase tracking-wide opacity-70">Tricks to remember</p>
        <ul className="list-disc pl-5">
          {m.tips.map((t, i) => (
            <li key={i}>
              <em>{t.topic}:</em> {t.tip}
            </li>
          ))}
        </ul>
        {m.facts.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide opacity-70">Did you know?</p>
            <ul className="list-disc pl-5">
              {m.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </>
        )}
        <p className="text-xs uppercase tracking-wide opacity-70">Must remember</p>
        <ul className="list-disc pl-5">
          {m.mustRemember.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (format === "Flash cards") return <FlashCardDeck view={view} />;
  if (format === "Question bank") {
    const bank = questionBank(view);
    const group = (label: string, items: typeof bank.easy) =>
      items.length > 0 && (
        <div key={label}>
          <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
          <ol className="list-decimal pl-5 space-y-1">
            {items.map((q) => (
              <li key={q.id}>
                {q.question} <Reveal answer={q.answer} />
              </li>
            ))}
          </ol>
        </div>
      );
    return (
      <div data-testid="revision-bank" className="space-y-3">
        {group("Easy", bank.easy)}
        {group("Medium", bank.medium)}
        {group("Extended: questions readers asked", bank.extended)}
      </div>
    );
  }
  const sheet = onePage(view);
  return (
    <div data-testid="revision-one-page" className="space-y-2 text-sm">
      <p className="font-semibold">{sheet.title}</p>
      <p>{sheet.whatItIsAbout}</p>
      <p className="text-xs uppercase tracking-wide opacity-70">Must know</p>
      <ul className="list-disc pl-5">
        {sheet.mustKnow.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      {sheet.terms.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide opacity-70">Words</p>
          <p>
            {sheet.terms.map((t) => (
              <span key={t.term}>
                <strong>{t.term}</strong>: {t.meaning}{" "}
              </span>
            ))}
          </p>
        </>
      )}
      <p className="text-xs uppercase tracking-wide opacity-70">Remember</p>
      <ul className="list-disc pl-5">
        {sheet.tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {sheet.tryNow.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide opacity-70">Try at home</p>
          <ul className="list-disc pl-5">
            {sheet.tryNow.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </>
      )}
      <p className="text-xs uppercase tracking-wide opacity-70">Check yourself</p>
      <ol className="list-decimal pl-5">
        {sheet.questions.map((q, i) => (
          <li key={i}>
            {q.question} <span className="opacity-80">({q.answer})</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Reveal({ answer }: { answer: string }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <span data-testid="bank-answer" className="block pl-2 opacity-90">
      Answer: {answer}
    </span>
  ) : (
    <button type="button" className="underline text-sm" onClick={() => setOpen(true)}>
      Show answer
    </button>
  );
}

function FlashCardDeck({ view }: { view: GuruNotesView }) {
  const cards = flashCards(view);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards.length) return <p>No cards yet: the notes have no words, checks or questions to revise.</p>;
  const card = cards[Math.min(index, cards.length - 1)];
  const kindLabel = { term: "Word", quiz: "Circle the correct answer", check: "Check yourself", doubt: "A doubt children have", asked: "A reader asked" }[card.kind];
  return (
    <div data-testid="revision-cards" className="space-y-3">
      <p className="text-xs uppercase tracking-wide opacity-70">
        Card {index + 1} of {cards.length} · {kindLabel} · {card.topic}
      </p>
      <div className="rounded-xl bg-black/20 p-4 min-h-[6rem]" data-testid="flash-card" aria-live="polite">
        <p className="font-semibold">{card.front}</p>
        {flipped && (
          <p data-testid="flash-back" className="mt-2">
            {card.back}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="rounded bg-emerald-700 px-3 py-1.5 text-sm" onClick={() => setFlipped((f) => !f)}>
          {flipped ? "Hide answer" : "Show answer"}
        </button>
        <button
          type="button"
          className="rounded bg-black/30 px-3 py-1.5 text-sm"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded bg-black/30 px-3 py-1.5 text-sm"
          disabled={index >= cards.length - 1}
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
