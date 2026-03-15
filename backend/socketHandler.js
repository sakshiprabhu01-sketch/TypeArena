const rooms = {};

function generateText(wordCount = 100){

const wordList = [
"time","people","world","life","day",
"practice","typing","speed","focus","skill",
"give","fun","which","what","know",
"learn","improve","keyboard","accuracy","game",
"the","her","because"
];

let result=[];

for(let i=0;i<wordCount;i++){
const randomIndex=Math.floor(Math.random()*wordList.length);
result.push(wordList[randomIndex]);
}

return result.join(" ");
}

module.exports=(socket,io)=>{

socket.on("create-room",()=>{

const roomId=Math.random().toString(36).substring(2,8).toUpperCase();

rooms[roomId]={
hostReady:false,
guestReady:false,
gameStarted:false,
text:null
};

socket.join(roomId);

socket.emit("room-created",roomId);

});

socket.on("join-room",(roomId)=>{

if(!rooms[roomId]) return;

socket.join(roomId);

io.to(roomId).emit("room-update",rooms[roomId]);

});

socket.on("ready",(roomId,role)=>{

if(role==="host") rooms[roomId].hostReady=true;
if(role==="guest") rooms[roomId].guestReady=true;

io.to(roomId).emit("room-update",rooms[roomId]);

});

socket.on("start",(roomId)=>{

if(!rooms[roomId]) return;

const text=generateText(100);

rooms[roomId].text=text;
rooms[roomId].gameStarted=true;

io.to(roomId).emit("room-update",rooms[roomId]);

});

};