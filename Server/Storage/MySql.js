const mysql = require('mysql');
const {Xss} = require('../useful/xss-check.js');
const {verifyPasswordWithHash} = require('../useful/cryptology.js');
const {Storage} = require('./Storage.js')

class MySql extends Storage{
    constructor(){
        super()
        this.connection = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            multipleStatements: true
          });
         
          this.connection.connect(function(err) {
            if (err) {
                console.log(err)
                throw err;
            }
        });
    }


    getDataAfterShutDown(){
        return new Promise((resolve,reject)=>{
            try {
                this.connection.query(`select * from game`,(errGame,resGame)=>{
                    var data = []
                    if(errGame) throw errGame
                    resGame.forEach(gameObj => {

                        //* EK VERİLER + SORUN ==>
                        //? YAZDIRILACAK VERİLERİ GÖNDERME İŞLEMİNDEN SONRA İŞLENİYOR 
                        this.connection.query(`select socket_id , user_name from player where room_id = ${gameObj.room_id}`,async(errPlayer,resPlayer)=>{
                            if(errPlayer) throw errPlayer
                            var players = []
                            resPlayer.forEach(playerObj => {
                                players.push({socket_id:playerObj.socket_id,username:playerObj.user_name})
                            })
                            gameObj.players = players
                        });

                        //* AYNI PROBLEM
                        this.connection.query(`select user_name from executives where room = ${gameObj.room_id}`,(errExecutives,resultExecutives)=>{
                            if(errExecutives) throw errExecutives
                            gameObj.owner = resultExecutives[0].user_name
                        })

                        data.push(gameObj)
                    })
                    resolve(data) //* <== YAZDIRILACAK VERİLERİ GÖNDERME
                });
            } 
            catch (error) {
                console.log(error)
                reject()
            }

        })
    }
    onDisconnect(socket_id){
        return new Promise((resolve,reject)=>{
            try {
                this.connection.query(`delete from player where room_id = ${socket_id};`,(err,result)=>{
                })
          
                this.connection.query(`delete from game where room_id = if(
                (select count(*) from player where room_id = (select room_id from player where socket_id = '${socket_id}' limit 1)) = 0,(select room_id from player where socket_id = '${socket_id}' limit 1),null)`,(err,result)=>{
                  if(err)throw err
                })

                resolve()
          
            } catch (error) {
              console.log(error)
              reject()
            }
        })
    }
    userRegister(username,password,hashedPassword){
        return new Promise((resolve,reject)=>{
            try{
                this.connection.query(`select * from user where user_name = '${Xss(username)}'`,async(err,data)=>{
                  if(err)throw err
                  if(data.length){
                    if(await verifyPasswordWithHash(password,data[0].password_hash)){
                        resolve({username:username,password:password,message:'giriş başarılı'})
                    }
                    else{
                        resolve({message:'Kullanıcı adı kullanılıyor'})
                    }
                  }
                  else{
                    this.connection.query(`insert into user(user_name,password_hash) values('${Xss(username)}','${hashedPassword}')`,(erro,logData)=>{
                      if(erro) throw erro
                      resolve({username:username,password:password,message:'kayıt oluşturuldu'})
                    })
                  }
                })
            
              }catch(error){
                console.log(error)
                reject({data:error})
              }
        })
    }
    generateRoomID(){
        const generated = Math.floor(Math.random()*10**6)
        con.query(`select room_id from game where room_id = ${generated}`,(err,result)=>{
            if(result.length)return -1
        })
        return generated
    }

    createRoom(username,password,gameMode,privacy,playerLimit,duration,ip){
        return new Promise((resolve,reject)=>{
            try{
                
                this.userAuth(username,password).catch(function(err){throw err.data}) //might be mess
                
                this.isPlayerMemborOfRoom(username).catch((err)=>{throw err})
          
                var roomId = generateRoomID()
                while(true){
                    if(roomId > 0) break
                    roomId = generateRoomID()
                }

              
                this.connection.query(`
                    insert into game(mode,private,player_limit,duration,room_id) values(
                    ${gameMode},
                    ${Xss(privacy)},
                    ${Xss(playerLimit)},
                    ${Xss(duration)},
                    ${roomId});
                    insert into executives(user_name,room,transfer_by) values(
                      '${Xss(username)}',
                      ${roomId},
                      'no one');
                    insert into player(user_name,room_id,socket_id,ip_address) values(
                      '${Xss(username)}',
                      ${roomId},
                      000,
                      INET_ATON('${ip}')
                    );
                    `,(err,result)=>{
                        if(err) throw new Error('gone wrong , try later')
                })

                resolve({roomId:roomId})
                
            }catch(error){
              console.log(error)
              reject({message:error})
            }
        })
    }
    joinRoom(username,password,roomId,device,ip){
        return new Promise((resolve,reject)=>{
            try {
                this.userAuth(username,password).catch(data=>{throw new Error(data)})

                this.isPlayerMemborOfRoom(username).catch((err)=>{throw err})

                this.connection.query(`select * from game where room_id = ${Xss(roomId)} and on_play = false`,(errorGame,resultGame)=>{
                    if(errorGame)throw errorGame
                    if(!resultGame[0])throw new Error({message:'oda uygun değil'})

                    this.connection.query(`select * from player where room_id = ${Xss(roomId)}`,(errPlayer,resultPlayer)=>{
                        if(errPlayer) throw errPlayer;
                        if(resultPlayer.length >= resultGame[0].player_limit)throw new Error({message:'oda dolu'})
                        this.connection.query(`insert into player(user_name,room_id,ip_address,device) values(
                            '${Xss(username)}',
                            ${resultGame[0].room_id},
                            INET_ATON('${ip}'),
                            '${device}')`,(errGamer,resultGamer)=>{
                                if(errGamer) throw errGamer
                                resolve({message:'başarıyla odaya katılma gerçekleşti',roomURL:roomId})
                        })
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }
    joinRandomRoom(){
        //TODO* çalışma alanı !
    }
    getPlayerList(room_id){
        return new Promise((resolve)=>{
            try {
                this.connection.query(`select user_name from player where room_id = ${Xss(room_id)}`,(err,result)=>{
                  if(err) throw err
                  resolve(JSON.parse(JSON.stringify(result)))
                })
            } catch (error) {
                console.log(error)  
            }
        })
    }
    checkUserState(username,password){
        return new Promise((resolve,reject)=>{
            try {
                this.userAuth(username,password).catch(err=>{throw err})
                this.connection.query(`select * from player where user_name = '${Xss(username)}'`,(err,result)=>{
                    if (err) throw err
                    if(result[0]) return resolve({isPlayer:true})
                    return resolve({isPlayer:false})
                  })
            } catch (error) {
                reject(error)
            }
        })
    }
    userAuth(username,password){
        return new Promise((resolve,reject)=>{
            try{
                this.connection.query(`select password_hash from user where user_name = '${Xss(username)}'`,async(err,result)=>{
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
    updateSocketId(username,password,socket_id){
        return new Promise((resolve)=>{
            try { 
                this.userAuth(username,password).catch(error=>{throw error})
                this.connection.query(`update player set socket_id = '${Xss(socket_id)}' where user_name = '${Xss(username)}' `,(err,result)=>{if(err)throw err})
                this.connection.query(`select room_id from player where user_name='${username}'`,(err,res)=>{
                    if(err)throw err
                    if(res[0]) resolve(res[0].room_id)  
                })
            } catch (error) {
                console.log(error)
            }
        })
    }
    startGame(username,password){
        return new Promise((resolve)=>{
            try{
                this.userAuth(username,password).catch(dataa=>{throw dataa})
          
                
                this.connection.query(`select room_id from player where user_name = '${Xss(username)}'`,(er,res)=>{
                    if(er) throw er
                    this.connection.query(`select * from executives where room = ${res[0].room_id}`,(err,result)=>{
                        if(err) throw err
                        if(res[0]){
                        this.connection.query(`update game set on_play = 1 where room_id = ${res[0].room_id}`,(err,result)=>{
                            if(err) throw err
                        })
                        resolve(res[0].room_id)
                    }
                  })
                })
          
              }catch(error){
                console.log(error)
              }
        })
    }
    isPlayerMemborOfRoom(username){
        return new Promise((resolve,reject)=>{
            this.connection.query(`select * from player where user_name = ${Xss(username)}`,(err,res)=> {
                if(res.length)reject('zaten bir odadasın')
            })
        })
    }
}

module.exports.mysql = MySql
