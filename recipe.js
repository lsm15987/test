const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/dnjxj/Desktop/capstone/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://capstone-39ad0-default-rtdb.firebaseio.com/' // Firebase 프로젝트의 데이터베이스 URL로 변경
});

const db = admin.database();

const dataToSave = require('C:/Users/dnjxj/Desktop/capstone/recipe.json'); // JSON 파일의 경로로 변경
const ref = db.ref('Capstone/recipe'); // 데이터베이스 경로로 변경

ref.set(dataToSave, (error) => {
  if (error) {
    console.error('데이터 저장 중 오류 발생:', error);
  } else {
    console.log('데이터가 성공적으로 저장되었습니다.');
  }
});
