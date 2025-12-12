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
  const [loadingFact, setLoadingFact] = useState(false);
  const [loadingBonus, setLoadingBonus] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const today = getTodayString();

  const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];

  const getDailySubject = () => {
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
    const index = Math.abs(Math.sin(seed) * 100000) % subjects.length;
    return subjects[Math.floor(index)];
  };

  const currentSubject = getDailySubject();

  useEffect(() => {
    fetchFact(setMainFact, setLoadingFact, currentSubject);
  }, [currentSubject]);

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

  const fetchBonusFact = async () => {
    setLoadingBonus(true);
    await fetchFact(setBonusFact, () => setLoadingBonus(false), currentSubject);
    localStorage.setItem('bonusFactDate', today);
  };

  const handleQuiz = async () => {
    if (localStorage.getItem('quizDate') === today) {
      alert('You have already taken today\'s quiz!');
      return;
    }

    setLoadingQuiz(true);
    try {
      const res = await fetch('/api/generateQuiz', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const q: Quiz = await res.json();
      setQuiz(q);
      setUserAnswers(new Array(q.questions.length).fill(-1));
      setShowResult(false);
      localStorage.setItem('quiz', JSON.stringify(q));
      localStorage.setItem('quizDate', today);
    } catch (e) {
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

  const fetchFact = async (setFactFunc: (f: Fact) => void, setLoadingFunc: (l: boolean) => void, subject: string) => {
    setLoadingFunc(true);
    let attempts = 0;
    const maxAttempts = 10;
    const factHistory = new Set(JSON.parse(localStorage.getItem('factHistory') || '[]'));
    let allMembers: any[] = [];

    try {
      // Deep search: generator=categorymembers with cmcontinue for up to 500 articles (including subcats via depth)
      let continueToken = '';
      do {
        let url = `https://en.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtype=page&gcmnamespace=0&gcmtitle=Category:${subject.charAt(0).toUpperCase() + subject.slice(1)}&gcmlimit=500&format=json`;
        if (continueToken) url += `&gcmcontinue=${continueToken}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Category fetch failed');
        const json = await res.json();

        const pages = json.query?.pages ? Object.values(json.query.pages) : [];
        allMembers = allMembers.concat(pages);

        continueToken = json.continue?.gcmcontinue || '';
      } while (continueToken && allMembers.length < 500);

      if (allMembers.length === 0) throw new Error('No articles found');

      let selected;
      while (attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * allMembers.length);
        selected = allMembers[randomIndex];
        if (!factHistory.has(selected.title)) break;
        attempts++;
      }

      if (factHistory.has(selected.title)) throw new Error('All articles seen');

      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selected.title)}`);
      if (!summaryRes.ok) throw new Error('Summary fetch failed');
      const summaryJson = await summaryRes.json();

      let factText = summaryJson.extract || `${selected.title}: ${summaryJson.description || 'An interesting article.'}`;
      factText = factText.trim();
      if (!factText.endsWith('.')) factText += '.';

      const factObj = {
        fact: factText,
        source_url: summaryJson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(selected.title)}`,
        source_title: selected.title
      };

      factHistory.add(selected.title);
      localStorage.setItem('factHistory', JSON.stringify(Array.from(factHistory)));
      setFactFunc(factObj);
      setLoadingFunc(false);
      return;
    } catch (e) {
      console.error('Fact generation failed:', e);
      const fallback = { fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.' };
      setFactFunc(fallback);
      setLoadingFunc(false);
    }
  };

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
          {loadingFact && <p>Loading fact...</p>}
          {mainFact && (
            <div>
              <p className="fact-text">{mainFact.fact}</p>
              {mainFact.source_url ? (
                <p className="source">Source: <a href={mainFact.source_url} target="_blank" rel="noopener noreferrer">{mainFact.source_title || mainFact.source_url}</a></p>
              ) : (
                <p className="source">No source available.</p>
              )}
            </div>
          )}

          {bonusFact && (
            <div className="bonus-fact-card">
              <div className="bonus-ribbon">BONUS UNLOCKED</div>
              <h3>Bonus Fact</h3>
              {loadingBonus && <p>Loading bonus fact...</p>}
              <p className="fact-text bonus">{bonusFact.fact}</p>
              {bonusFact.source_url && (
                <p className="source bonus-source">Source: <a href={bonusFact.source_url} target="_blank" rel="noopener noreferrer">{bonusFact.source_title || bonusFact.source_url}</a></p>
              )}
            </div>
          )}
        </section>

        <section className="quiz-area">
          <h2>Daily Quiz</h2>
          {loadingQuiz && <p>Generating quiz...</p>}
          {!quiz && !loadingQuiz && localStorage.getItem('quizDate') !== today && <p>Click "Daily Quiz" to start today's challenge.</p>}
          {quiz && (
            <>
              {showResult && (
                <div className="quiz-result">
                  <p>Your score: <strong>{score}/{quiz.questions.length}</strong></p>
                  {score > 8 ? <p className="success">Excellent! You've unlocked a bonus fact.</p> : <p>Good try! Score 9 or higher tomorrow to unlock a bonus fact.</p>}
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
                              ? j === q.answer_index
                                ? 'correct'
                                : userAnswers[i] === j
                                  ? 'incorrect'
                                  : ''
                              : userAnswers[i] === j
                                ? 'selected'
                                : ''
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
