import React, { useEffect, useState } from 'react';

type Fact = {
  fact: string;
  source_url?: string;
  source_title?: string;
};

type Question = {
  prompt: string;
  choices: string[];
  answer_index: number;
};

type Quiz = {
  questions: Question[];
};

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App(): JSX.Element {
  const [mainFact, setMainFact] = useState<Fact | null>(null);
  const [bonusFact, setBonusFact] = useState<Fact | null>(null);
  const [loadingFact, setLoadingFact] = useState(true);   // start as true
  const [loadingBonus, setLoadingBonus] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const today = getTodayString();

  // MAIN FACT — guaranteed to stop loading
  useEffect(() => {
    setLoadingFact(true);
    fetch('/api/generateFact', { method: 'POST' })
      .then(r => r.json())
      .then(data => setMainFact(data))
      .catch(() => {
        setMainFact({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });
      })
      .finally(() => setLoadingFact(false));   // ← this line fixes everything
  }, []);

  // BONUS FACT — also guaranteed to stop loading
  const fetchBonusFact = async () => {
    setLoadingBonus(true);
    try {
      const r = await fetch('/api/generateFact', { method: 'POST' });
      const data = await r.json();
      setBonusFact(data);
      localStorage.setItem('bonusFact', JSON.stringify(data));
      localStorage.setItem('bonusFactDate', today);
    } catch {
      setBonusFact({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' });
    } finally {
      setLoadingBonus(false);   // ← this line fixes bonus loading too
    }
  };

  // Load saved quiz
  useEffect(() => {
    const savedQuizDate = localStorage.getItem('quizDate');
    if (savedQuizDate === today) {
      const saved = localStorage.getItem('quiz');
      if (saved) setQuiz(JSON.parse(saved));
      const savedAnswers = localStorage.getItem('quizAnswers');
      if (savedAnswers) setUserAnswers(JSON.parse(savedAnswers));
      const savedResult = localStorage.getItem('quizResultShown');
      if (savedResult === 'true') setShowResult(true);
    }
  }, [today]);

  // Bonus fact unlock logic
  useEffect(() => {
    if (showResult && quiz) {
      const score = quiz.questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer_index ? 1 : 0), 0);
      if (score > 8) {
        const bonusDate = localStorage.getItem('bonusFactDate');
        if (bonusDate !== today) {
          fetchBonusFact();
        } else {
          const saved = localStorage.getItem('bonusFact');
          if (saved) setBonusFact(JSON.parse(saved));
        }
      }
    }
  }, [showResult, quiz, userAnswers, today]);

  const handleQuiz = async () => {
    if (localStorage.getItem('quizDate') === today) {
      alert('You have already taken today\'s quiz!');
      return;
    }
    setLoadingQuiz(true);
    try {
      const res = await fetch('/api/generateQuiz', { method: 'POST' });
      if (!res.ok) throw new Error();
      const q: Quiz = await res.json();
      setQuiz(q);
      setUserAnswers(new Array(q.questions.length).fill(-1));
      setShowResult(false);
      localStorage.setItem('quiz', JSON.stringify(q));
      localStorage.setItem('quizDate', today);
    } catch {
      alert('Could not generate quiz.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const selectAnswer = (qIndex: number, choiceIndex: number) => {
    if (showResult) return;
    const newAnswers = [...userAnswers];
    newAnswers[qIndex] = choiceIndex;
    setUserAnswers(newAnswers);
    localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));
  };

  const submitQuiz = () => {
    if (userAnswers.some(a => a === -1)) {
      alert('Please answer all questions!');
      return;
    }
    setShowResult(true);
    localStorage.setItem('quizResultShown', 'true');
  };

  const score = quiz ? quiz.questions.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer_index ? 1 : 0), 0) : 0;

  return (
    <div className="page">
      <header className="header">
        <div className="logo-container">
          <h1 className="logo">Thomas' Fact Machine</h1>
          <p className="subtitle">For daily facts that only you would ever want to know</p>
        </div>
        <button className="quiz-button" onClick={handleQuiz} disabled={loadingQuiz}>
          {localStorage.getItem('quizDate') === today ? 'Quiz (Taken Today)' : 'Daily Quiz'}
        </button>
      </header>

      <main className="content">
        <section className="fact-card">
          <h2>Today's Fact</h2>
          {loadingFact ? (
            <p>Loading fact...</p>
          ) : mainFact ? (
            <div>
              <p className="fact-text">{mainFact.fact}</p>
              {mainFact.source_url && (
                <p className="source">
                  Source: <a href={mainFact.source_url} target="_blank" rel="noopener noreferrer">
                    {mainFact.source_title || mainFact.source_url}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p>Error loading fact.</p>
          )}

          {bonusFact && (
            <div className="bonus-fact-card">
              <div className="bonus-ribbon">BONUS UNLOCKED</div>
              <h3>Bonus Fact</h3>
              {loadingBonus ? <p>Loading bonus fact...</p> : <p className="fact-text bonus">{bonusFact.fact}</p>}
              {bonusFact.source_url && (
                <p className="source bonus-source">
                  Source: <a href={bonusFact.source_url} target="_blank" rel="noopener noreferrer">
                    {bonusFact.source_title || bonusFact.source_url}
                  </a>
                </p>
              )}
            </div>
          )}
        </section>

        <section className="quiz-area">
          <h2>Daily Quiz</h2>
          {loadingQuiz && <p>Generating quiz...</p>}
          {!quiz && !loadingQuiz && localStorage.getItem('quizDate') !== today && (
            <p>Click "Daily Quiz" to start today's challenge.</p>
          )}
          {quiz && (
            <>
              {showResult && (
                <div className="quiz-result">
                  <p>Your score: <strong>{score}/{quiz.questions.length}</strong></p>
                  {score > 8 ? (
                    <p className="success">Excellent! You've unlocked a bonus fact.</p>
                  ) : (
                    <p>Good try! Score 9 or higher tomorrow to unlock a bonus fact.</p>
                  )}
                </div>
              )}

              <ol>
                {quiz.questions.map((q, i) => (
                  <li key={i} className="quiz-q">
                    <div className="q-text" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                    <ul className="choices">
                      {q.choices.map((c, j) => (
                        <li key={j}>
                          <label
                            className={
                              showResult
                                ? j === q.answer_index
                                  ? 'correct'
                                  : userAnswers[i] === j
                                    ? 'incorrect'
                                    : ''
                                : userAnswers[i] === j
                                  ? 'selected'
                                  : ''
                            }
                          >
                            <input
                              type="radio"
                              name={`q${i}`}
                              checked={userAnswers[i] === j}
                              onChange={() => selectAnswer(i, j)}
                              disabled={showResult}
                            />
                            <span dangerouslySetInnerHTML={{ __html: c }} />
                          </label>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              {!showResult && (
                <button className="submit-quiz" onClick={submitQuiz}>
                  Submit Answers
                </button>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="footer">Built for educational use.</footer>
    </div>
  );
}
