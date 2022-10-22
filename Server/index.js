const express = require('express');
const app = express();
const port = '8180';

const cors = require('cors');
var device = require('express-device');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('public'));
app.use(device.capture());

process.on('uncaughtException', function (err) {
  console.log('\n\n\n\n')
  console.error(err); 
  console.log('\n\n\n\n')
});


const io = require('socket.io')(8080,{
  cors:{
    origin:['http://localhost:3000','https://admin.socket.io'],
  },
})

server = app.listen(port,()=>console.log(`${port} on fire maaan`));

require('dotenv').config();
const {Xss} = require('./useful/xss-check.js');
const {generateToken} = require('./useful/cryptology.js');

const {Storages} = require('./Storage/Storages.js')
const storage =  Storages.MySql

const {Games} = require('./Games/games'); 


const games = []


storage.getDataAfterShutDown().then(data=>{
  Object.keys(data).forEach(obj=>{
    const gameObj = data[obj]
    
    const game = Games[gameObj.game][gameObj.mode] 
    game.playerLimit = gameObj.player_limit;
    game.private = gameObj.private;
    game.duration = gameObj.duration;
    game.roomId = gameObj.room_id;
    game.onPlay = gameObj.on_play;
    game.mode = gameObj.mode;

    game.owner = gameObj.owner;
    
    gameObj.players.forEach(playerObj=>{
      game.addPlayer(playerObj.socket_id,playerObj.username)
    })
    games.push(game)
  })
})


//ON SOCKET DISCONNECT
io.use((socket, next) => {
  setTimeout(() => {
    next();
  }, 1000);
  
  socket.on("disconnect", () => {
    
    storage.onDisconnect(socket.id)

    games.forEach(game=>{
      game.players = game.players.filter(player => player.id !== socket.id)
    })
  })

});


//USER AUTHENTICATION
app.post('/register',async(req,res)=>{
 
  try {
    console.log('here')
    const username = req.body.username
    const password = req.body.password

    if(!username || !password)throw new Error('missing information')
    const hashedPassword = await generateToken(password)

    storage.userRegister(username,password,hashedPassword).then(resolve=>res.status(200).send(resolve)).catch(reject=>res.status(500).send(reject))

  } catch (error) {
    console.log(error)
    res.status(500).send({data:error})
  }
})

//CREATİNG ROOM
app.post('/create',(req,res)=>{
 
  try {
    const gameMode = GameMode[req.body.gameMode] 
    if(!gameMode) throw new Error("Game mode couldn't fund")

    storage.createRoom(
      req.body.username,
      req.body.password,
      gameMode,
      req.body.privacy,
      req.body.playerLimit,
      req.body.duration,
      '192.168.1.101'     //TODO* req.ip
    ).then(data=>res.status(200).send(data)).catch(data=>res.status(500).send(data))

    const game = Games[req.body.gameMode](1)
    //Player,TILE_HEIGHT,TILE_WIDTH,CANVAS_HEIGHT,CANVAS_WIDTH,owner,roomId,onPlay,playerLimit,private,duration,startAt
    game.roomId = roomId;
    game.owner = req.body.username
    game.playerLimit = req.body.playerLimit
    game.private = req.body.privacy
    game.duration = req.body.duration
    
    games.push(game);

  } catch (error) {
    console.log(error)
  }
})

//JOINING ROOM
app.post('/join',(req,res)=>{
 
  try {
    
  } catch (error) {
    console.log(error)

    storage.joinRoom(req.body.username,req.body.password,req.body.roomId,req.device.type,'192.168.1.101')
    .then((data)=>{
      res.status(200).send(data)
      const game = games.filter(_game=>_game.roomId == req.body.roomId)[0]
      game.addPlayer(req.body.roomId)
    })
    .catch(data=>res.status(500).send(data))
  }
})

//JOINING RANDOM PUPLIC ROOM
app.post('/joinPublic',(req,res)=>{
    //TODO*
})

app.get('/lobi/getPlayers/:room_id',(req,res)=>{
  
  storage.getPlayerList(req.params.room_id).then(data=>res.send(data))
})

app.get('/checkState',(req,res)=>{
  
  storage.checkUserState(req.query.username,req.query.password).then(data=>res.status(200).send(data)).catch(err=>res.status(500).send(err))
})

//GAME UPDATE LOOP
const interval = setInterval(()=>{
  games.forEach(game => {
    if(game.onPlay) game.update();
    if(game.startAt >= game.startAt - game.duration) {
      io.to(game.roomId).emit('game-end')
      game.startAt = 0;
    }
    });
},1000/5) 


//GAME STATE UPDATES
const updateInterval = setInterval(()=>{
  games.forEach(game => {
    //PLAYER COORDINATES
    io.to(game.roomId).emit('PLAYERS_UPDATE',game.players.map(player=>({
      coordinates : player.coordinates,
    })))
    //FOOD COORDINATES
    game.players.forEach(player => {
      io.to(player.id).emit('APPLE_UPDATE',player.appleCoordinates)
    });
  })
},1000/30); 
 

io.on('connection',socket=>{
  
  
  socket.once('updateSocketID',()=>{
    
    storage.updateSocketId(socket.handshake.query.username,socket.handshake.query.password,socket.id).then(id=>socket.join(id))
  })

  //LOBI MESSAGE LISTENER
  socket.on('lobi-message',async(data)=>{
    try{
      if(!data.content) throw new Error()
      userAuth(socket.handshake.query.username,socket.handshake.query.password).then(()=>{
        con.query(`select room_id from first_online_game.player where socket_id = '${socket.id}' and user_name = '${Xss(socket.handshake.query.username)}'`,(error,result)=>{
          if(error) throw error
          if(result[0]){
            console.log(Xss(data.content),'=> from :',socket.handshake.query.username)
            io.to(result[0].room_id).emit('lobi-broad-message',{username:socket.handshake.query.username,message:Xss(data.content)}) 
          }
        })
      }).catch(dataa=>{
        throw new Error(dataa)
      }) 

    }catch(error){
      console.log(error)
    }
  })

  socket.on('lobi-start_game',()=>{
    
    storage.startGame(socket.handshake.query.username,socket.handshake.query.password).then(id=>{
      io.to(id).emit('lobi-start')
      games.filter(_game=>_game.roomId === id)[0].onPlay = true
    })
  })

  //PLAYER CONTROLS
  socket.on('CONTROL',(keyCode)=>{
    try {
      
      storage.userAuth(socket.handshake.query.username,socket.handshake.query.password).catch(dataa=>{throw dataa})
      const game = games.filter(_game=>{
        const player = _game.players.filter(_player=>_player.name === socket.handshake.query.username)[0]
        if(player) return true
      })[0]

      game.controls(socket.handshake.query.username,keyCode)
      
    } catch (error) {
      console.log(error)
    }
  
  });

});

const GameMode = {
  'Clasic' : 0,
}
