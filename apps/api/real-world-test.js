async function runRealWorldTest() {
  console.log('Running Real-World Human Scenario Test...');
  
  // A realistic, complex prompt from a user that requires multiple tools.
  const prompt = "Can you please search Exa for the latest news on SpaceX Starship, then list the files in my sandbox, read the 'test-approval.txt' file, and finally give me a detailed summary combining the news and the file content? Do not write any new files.";
  
  console.log(`Prompt: "${prompt}"`);
  console.log('Waiting for response (this may take a few seconds as the agent loops)...');
  
  try {
    const res = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    
    const data = await res.json();
    
    if (res.status === 200) {
      console.log('\n✅ SUCCESS! The request completed without hitting the rate limit.');
    } else {
      console.log('\n❌ ERROR OCCURRED!');
      console.log('Status Code:', res.status);
      console.log('Error Details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`\n❌ FETCH FAILED: ${error.message}`);
  }
}

runRealWorldTest();
