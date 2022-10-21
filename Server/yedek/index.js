
const express = require('express');
const app = express();
const port = '8180';

const cors = require('cors');
var device = require('express-device');
/*
app.use(cors({
  origin:'http://127.0.0.1:3000', // '*' her origin den requesti kabul eder
  // methods:['GET','POST'],
  // credentials:true,
}));
*/
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
// require('dotenv').config();
// const mysql = require('mysql');
const {Xss} = require('./xss-check.js');
const {Game} = require('./Game.js'); 
const {verifyPasswordWithHash,generateToken} = require('./cryptology.js');

server = app.listen(port,()=>console.log(`${port} on fire maaan`));



//MYSQL CONNECTION
/**
var con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true
  });

  con.connect(function(err) {
    if (err) {
        console.log(err)
        throw err;
    }
});
 */

const {Storages} = require('./Storage/Storage.js') 
const storage = Storages.MySql

const games = []

storage.getDataAfterShutDown().then(data=>{
  data.forEach(gameObj=>{
    const game = new Game()
    game.playerLimit = gameObj.player_limit;
    game.private = gameObj.private;
    game.duration = gameObj.duration;
    game.roomId = gameObj.room_id;
    game.onPlay = gameObj.onPlay;
    game.mode = gameObj.mode;
    game.owner = gameObj.owner;
    gameObj.players.forEach(playerObj=>{
      game.addPlayer(playerObj.socket_id,playerObj.username)
    })
    games.push(game)
  })
})
/**
const getDataAfterShutDown = () => {
  try {
    con.query(`select * from game`,async(errGame,resGame)=>{
      resGame[0].forEach(gameObj => {
        const game = new Game()
        game.playerLimit = gameObj.player_limit
        game.private = gameObj.private
        game.duration = gameObj.duration
        game.roomId = gameObj.room_id
        game.onPlay = gameObj.onPlay
        game.mode = gameObj.mode
        con.query(`select socket_id , user_name from player where room_id = ${gameObj.room_id}`,(errPlayer,resPlayer)=>{
          resPlayer[0].forEach(playerObj => {
            game.addPlayer(playerObj.socket_id,playerObj.user_name)
            
            con.query(`select user_name from executives where room = ${gameObj.room_id}`,(errExecutives,resultExecutives)=>{
              game.owner = resultExecutives[0].user_name

              games.push(game)
            })
          });
        })
      });
    })
  } catch (error) {
    console.log(error)
  }
}

getDataAfterShutDown()
 */

//ON SOCKET DISCONNECT
io.use((socket, next) => {
  setTimeout(() => {
    next();
  }, 1000);
  
  socket.on("disconnect", () => {
    // console.log(`${socket.id} has been disconnected`)

    /**
    try {
      con.query(`delete from player where room_id = ${socket.id};`,(err,result)=>{
      })

        con.query(`delete from game where room_id = if(
        (select count(*) from first_online_game.player where room_id = (select room_id from player where socket_id = '${socket.id}' limit 1)) = 0,(select room_id from player where socket_id = '${socket.id}' limit 1),null)`,(err,result)=>{
          if(err)throw err
        })

    } catch (error) {
      console.log(error)
    }
    */

    storage.onDisconnect(socket.id)

    games.forEach(game=>{
      game.players = game.players.filter(player => player.id !== socket.id)
    })
  })

});


