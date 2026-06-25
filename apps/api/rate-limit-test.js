async function runSpamTest() {
  console.log('Running Rate Limit Test...');
  
  const prompt = "Please search Exa for 'SpaceX', read 'test-approval.txt', list all files, and summarize.";
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Request ${i} ---`);
    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      
      const data = await res.json();
      
      if (res.status === 200) {
        console.log(`✅ Request ${i} completed successfully.`);
      } else {
        console.log(`❌ Request ${i} ERROR:`, res.status);
        console.log(JSON.stringify(data, null, 2));
        if (JSON.stringify(data).includes('rate_limit_exceeded')) {
          console.log('\n🚨 BOOM! Rate Limit Exceeded!');
          break;
        }
      }
    } catch (error) {
      console.log(`❌ FETCH FAILED: ${error.message}`);
    }
  }
}

runSpamTest();
