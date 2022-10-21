class SnakeGame{
    constructor(){
        this.TILE_WIDTH = 32;
        this.TILE_HEIGHT = 32;

        this.CANVAS_WIDTH = TILE_WIDTH * 17;
        this.CANVAS_HEIGHT = TILE_HEIGHT * 17; 


        this.players=[];

        this.owner = 'none';
        this.roomId = -1;
        this.onPlay = false;

        this.playerLimit = 5
        this.private = false 

        this.condition = false;
        this.duration = 0;
        this.startAt = Date.now();

    }
    spawnApple(username){}
    controls(name,keyCode){}
    addPlayer(id,username){}
    dropPlayer(username){}
    update(){}
}