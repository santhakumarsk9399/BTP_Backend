const express = require('express');

const app = express();

const port = 3000;

 

   app.listen(port, () => {

     console.log(`API running at http://localhost:${port}`);

   });

   app.get('/', (req, res) => {

        res.send('Hello World!');

    });

    app.get('/welcome',(req, res) => {res.statusCode = 200; res.setHeader('Content-Type','text/plain-text');res.send("Welcome Yuvaraj");});

    app.get('/greet', (req, res) => {
        const name = req.query.name || 'Guest';
        res.send(`Hello ${name}!`);
    });

    app.use(express.json());

 

app.post('/submit', (req, res) => {

  const data = req.body;

  res.json({ received: data });

});