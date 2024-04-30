let socket = io.connect("https://172.16.2.192:4000");
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName")
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;


let iceServers = {
    iceServers: [
        {urls: "stun:stun.services.mozilla.com"},
        {urls: "stun:stun1.l.google.com:19302"}
    ],
}

joinButton.addEventListener("click", function() {
    if(roomInput.value=="") {
        alert("Please enter a room name");
    } else{
        roomName = roomInput.value;
        socket.emit("join", roomName)
    }
});



socket.on("created", function() {
    creator = true;
    
    navigator.mediaDevices
        .getUserMedia({
            audio: true, 
            video: { width: 1280, height: 720},
        }) 
        .then(function(stream) {

            userStream = stream;
            divVideoChatLobby.style = "display:none";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            };
        })
        .catch(function(err) {

            alert("Could not load video");
        });   
});



socket.on("joined", function() {
    creator = false;

    navigator.mediaDevices
        .getUserMedia({
            audio: true, 
            video: { width: 1280, height: 720},
        }) 
        .then(function(stream) {

            userStream = stream;
            divVideoChatLobby.style = "display:none";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            }
            socket.emit("ready", roomName)
        })
        .catch(function(err) {
           
            alert("Could not load video");
        });   
});



socket.on("full", function() {
    alert("Room is full. Can`t join!");
});

socket.on("ready", function() {
    if(creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection
            .createOffer()
            .then((offer) => {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer,roomName);
            }) 
            .catch((error) => {
                console.log(error);
            });
    }
});


socket.on("candidate", function(candidate) {
    let iceCandidate = new RTCIceCandidate(candidate)
    rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", function(offer) {
    if(!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection
            .createAnswer()
            .then((answer) => {
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit("answer", answer,roomName);
            }) 
            .catch((error) => {
                console.log(error);
            });
    }
});

socket.on("answer", function(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
});


function OnIceCandidateFunction(event) {
    if(event.candidate) {
        socket.emit("candidate", event.candidate, roomName)
    }
}

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    }
}
