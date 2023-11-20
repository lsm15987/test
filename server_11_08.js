var RE = 6371.00877; // 지구 반경(km)
var GRID = 5.0; // 격자 간격(km)
var SLAT1 = 30.0; // 투영 위도1(degree)
var SLAT2 = 60.0; // 투영 위도2(degree)
var OLON = 126.0; // 기준점 경도(degree)
var OLAT = 38.0; // 기준점 위도(degree)
var XO = 43; // 기준점 X좌표(GRID)
var YO = 136; // 기1준점 Y좌표(GRID)
//
// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
//

// 좌표 변환 함수
function dfs_xy_conv(code, v1, v2) {
    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
    var rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    else {
        rs['x'] = v1;
        rs['y'] = v2;
        var xn = v1 - XO;
        var yn = ro - v2 + YO;
        ra = Math.sqrt(xn * xn + yn * yn);
        if (sn < 0.0) - ra;
        var alat = Math.pow((re * sf / ra), (1.0 / sn));
        alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        }
        else {
            if (Math.abs(yn) <= 0.0) {
                theta = Math.PI * 0.5;
                if (xn < 0.0) - theta;
            }
            else theta = Math.atan2(xn, yn);
        }
        var alon = theta / sn + olon;
        rs['lat'] = alat * RADDEG;
        rs['lng'] = alon * RADDEG;
    }
    return rs;
}

const http = require('http');
const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/dnjxj/Desktop/capstone/key.json'); // Firebase 서비스 계정 키 경로


const hostname = '0.0.0.0';
const port = 300;

function findClosestBaseTime(currentTimeStr, baseTimes) {
  for (let i = 0; i < baseTimes.length; i++) {
    if (currentTimeStr == baseTimes[i]) {
      return baseTimes[i];
    }
    else if(currentTimeStr < baseTimes[i]){
      if(i === 0) {
        return '2300';
      } else {
        return baseTimes[i-1];
      }
    }
  }
  return baseTimes[0];
}


function getDate(){
    const currentDate = new Date();
    var Day={};
    // 현재 날짜를 문자열로 저장 ex)20231026
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 1을 더하고 두 자리로 맞춤
    const day = currentDate.getDate().toString().padStart(2, '0'); // 일도 두 자리로 맞춤
  
    const currentDateStr = `${year}${month}${day}`;
    
  
    // 현재 시간을 문자열로 저장 (시00) ex)1800
    const hours = currentDate.getHours().toString().padStart(2, '0'); // 시도 두 자리로 맞춤
    const currentTimeStr=`${hours}00`;

  
    // Base_time 배열 정의
    const Base_time = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    const closestBaseTime = findClosestBaseTime(currentTimeStr, Base_time); //현 시간 기준 가장 최근에 예보를 발표한 시간


    
    if(currentTimeStr=='0000'||currentTimeStr=='0001'){
      Day['date']=currentDateStr-1;
    }
    else{
      Day['date']=currentDateStr;
    }
    Day['time']=closestBaseTime;
    console.log(Day['date']);
    console.log(Day['time']);
    return Day;
  }

  

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://capstone-39ad0-default-rtdb.firebaseio.com/' // Firebase Realtime Database URL
});

let latitude = 36; // 기본 위도
let longitude = 90; // 기본 경도

// 데이터 가져오고 Firebase에 저장하는 함수
function fetchDataAndStore() {
  // Firebase 데이터베이스 레퍼런스 가져오기
  const db = admin.database();
  const ref = db.ref('Capstone/weather'); // 원하는 데이터 경로

  const day = getDate();
  const location = dfs_xy_conv("toXY", latitude, longitude);

  const apiUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  const queryParams = {
    serviceKey: 'yZtom1Gqdi3bfZCgI7W76zxxQ7ZfEXhH7qo8DAv4Pto53LyV4rH/fOltJyTAm40pUzk4uJ79xK9oLTjQTDYMpA==', // 자신의 서비스 키로 변경
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: day['date'],
    base_time: day['time'],
    nx: location['x'],
    ny: location['y']
  };

  axios.get(apiUrl, { params: queryParams })
    .then((response) => {
      const weatherData = response.data;
      ref.set(weatherData);
      console.log('기상 데이터가 Firebase에 저장되었습니다.');
      console.log(latitude, longitude);
    })
    .catch((error) => {
      console.error('기상 데이터 가져오기 오류:', error);
    });
}

// 기상 정보 업데이트 주기
const updateInterval = 3 * 60 * 60 * 1000; // 3 시간마다 데이터 업데이트 (밀리초 단위)
setInterval(fetchDataAndStore, updateInterval);
fetchDataAndStore(); // 초기 실행

// HTTP 서버 생성
const server = http.createServer((req, res) => {
    // 현재 시간을 KST (대한민국 표준시, UTC+9)로 변환
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 9);
    const currentTimeKST = currentDate.toISOString().replace('Z', '+09:00');

    // 로그 출력
    console.log(`[${currentTimeKST}] 접속한 클라이언트 정보: ${req.connection.remoteAddress}:${req.connection.remotePort}`);
    if (req.url === '/getWeatherData' && req.method === 'POST') {
      // 클라이언트의 POST 요청 처리 코드
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
  
      req.on('end', () => {
        const requestBody = JSON.parse(body);
        latitude = requestBody.latitude;
        longitude = requestBody.longitude;
        fetchDataAndStore(); // 데이터 업데이트
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('요청이 처리되었습니다.');
      });
    } else if (req.url === '/data/weather' && req.method === 'GET') {
      // 새로운 엔드포인트 "/data/weather" 추가
      const db = admin.database();
      const ref = db.ref('/Capstone/weather/response/body/items/item'); // 파이어베이스 데이터베이스 내의 경로
  
      ref.once('value', (snapshot) => {
        const data = snapshot.val();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      });
    } else if(req.url === '/data/recipe' && req.method === 'GET') {
        // 새로운 엔드포인트 "/data/recipe" 추가
        const db = admin.database();
        const ref = db.ref('/Capstone/recipe'); // 파이어베이스 데이터베이스 내의 경로

        ref.once('value', (snapshot) => {
          const data = snapshot.val();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        });
    }else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('cibal');
    }
  });
  
  server.listen(port, hostname, () => {
    
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
  });
  
