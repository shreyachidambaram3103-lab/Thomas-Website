export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let difficulty = 'hard'; // default

  try {
    const body = await req.json();
    if (body.difficulty === 'easy') difficulty = 'easy';
    else if (body.difficulty === 'medium') difficulty = 'medium';
    // 'hard' stays hard
  } catch {}

  const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
  const subject = subjects[subjectIndex];

  const categoryMap = {
    history: 23,
    geography: 22,
    anthropology: 17,
    sociology: 24,
    economics: 24,
    'political science': 24,
    sports: 21
  };

  const category = categoryMap[subject] || 23;

  try {
    const resp = await fetch(
      `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`
    );

    const j = await resp.json();

    if (j.response_code !== 0) throw new Error('No questions');

    const questions = j.results.map((q) => {
      const choices = [...q.incorrect_answers, q.correct_answer];
      for (let i = choices.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[rand]] = [choices[rand], choices[i]];
      }
      const answer_index = choices.indexOf(q.correct_answer);
      return { prompt: q.question, choices, answer_index };
    });

    res.json({ questions });
  } catch {
    // Fallback if API fails
    const fallback = {
      questions: [
        {
          prompt: "Which planet is known as the Red Planet?",
          choices: ["Venus", "Mars", "Jupiter", "Saturn"],
          answer_index: 1
        }
      ]
    };
    res.json(fallback);
  }
}
