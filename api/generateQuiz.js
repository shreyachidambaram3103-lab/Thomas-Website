export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const subjects = ['history', 'geography', 'anthropology', 'sociology', 'economics', 'political science'];
    const subjectIndex = Math.floor((Math.sin(seed) * 10000) % subjects.length);
    const subject = subjects[subjectIndex];

    const categoryMap = {
      history: 23,
      geography: 22,
      anthropology: 17, // Science & Nature (best proxy)
      sociology: 24,    // Politics (best proxy)
      economics: 24,    // Politics (best proxy)
      'political science': 24
    };

    const category = categoryMap[subject] || 23;

    const resp = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=hard&type=multiple`);

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
