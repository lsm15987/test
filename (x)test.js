const http = require('http');
const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/dnjxj/Desktop/capstone/key.json'); // 서비스 계정 키 경로

const hostname = '0.0.0.0';
const port = 500;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://capstone-39ad0-default-rtdb.firebaseio.com/' // 파이어베이스 데이터베이스의 URL
});

const server = http.createServer((req, res) => {
  const db = admin.database();
  const ref = db.ref('/Capstone/weather/response/body/items/item'); // 파이어베이스 데이터베이스 내의 경로

  ref.once('value', (snapshot) => {
    const data = snapshot.val();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