//USER AUTHENTICATION
app.post('/register',async(req,res)=>{
  /**
  try{
    const username = req.body.username
    const password = req.body.password
    if(!username || !password)throw new Error('missing information')
    const hashedPassword = await generateToken(password)

    con.query(`select * from user where user_name = '${Xss(username)}'`,async(err,data)=>{
      if(err)throw err
      if(data.length){
        if(await verifyPasswordWithHash(password,data[0].password_hash)){
          res.status(200).send({username:username,password:password,message:'giriş başarılı'})
        }
        else{
          res.status(400).send({message:'Kullanıcı adı kullanılıyor'})
        }
      }
      else{
        con.query(`insert into user(user_name,password_hash) values('${Xss(username)}','${hashedPassword}')`,(erro,logData)=>{
          if(erro) throw erro
          res.status(200).send({username:username,password:password,message:'kayıt oluşturuldu'})
        })
      }
    })

  }catch(error){
    console.log(error)
    res.status(500).send({data:error})
  }
   */
  try {
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
  /**
  try{
    var roomId = null;

    if(GameMode[req.body.gameMode] === undefined) throw new Error("Game mode couldn't fund")
    
    
    con.query(`select * from user where user_name = '${Xss(req.body.username)}'`,async(err,data)=>{
      if(err)throw new Error('Kimlik Doğrulanamadı')
      else if(data.length){
        if(await !verifyPasswordWithHash(req.body.password,data[0].password_hash)){
          throw new Error('Kimlik Doğrulanamadı')
        }
      }
    })

    function generateRoomID(){
      const generated = Math.floor(Math.random()*10**6)
      con.query(`select room_id from game where room_id = ${generated}`,(err,result)=>{
        if(result.length){
          generateRoomID()
        }
      })
      roomId = generated
    }
    generateRoomID()
    
    con.query(`
      insert into first_online_game.game(mode,private,player_limit,duration,room_id) values(
      ${GameMode[req.body.gameMode]},
      ${Xss(req.body.privacy)},
      ${Xss(req.body.playerLimit)},
      ${Xss(req.body.duration)},
      ${roomId});
      insert into first_online_game.executives(user_name,room,transfer_by) values(
        '${Xss(req.body.username)}',
        ${roomId},
        'no one');
      insert into first_online_game.player(user_name,room_id,socket_id,ip_address) values(
        '${Xss(req.body.username)}',
        ${roomId},
        1231233212,
        INET_ATON('192.168.1.101')
      );
      `,(err,result)=>{
        if(err) console.log(err)//throw new Error('gone wrong , try later')
      })
      
      res.status(200).send({roomId:roomId})

      const game = new Game(io)         //TODO:Mod yönetimi
      
      game.roomId = roomId;

      game.owner = req.body.username
      game.playerLimit = req.body.playerLimit
      game.private = req.body.privacy
      game.duration = req.body.duration
      
      games.push(game);
      
      console.log(`${req.body.username} created room whichs code is ${roomId}`)
      

    // socket.join(roomId)
  }catch(error){
    console.log(error)
    res.status(500).send({message:error})
  }
   */
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

    const game = new Game(io)         //TODO! Mod yönetimi
      
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
  
  
  /**
  try{

    userAuth(req.body.username,req.body.password).catch(error=>{
      throw new Error(error)
    })

    con.query(`select * from first_online_game.player where user_name = '${Xss(req.body.username)}'`,(err,result)=>{
      if(err) throw err;
      if(result.length > 0) throw new Error("zaten bir odadasın")
    })

    con.query(`select * from first_online_game.game where room_id = ${Xss(req.body.roomId)}`,(errorGame,resultGame)=>{
      if(errorGame)throw errorGame
      console.log('burada')
      // if(!resultGame[0]) next()
      con.query(`select * from first_online_game.player where room_id = ${Xss(req.body.roomId)}`,(errPlayer,resultPlayer)=>{
        if(errPlayer) throw errPlayer;
        // if(resultPlayer.length >= resultGame[0].player_limit)next()
 
        con.query(`insert into first_online_game.player(user_name,room_id,ip_address,device) values(
          '${Xss(req.body.username)}',
          ${resultGame[0].room_id},
          INET_ATON('${'192.168.1.101'}'),
          '${req.device.type}')`,(errGamer,resultGamer)=>{ //TODO? emin değişil ip doğru depolanıyor mu ? //req.ip
            if(errGamer) throw errGamer
            return res.status(200).send({message:'başarıyla odaya katılma gerçekleşti',roomURL:req.body.roomId})
        })
      })
    })

  }catch(error){
    console.log(error)
    res.status(500).send({message:error.e})
  }
  */
  //ikinci -------------------**************------------------*********----------*-*-*-*-------------***********
  /**
  try {
    userAuth(req.body.username,req.body.password).catch(error=>{
      throw new Error(error)
    }).then(()=>{
      con.query(`select * from first_online_game.player where user_name = '${Xss(req.body.username)}'`,(err,result)=>{
        if(err) throw err;
        if(result.length > 0){res.status(500).send({message:'zaten bir odadasın'})}
        else{
          con.query(`select * from first_online_game.game where room_id = ${Xss(req.body.roomId)} and on_play = false`,(errorGame,resultGame)=>{
            if(errorGame)throw errorGame
            if(!resultGame[0])res.status(404).send({message:'oda uygun değil'})
            else{
              con.query(`select * from first_online_game.player where room_id = ${Xss(req.body.roomId)}`,(errPlayer,resultPlayer)=>{
                if(errPlayer) throw errPlayer;
                if(resultPlayer.length >= resultGame[0].player_limit)res.status(500).send({message:'oda dolu'})
                else{
                  con.query(`insert into first_online_game.player(user_name,room_id,ip_address,device) values(
                    '${Xss(req.body.username)}',
                    ${resultGame[0].room_id},
                    INET_ATON('${'192.168.1.101'}'),
                    '${req.device.type}')`,(errGamer,resultGamer)=>{
                      if(errGamer) throw errGamer
                      res.status(200).send({message:'başarıyla odaya katılma gerçekleşti',roomURL:req.body.roomId})


                      const game = games.filter(_game=>_game.roomId == req.body.roomId)[0]
                      game.addPlayer(req.body.roomId)
                    })
                }
              })
            }
          })
        }
      })
    })
  } catch (error) {
    console.log(error)
  }
   */
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
  /**
   
   try{
     
     userAuth(req.body.username,req.body.password).catch(error=>{
      throw new Error(error)
    })
    
    con.query(`select * from first_online_game.game where private = false`,(errGame,resultGame)=>{
      if(errGame)throw errGame;
      if(resultGame.length === 0) throw new Error('uygun oda bulunmamakta')
      
      var pickedGame = null;
      
      function findingEligibleRoom(){
        pickedGame = resultGame[Math.floor(Math.random() * resultGame.length)]
        con.query(`select * from first_online_game.player where room_id = ${pickedId}`,(errPlayer,resultPlayer)=>{
          if(errPlayer) throw errPlayer
          if(resultPlayer.length >= pickedGame.player_limit) return findingEligibleRoom()

          con.query(`insert into first_online_game.player(user_name,room_id,socket_id,ip_address) values(
            '${Xss(req.body.username)}',
            ${pickedGame.room_id},
            1231233212,
            INET_ATON(${req.ip}))`,(errGamer,resultGamer)=>{  //TODO? emin değişil ip doğru depolanıyor mu ?
              
              if(errGamer) throw errGamer 
              return res.status(200).send({roomId:pickedGame.player_limit})
          })
        })
      }
      findingEligibleRoom()
    })
    
  }catch(error){
    console.log('error')
  }
  */
})

app.get('/lobi/getPlayers/:room_id',(req,res)=>{
  /**
   try {
     con.query(`select user_name from first_online_game.player where room_id = ${Xss(req.params.room_id)}`,(err,result)=>{
       if(err) throw err
       res.status(200).send(JSON.parse(JSON.stringify(result)))
      })
    } catch (error) {
      console.log(error)  
    }
    */
   storage.getPlayerList(req.params.room_id).then(data=>res.send(data))
})

app.get('/checkState',(req,res)=>{
  /**
   userAuth(req.query.username,req.query.password).catch((error)=>{throw error})
   try {
     con.query(`select * from first_online_game.player where user_name = '${Xss(req.query.username)}'`,(err,result)=>{
       if (err) throw err
      if(result[0]) return res.status(200).send({isPlayer:true})
      return res.status(200).send({isPlayer:false})
    })
  } catch (error) {
    
  }
  */
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
 
/**
const userAuth = (username,password) => {
    return new Promise((resolve,reject)=>{
      try{
        con.query(`select password_hash from user where user_name = '${Xss(username)}'`,async(err,result)=>{
          if(err) throw err
          if(await verifyPasswordWithHash(password,result[0].password_hash)){
            resolve()
          }else{
            reject('no person for data')
          }
        })
      }catch(error){
        reject('gone wrong')
      }
    })
}
 */

io.on('connection',socket=>{
  
  // console.log(`${socket.id} has been connected from ${socket.request.connection.remoteAddress}`)
  
  socket.once('updateSocketID',()=>{
    /**
     try { 
       userAuth(socket.handshake.query.username,socket.handshake.query.password).catch(error=>{throw error})
       con.query(`update first_online_game.player set socket_id = '${Xss(socket.id)}' where user_name = '${Xss(socket.handshake.query.username)}' `,(err,result)=>{if(err)throw err})
      con.query(`select room_id from first_online_game.player where user_name='${socket.handshake.query.username}'`,(err,res)=>{
        if(err)throw err
        if(res[0]) socket.join(res[0].room_id)
      })
      // socket.join()
    } catch (error) {
      console.log(error)
    }
    */
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
    /**
     try{
       
      userAuth(socket.handshake.query.username,socket.handshake.query.password).catch(dataa=>{
        throw new Error(dataa)
      })

      
      con.query(`select room_id from first_online_game.player where user_name = '${Xss(socket.handshake.query.username)}'`,(er,res)=>{
        if(er) throw er
        con.query(`select * from first_online_game.executives where room = ${res[0].room_id}`,(err,result)=>{
          if(err) throw err
          if(res[0]){
            con.query(`update first_online_game.game set on_play = 1 where room_id = ${res[0].room_id}`,(err,result)=>{
              if(err) throw err
            })
            io.to(res[0].room_id).emit('lobi-start')
            games.filter(_game=>_game.roomId === res[0].room_id)[0].onPlay = true
          }
        })
      })

    }catch(error){
      console.log(error)
    }
    */
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

// instrument(io,{auth:false})
 