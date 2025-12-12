export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // Same deterministic daily subject logic as frontend
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science', 'sports'];
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    // Map subjects to closest OpenTDB categories
    const categoryMap = {
      history: 23,               // History
      geography: 22,             // Geography
      anthropology: 17,          // Science & Nature (proxy)
      sociology: 24,             // Politics (proxy)
      economics: 24,             // Politics (proxy)
      'political science': 24,   // Politics
      sports: 21                 // Sports
    };

    const category = categoryMap[subject] || 23; // fallback to History

    const resp = await fetch(
      `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=hard&type=multiple`
    );

    if (!resp.ok) throw new Error('Trivia API failed');
    const j = await resp.json();

    if (j.response_code !== 0) throw new Error('Invalid trivia response');

    const questions = j.results.map((q) => {
      const choices = [...q.incorrect_answers, q.correct_answer];
      for (let i = choices.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[rand]] = [choices[rand], choices[i]];
      }
      const answer_index = choices.indexOf(q.correct_answer);
      return { prompt: q.question, choices, answer_index };
    });

    return res.json({ questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
