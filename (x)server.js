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

let latitude = 36;
let longitude = 90;

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000; // 원하는 포트 번호

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


function findClosestBaseTime(currentTime, baseTimes) {
  // 현재 시간과 Base_time 배열을 비교하여 해당 시간을 반환
  for (let i = 0; i < baseTimes.length; i++) {
    if (currentTime == baseTimes[i]) { //같으면 해당 시간반환
      return baseTimes[i];
    }
    else if(currentTime < baseTimes[i]){ //크면 바로 이전 시간을 반환
      return baseTimes[i-1]
    }
  }
  // 만약 현재 시간이 Base_time 배열의 모든 값보다 크다면, 가장 나중의 시간을 반환
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
  const currentTimeStr = `${hours}00`;

  // Base_time 배열 정의
  const Base_time = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
  const closestBaseTime = findClosestBaseTime(currentTimeStr, Base_time); //현 시간 기준 가장 최근에 예보를 발표한 시간

  Day['date']=currentDateStr;
  Day['time']=closestBaseTime;

  return Day;
}

// 함수를 만들어 API 데이터를 가져오고 Firebase에 저장
function fetchDataAndStore() {
  // Firebase 데이터베이스 레퍼런스 가져오기
  const db = admin.database();
  const ref = db.ref('Capstone/weather'); // 원하는 데이터 경로

  var day=getDate();

  var location = dfs_xy_conv("toXY", latitude, longitude); //위도, 경도-> 격자 정보 변환 36.964988, 127.872782
  const apiUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  const queryParams = {
    serviceKey: 'yZtom1Gqdi3bfZCgI7W76zxxQ7ZfEXhH7qo8DAv4Pto53LyV4rH/fOltJyTAm40pUzk4uJ79xK9oLTjQTDYMpA==',
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: day['date'],
    base_time: day['time'],
    nx: location['x'],
    ny: location['x']
  };

  axios.get(apiUrl, { params: queryParams })
    .then((response) => {
      const weatherData = response.data;
      ref.set(weatherData);
      console.log('기상 데이터가 Firebase에 저장되었습니다.');
      console.log(latitude,longitude);
    })
    .catch((error) => {
      console.error('기상 데이터 가져오기 오류:', error);
    });
}

const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/dnjxj/Desktop/capstone/key.json'); // Firebase 서비스 계정 키 파일 경로

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://capstone-39ad0-default-rtdb.firebaseio.com/' // Firebase Realtime Database URL
});
// 일정한 간격으로 데이터 가져오기
const fetchInterval = 3 * 60 * 60 * 1000; // 3 시간마다 데이터 가져오기 (밀리초 단위)
setInterval(fetchDataAndStore, fetchInterval);
fetchDataAndStore(); // 초기 실행



app.post('/getWeatherData', (req, res) => {
  latitude = req.body.latitude; // 클라이언트에서 보낸 위도 값
  longitude = req.body.longitude; // 클라이언트에서 보낸 경도 값

  // fetchDataAndStore 함수 내에서 위도 및 경도를 사용하여 기상 데이터를 가져와 Firebase에 저장
  fetchDataAndStore();

  // 클라이언트에 응답을 보내거나 필요한 작업을 수행
  res.send('요청이 처리되었습니다.');
});

app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});


