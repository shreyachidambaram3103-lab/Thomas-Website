export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
    const data = await response.json();

    let fact = data.text.trim();
    if (!fact.endsWith('.')) fact += '.';

    return res.json({
      fact,
      source_url: 'https://uselessfacts.jsph.pl/',
      source_title: 'Useless Facts'
    });
  } catch (err) {
    return res.json({
      fact: 'The shortest war in history was between Britain and Zanzibar on August 27, 1896, lasting only 38 minutes.'
    });
  }
}
