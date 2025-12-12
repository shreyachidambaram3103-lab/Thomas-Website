// api/generateQuiz.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    // Pick a random category from OpenTDB (nice mix of topics)
    const categories = [
      9,  // General Knowledge
      17, // Science & Nature
      18, // Computers
      21, // Sports
      22, // Geography
      23, // History
      24, // Politics
      27  // Animals
    ];

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const response = await fetch(
      `https://opentdb.com/api.php?amount=10&category=${randomCategory}&difficulty=hard&type=multiple`
    );

    const data = await response.json();

    if (data.response_code !== 0 || !data.results.length) {
      throw new Error('No questions returned');
    }

    const questions = data.results.map((q) => {
      const choices = [...q.incorrect_answers, q.correct_answer];
      // Shuffle
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      const answer_index = choices.indexOf(q.correct_answer);

      return {
        prompt: q.question,
        choices,
        answer_index
      };
    });

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Quiz generation failed:', error);
    // Fallback quiz (very rare)
    const fallback = {
      questions: [
        {
          prompt: "What is the capital of France?",
          choices: ["London", "Berlin", "Paris", "Madrid"],
          answer_index: 2
        }
      ]
    };
    res.status(200).json(fallback);
  }
}
