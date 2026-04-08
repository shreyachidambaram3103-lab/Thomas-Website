import React, { useEffect, useState, useRef } from 'react';

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
  const [loadingFact, setLoadingFact] = useState(false);
  const [loadingBonus, setLoadingBonus] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const [showDifficulty, setShowDifficulty] = useState(false);
  const [activeGame, setActiveGame] = useState<'daily' | 'jeopardy' | 'timed' | null>(null);
  const [activeSport, setActiveSport] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const today = getTodayString();

  // Load main fact
  useEffect(() => {
    setLoadingFact(true);
    fetch('/api/generateFact', { method: 'POST' })
      .then(r => r.json())
      .then(data => setMainFact(data))
      .catch(() => setMainFact({ fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' }))
      .finally(() => setLoadingFact(false));
  }, []);

  const startDailyQuiz = () => {
    if (localStorage.getItem('quizDate') === today) {
      alert('You have already taken today\'s quiz!');
      return;
    }
    setActiveGame('daily');
    setShowDifficulty(true);
  };

  const selectDifficulty = async (level: 'easy' | 'medium' | 'hard') => {
    setShowDifficulty(false);
    setLoadingQuiz(true);
    try {
      const res = await fetch('/api/generateQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: level })
      });
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

  // Timer for Timed Quiz
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setShowResult(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, timerActive]);

  const startTimedQuiz = () => {
    setActiveGame('timed');
    setTimeLeft(60);
    setTimerActive(true);
    setShowResult(false);
    setUserAnswers([]);
    // For simplicity, we reuse the same quiz logic but with timer
    selectDifficulty('hard'); // Hard for timed mode
  };

  // Sports modal content
  const getSportContent = (sport: string) => {
    switch (sport) {
      case 'f1':
        return "Max Verstappen wins Saudi GP. Hamilton P4. Indian driver getting strong results in lower formulas.";
      case 'football':
        return "Indian Super League: Mohun Bagan leads. Premier League: Arsenal maintaining top position.";
      case 'cricket':
        return "IPL 2025 updates: RCB and CSK make big moves. India wins recent ODI series against Australia.";
      case 'ufc':
        return "UFC 310: Topuria retains featherweight title via KO. Indian fighter making waves in lightweight.";
      default:
        return "Latest updates loading...";
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="logo-container">
          <h1 className="logo">Thomas' Fact Machine</h1>
          <p className="subtitle">For daily facts that only you would ever want to know</p>
        </div>

        <button className="quiz-button" onClick={startDailyQuiz}>
          Daily Quiz
        </button>

        {showDifficulty && (
          <div className="difficulty-buttons">
            <button className="difficulty-btn" onClick={() => selectDifficulty('easy')}>Easy (4/10)</button>
            <button className="difficulty-btn" onClick={() => selectDifficulty('medium')}>Medium (6/10)</button>
            <button className="difficulty-btn" onClick={() => selectDifficulty('hard')}>Hard (8/10)</button>
          </div>
        )}
      </header>

      <div className="main-layout">
        {/* LEFT SPORTS PANEL */}
        <div className="sidebar">
          <h3>Sports Live</h3>
          <div className="sport-option" onClick={() => setActiveSport('f1')}>🏎️ F1</div>
          <div className="sport-option" onClick={() => setActiveSport('football')}>⚽ Football</div>
          <div className="sport-option" onClick={() => setActiveSport('cricket')}>🏏 Cricket (India + IPL)</div>
          <div className="sport-option" onClick={() => setActiveSport('ufc')}>🥊 UFC</div>
        </div>

        {/* MAIN CONTENT */}
        <div className="content">
          <section className="fact-card">
            <h2>Today's Fact</h2>
            {loadingFact && <p>Loading fact...</p>}
            {mainFact && (
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
            )}
          </section>

          {/* PLAY PANEL */}
          <section className="quiz-area">
            <h2>Play</h2>

            {!activeGame && (
              <div className="game-options">
                <button className="game-btn" onClick={startDailyQuiz}>Daily Quiz</button>
                <button className="game-btn" onClick={() => setActiveGame('jeopardy')}>Jeopardy</button>
                <button className="game-btn" onClick={startTimedQuiz}>Timed Quizzes</button>
              </div>
            )}

            {activeGame === 'daily' && showDifficulty && (
              <div className="difficulty-buttons">
                <button className="difficulty-btn" onClick={() => selectDifficulty('easy')}>Easy (4/10)</button>
                <button className="difficulty-btn" onClick={() => selectDifficulty('medium')}>Medium (6/10)</button>
                <button className="difficulty-btn" onClick={() => selectDifficulty('hard')}>Hard (8/10)</button>
              </div>
            )}

            {loadingQuiz && <p>Generating quiz...</p>}

            {quiz && activeGame === 'daily' && (
              <>
                {showResult && (
                  <div className="quiz-result">
                    <p>Your score: <strong>{score}/{quiz.questions.length}</strong></p>
                    {score > 8 ? <p className="success">Excellent! Bonus fact unlocked.</p> : <p>Good try!</p>}
                  </div>
                )}

                <ol>
                  {quiz.questions.map((q, i) => (
                    <li key={i} className="quiz-q">
                      <div className="q-text" dangerouslySetInnerHTML={{ __html: q.prompt }} />
                      <ul className="choices">
                        {q.choices.map((c, j) => (
                          <li key={j}>
                            <label className={
                              showResult
                                ? j === q.answer_index ? 'correct' : userAnswers[i] === j ? 'incorrect' : ''
                                : userAnswers[i] === j ? 'selected' : ''
                            }>
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

                {!showResult && <button className="submit-quiz" onClick={submitQuiz}>Submit Answers</button>}
              </>
            )}

            {activeGame === 'jeopardy' && (
              <p>Jeopardy Mode - Full implementation coming in next update (category selection + clues)</p>
            )}

            {activeGame === 'timed' && (
              <div>
                <p>Timed Quiz (Sporcle Style)</p>
                <p>Time left: <strong>{timeLeft}</strong> seconds</p>
                <p>Timer will start when questions load. Full implementation coming soon.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* SPORTS POP-UP MODAL */}
      {activeSport && (
        <div className="modal-overlay" onClick={() => setActiveSport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeSport.toUpperCase()} Updates</h3>
              <button className="close-btn" onClick={() => setActiveSport(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{getSportContent(activeSport)}</p>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">Built for educational use.</footer>
    </div>
  );
}
