const {Player} = require('../../Player/Snake/Clasic')
exports.SnakeGame = class SnakeGame{
    constructor(_Player = Player,TILE_HEIGHT,TILE_WIDTH,CANVAS_HEIGHT,CANVAS_WIDTH,owner,roomId,onPlay,playerLimit,isprivate,duration,startAt){
        this.TILE_WIDTH = TILE_WIDTH || 32;
        this.TILE_HEIGHT = TILE_HEIGHT|| 32;

        this.CANVAS_WIDTH = CANVAS_WIDTH || this.TILE_WIDTH * 17;
        this.CANVAS_HEIGHT = CANVAS_HEIGHT || this.TILE_HEIGHT * 17; 


        this.players=[];

        this.owner = owner || 'none';
        this.roomId = roomId || -1;
        this.onPlay = onPlay || false;

        this.playerLimit = playerLimit || 5
        this.private = isprivate || false 

        //this.condition = false;
        this.duration = duration || 0;
        this.startAt = startAt || Date.now();

        this.Player = _Player

    }
    spawnApple(username){}
    controls(name,keyCode){}
    addPlayer(id,username){}
    dropPlayer(username){}
    update(){}
}


