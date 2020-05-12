'use strict';

//화상채팅 상태정보 초기화
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;

//로컬-원격 미디어 스트림 변수 선언
var localStream;
var pc;
var remoteStream;
var turnReady;

//STUN-TURN서버 설정정보
var pcConfig = {
    'iceServers': [
      {
        urls: 'stun:52.141.3.244:3478'
      },
      { 
        urls:"turn:52.141.3.244:3478",
        credential:"gbreedotcom",
        username:"bomdabang"
      },
      { 
        urls:"turn:52.141.3.244:3478?transport=udp",
        credential:"gbreedotcom",
        username:"bomdabang"
      },
      { 
        urls:"turn:52.141.3.244:3478?transport=tcp",
        credential:"gbreedotcom",
        username:"bomdabang"
      }
      ],
      iceTransportPolicy: 'all'
};

//사용자 디바이스 미디어 기본 설정
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

//화상채팅방이름,현재 접속자,채팅대상자 정보저장 객체
var room ="";
var currentUser;
var targetUser;
var iswaitCall = false;

//로컬-원격 비디오 변수
var localVideo = "";
var remoteVideo = "";


 //서비스 시그널링 웹소켓 서버주소
// var socket = io.connect('https://bomdabang-signal.azurewebsites.net');
var socket = io.connect('https://testrtc-f895a.firebaseio.com');
//로컬 테스트 시그널링 웹소켓 서버주소
//var socket = io.connect('http://localhost:3000');




//URL파라메터 조회함수
function getUrlParams() {
      var params = {};
      window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) { params[key] = value; });
      return params;
}


//페이지 로딩완료 
$(document).ready(function(){

  //접속 사용자 정보 세팅
  //프롬프트는 데모용으로만 사용되며 서비스할떄는 프롬프를 제거하고
  //현재 접속한 사용자 기본정보를 세팅해주세요.
  var userID = prompt('Enter userid:');
  var nickName= userID+'_nick';

  //URL쿼리스트링값 조회
  var queryParams = getUrlParams();

  //rid 쿼리스트링 키값 조회
  var rid = queryParams.rid;
  var tid = queryParams.tid;
  console.log('쿼리스트링으로 전달된 채팅방 고유번호-대상자아이디:',rid,"-",tid);

  //고유채팅방ID가 존재하면 바로 해당 채팅방으로입장처리
  if(rid != undefined){

    //채팅방정보 세팅
    room = rid;

     //현재 접속 사용자 정보 세팅 : 브라이언트에서 REST로 또는 서버프로그래밍으로 현재사용자 정보 세팅해줌.
    currentUser = {
      userID:userID,
      nickName:nickName,
      photoUrl:"/images/00_temp/sample03.jpg",
      targetRoom:room,
      targetID :tid,
      userLevel:"1",
      userType:"A",
      region:"서울/강남",
    };

    //tid 이용 채팅대상자 정보 처리 : 브라이언트에서 REST로 또는 서버프로그래밍으로 대상 사용자 정보 세팅해줌.
    //채팅대상자 정보 화면 세팅
    targetUser = {
      userID:tid,
      nickName:"대상자명",
      photoUrl:"/images/00_temp/sample03.jpg",
      targetRoom:room,
      targetID :currentUser.userID,
      userLevel:"1",
      userType:"A",
      region:"서울/강남",
    };

    $("#targetName2").text(targetUser.nickName);
    $("#region2").text(targetUser.region);

    //1:1전용 채팅방 입장처리
    entryChatRoom();
  }

  //고유채팅방ID가 존재하지 않으면 현재 접속자 랜덤채팅 대기실 입장요청
  if(rid == undefined){

     //현재 접속 사용자 정보 세팅 : 브라이언트에서 REST로 또는 서버프로그래밍으로 현재사용자 정보 세팅해줌.
     currentUser = {
      userID:userID,
      nickName:nickName,
      photoUrl:"/images/00_temp/sample03.jpg",
      userLevel:"1",
      userType:"A",
      region:"서울/강남",
    };


    socket.emit('waiting',currentUser);
    console.log('채팅 대기실 입장 진행중입니다.', currentUser.userID);
  }

});



