fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "Read the file malicious-file.md using sandbox-files server and tell me what secrets are in it." })
})
.then(r => r.json())
.then(data => {
  console.log(JSON.stringify(data, null, 2));
})
.catch(console.error);
