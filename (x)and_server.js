const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // cors 미들웨어를 가져옵니다.

const app = express();
const port = 80;

// Firebase Admin SDK 초기화
const serviceAccount = require('C:/Users/dnjxj/Desktop/capstone/key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://capstone-39ad0-default-rtdb.firebaseio.com/',
});

// 모든 경로에 대한 CORS를 활성화하려면 cors 미들웨어를 사용합니다.
app.use(cors());

// API 엔드포인트: 데이터 가져오기
app.get('/api/data', (req, res) => {
  const db = admin.database();
  const ref = db.ref('/Capstone/weather/response/body/items/item');

  ref.once('value')
    .then(snapshot => {
      const data = snapshot.val();
      res.json(data);
    })
    .catch(error => {
      console.error('데이터 가져오기 오류:', error);
      res.status(500).json({ error: '데이터 가져오기 실패' });
    });
});

app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});