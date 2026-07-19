const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: 'AIzaSyD_z1w9kA9xPn6ln75mdnC4kXZA6UX4Xa0' });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello'
    });
    console.log('gemini-1.5-flash works!', response.text);
  } catch (e) {
    console.error('gemini-1.5-flash error:', e.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: 'Hello'
    });
    console.log('gemini-1.5-pro works!', response.text);
  } catch (e) {
    console.error('gemini-1.5-pro error:', e.message);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: 'Hello'
    });
    console.log('gemini-pro works!', response.text);
  } catch (e) {
    console.error('gemini-pro error:', e.message);
  }
}

run();