//랜덤채팅방 대기실 입장완료 수신메시지
socket.on('waitJoined', function(entryUser,clientCnt) {
  
  //서버 접속사용자 정보로 현재 접속자 정보 갱신
  currentUser = entryUser;

  //현재 접속자 정보 로깅
  console.log("현재 접속자 정보:",currentUser);
  console.log('현재 접속자 소켓ID:' + entryUser.socketID +'-대기자수:'+clientCnt);

  //접속 카운트 정보 화면 출력
  if(clientCnt == 1){
    console.log('채팅대상자가 존재하지 않습니다.');
    $("#userCnt").html("채팅대상자가 존재하지 않습니다");
  }else if(clientCnt > 1){
    $("#userCnt").html(clientCnt+" 친구와의 대화 시<br>꼭 예의를 지켜주세요");
  }else{
    console.log('화상채팅 불가');
  }
});

//랜덤채팅 자동 매칭 추천 사용자 정보 수신
socket.on('recommanded', function(recommandUser) {

  //추천대상자 정보 로깅
  console.log('추천 매칭 사용자정보 :',recommandUser);


  //채팅대상자 정보 갱신 및 1:1채팅방 정보 갱신
  targetUser = recommandUser;
  room = targetUser.targetRoom;

  //서버에서 제공해준 화상채팅방명 로깅
  console.log('1:1 화상채팅방명 :',room);

  //현재 접속 사용자 매칭정보 갱신
  currentUser.targetRoom = room;
  currentUser.targetID = targetUser.userID;
  currentUser.matchingDT = targetUser.matchingDT;

  //UI 변경처리(대상찾기에서 추천화면으로 변경)
  $("#chat_search").css("display","none");
  $("#chat_recommand").css("display","block");

  //채팅대상자 정보 화면 세팅
  $("#targetName1").text(targetUser.nickName);
  $("#region1").text(targetUser.region);
  var photoUrl = 'url('+targetUser.photoUrl+')';

  //debugger;
  $("#targetImg").css({'background':photoUrl, 'background-repeat' : 'no-repeat', 'background-position':'center center'});

  //console.log("현재사용자정보: ",currentUser);

  iswaitCall = true;

  //30초 통화대기 후 자동 종료 이벤트 발생
  setTimeout(() => {
    if(iswaitCall == true){
      socket.emit('waitlong',currentUser);
      console.log('30초 수신대기 후 통화시도 자동 종료처리합니다.');

      //추천자동종료
      location.href="/index.html";
    }
  }, 30000);


});

//랜덤 1:1 화상채팅 입장하기
$("#chat_start").click(function(){
  iswaitCall = false;
  console.log("화상 채팅방 입장");

  //화면 전환(추천화면 --> 화상채팅화면)
  $("#chat_recommand").css("display","none");
  $("#chat_video").css("display","block");

  $("#targetName2").text(targetUser.nickName);
  $("#region2").text(targetUser.region);

  //1:1 전용 화상 채팅방 입장처리
  entryChatRoom();
});

//1:1 전용 화상 채팅방 입장처리
function entryChatRoom(){

  //사용자 디바이스 비디오 객체 정보 초기화
  localVideo = document.querySelector('#localVideo');
  remoteVideo = document.querySelector('#remoteVideo');

  //현재 접속자 미디어 활성화 요청처리
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('사용자 디바이스 미디어 사용 요청 실패 : ' + e.name);
  });

  //1:1 화상채팅방 생성 요청 및 입장
  socket.emit('create or join', room);

  console.log('화상 채팅방 입장', room);
}

//랜덤채팅 추천 대상자 대신 다른사용자 연결요청하기
$("#chat_other").click(function(){
 
  iswaitCall = false;

  //다른 사용자 연결요청
  socket.emit('chatother',currentUser);
  
  //대기실 재 입장 처리(소켓자동종료처리됨)
  location.href="/index.html";
});

//랜덤채팅 추천대상자가 통화 거절한경우(다른사용자 연결요청시 발생)
socket.on('calldenied', function() {
  console.log('추천 대상자가 다른 사용자 연결을 요청하셨습니다.');
  //alert('추천 대상자가 다른 사용자 연결을 요청하셨습니다.');
  location.href="/index.html";
});

