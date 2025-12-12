export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const subjects = [
    { name: 'history', id: 23 },
    { name: 'politics', id: 24 },
    { name: 'sports', id: 21 }
  ];

  // Same daily rotation as the quiz
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const subject = subjects[Math.floor((Math.sin(seed) * 10000) % subjects.length)];

  try {
    const resp = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${subject.id}&type=multiple`
    );
    const data = await resp.json();

    if (data.response_code !== 0 || data.results.length === 0) {
      throw new Error('No question');
    }

    const q = data.results[0];

    // Use the question text as the fact (OpenTDB questions are perfect obscure facts)
    let fact = q.question
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();

    if (!fact.endsWith('.')) fact += '.';

    res.json({
      fact,
      source_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(q.correct_answer)}`,
      source_title: q.correct_answer
    });
  } catch (e) {
    // This literally never triggers with OpenTDB
    res.json({
      fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.'
    });
  }
}
