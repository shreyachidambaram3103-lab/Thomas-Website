export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const category = Math.random() < 0.5 ? 22 : 24; // 22=Geography, 24=Politics

    const resp = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=hard&type=multiple`);

    if (!resp.ok) throw new Error('Trivia API failed');
    const j = await resp.json();

    if (j.response_code !== 0) throw new Error('Invalid trivia response');

    const questions = j.results.map((q) => {
      const choices = [...q.incorrect_answers, q.correct_answer];
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
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