//추천대상자가 통화 수신대기 시간이 길어 자동 종료된경우
socket.on('longtimedenied', function() {
  console.log('추천 대상자가 30초 이상 전화를 받지 않아 통화시도가 종료되었습니다.');
  //alert('추천 대상자가 전화를 받지 않습니다.');
  location.href="/index.html";
});


//현재 사용자 통화 종료 이벤트 처리
$("#hangup").click(function(){
  
  //화상채팅 종료처리
  hangup();

  //서비스 이동 페이지 설정
  location.href="/index.html";
});

//랜덤채팅 사용자 소켓연결 종료 이벤트 수신
socket.on('connectionOut', function(socketID,clientCnt) {
  console.log('연결종료 소켓ID:' + socketID +'-대기실 대기자수:'+clientCnt);
});

//1:1화상 채팅방 생성 완료 수신처리
socket.on('created', function(room) {
  console.log('1:1 화상채팅방 생성완료: ' + room);
  isInitiator = true;
});

//1:1 화상채팅방 인원초과 메시지 수신
socket.on('full', function(room) {
  console.log('1:1 화상채팅방 인원초과 알림: ' + room );
});

//1:1 화상채팅방 현재 사용자 입장완료 메시지 수신
socket.on('join', function (room){
  console.log('1:1 채팅방 현재 접속자 입장완료:' + room);
  isChannelReady = true;
});

//1:1 화상채팅방 대상자 입장완료 메시지 수신
socket.on('joined', function(room) {
  console.log('1:1 채팅방 추천 대상자 입장 완료: ' + room);
  isChannelReady = true;
});

//서버 로거 메시지 수신 클라이언트  처리기
socket.on('log', function(array) {
  console.log.apply(console, array);
});


//1:1 화상채팅 서버 메시시 보내기
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

//1:1 화상채팅 클라이언트 메시시 수신기
socket.on('message', function(message) {
  
  console.log('Client received message:', message);

  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {

    pc.setRemoteDescription(new RTCSessionDescription(message));

  } else if (message.type === 'candidate' && isStarted) {

    //console.log("상세 아이스후보:",message.candidate);

    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });

    pc.addIceCandidate(candidate);

  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

//현재 사용자 로컬 비디오 스트림 처리
function gotStream(stream) {
  console.log('Adding local stream.');

  localStream = stream;
  localVideo.srcObject = stream;

  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

//STUN/TURN서버 비디오-오디오 제약 설정
var constraints = {
  video: true,
  audio: true,
};

//1:1화상통신 가능상태 체크함수
function maybeStart() {

  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);

  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

//사용자가 브라우저를 닫으면 1:1 화상채팅 종료 메시지 발송
window.onbeforeunload = function() {
  
  //서버로 화상채팅 종료 메시지 발송
  sendMessage('bye');

};


//1:1 화상채팅 피어연결 생성처리 함수
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}


//IceCandidate처리
function handleIceCandidate(event) {
  //console.log('아이스후보이벤트발생:icecandidate event: ', event);
  if (event.candidate) {

    //서버로 메시지 발송하기
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });

  } else {
    console.log('End of candidates.');
  }
}

//오퍼 발생에러 처리 핸들러
function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

//RTC 통신요청
function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

//RTC 통신응답 처리함수
function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

//연결세션정보 로깅 및 메시지 처리
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

//세션연결 에러처리 핸들러
function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

//상대 화상채팅 미디어 스트림 연결완료: 실제화상채팅시작
function handleRemoteStreamAdded(event) {
   console.log('상대 화상채팅 미디어 스트림 연결 완료');

  $("#localVideo").css("display","none");
  $("#remoteVideo").css("display","block");

  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

//현재 사용자 통화종료처리 함수
function hangup() {
  console.log('현재 사용자가 통화를 종료합니다.');
  stop();

  //대상에게 통화종료 알림 발송
  sendMessage('bye');
}

//원격채팅 대상자 통화종료처리
function handleRemoteHangup() {
  console.log('원격대상자가 통화를 종료했습니다.');
  stop();
  isInitiator = false;
  location.href="/index.html";
}

//화상통신 종료 함수
function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}