var socket = io.connect("http://localhost:4000");
var divVideoChatLobby = document.getElementById("video-chat-lobby");
var divVideoChat = document.getElementById("video-chat-room");
var joinButton = document.getElementById("join");
var userVideo = document.getElementById("user-video");
var peerVideo = document.getElementById("peer-video");
var roomInput = document.getElementById("roomName")
var roomName;
var creator = false;
var rtcPeerConnection;
var userStream;


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
            audio: false, 
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
            audio: false, 
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
    console.log("CREATOR");
    if(creator) {
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer(function(offer){
            socket.emit("offer", offer,roomName);
        }, function(error){
            console.log(error);
        })
    }
});


socket.on("candidate", function() {});
socket.on("offer", function() {});
socket.on("answer", function() {});


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
