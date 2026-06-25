fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "Hello" })
})
.then(async r => {
  console.log('Status:', r.status);
  const text = await r.text();
  console.log('Body:', text);
})
.catch(console.error);
