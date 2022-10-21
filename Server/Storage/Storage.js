class Storage{
    constructor(){}
    getDataAfterShutDown(){}
    onDisconnect(socket_id){}
    userRegister(){}
    createRoom(){}
    joinRoom(){}
    joinRandomRoom(){}
    getPlayerList(){}
    checkUserState(){}
    userAuth(){}
    updateSocketId(){}
    startGame(){}
    isPlayerMemborOfRoom(username){}
    generateRoomID(){}
}


export const Storages = {
    MySql:()=>{
        const {MySql} = require('./MySql.js')
        return new MySql()
    }
}