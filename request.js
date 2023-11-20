const fetch = require('node-fetch'); // Node.js 환경에서 사용할 경우 필요

const serverUrl = 'http://weatherdata.gonetis.com:3000/getWeatherData'; // 클라이언트에서 서버로 요청을 보낼 URL
const requestData = {
  latitude: 36.964988, // 위도
  longitude: 127.872782, // 경도
};

fetch(serverUrl, {
  method: 'POST',
  body: JSON.stringify(requestData),
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.text())
  .then((data) => {
    console.log(data); // 서버에서 받은 응답 출력
  })
  .catch((error) => {
    console.error('요청 오류:', error);
  });
