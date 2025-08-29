const { generateText, isAIReady } = require('./lib/ai-providers');

async function testAI() {
  console.log('Testing AI provider...');
  
  const ready = await isAIReady();
  console.log('AI Ready:', ready);
  
  if (!ready) {
    console.log('AI provider not ready');
    return;
  }
  
  console.log('Generating text...');
  const result = await generateText([
    {
      role: 'system',
      content: 'You are a network engineering sage who creates witty wisdom.'
    },
    {
      role: 'user',
      content: 'Create a humorous piece of wisdom about BGP routing in 2 sentences.'
    }
  ], {
    temperature: 0.8,
    maxTokens: 100,
  });
  
  console.log('Result:', result);
}

testAI();