const axios = require('axios');

const latitude = 36.964988; // 클라이언트에서 제공한 위도 값
const longitude = 127.872782; // 클라이언트에서 제공한 경도 값

axios.post('http://http://weatherdata.gonetis.com:3000', { latitude, longitude })
  .then((response) => {
    console.log('서버 응답:', response.data);
  })
  .catch((error) => {
    console.error('서버 요청 오류:', error);
  });
