//const {SnakeGame} = require('./Snake')

exports.Clasic = class SnakeGame {
    constructor(props){
      //super(props)
    }

    spawnApple(username){
        const player = this.players.filter(elem=>elem.name === name)[0]
        if(player.eated || !player.appleCoordinates){
            const randomGenerator=(max)=>{
              return Math.floor(Math.random() * (max))
            }
            var x = randomGenerator(this.CANVAS_WIDTH/this.TILE_WIDTH);
            var y = randomGenerator(this.CANVAS_HEIGHT/this.TILE_HEIGHT);
            
            for(var i = 0; i < 1; i++){
              if(x === (Math.floor(player.coordinates[0].x/this.TILE_WIDTH)*this.TILE_WIDTH)){
                i++;
                x = randomGenerator(this.CANVAS_WIDTH/this.TILE_WIDTH);
                continue;
              }
              if(y === (Math.floor(player.coordinates[0].y/this.TILE_WIDTH)*this.TILE_WIDTH)){
                i++;
                y = randomGenerator(this.CANVAS_HEIGHT/this.TILE_HEIGHT);
                continue;
              }
            }
            
            if(x === 0) randomGenerator(this.CANVAS_WIDTH/this.TILE_WIDTH);
            if(y === 0) randomGenerator(this.CANVAS_HEIGHT/this.TILE_HEIGHT);
            
            
            for(var i = 0;i < 1;i ++){
            player.coordinates.forEach(piece => {
              if(piece.x === x){
                x =  randomGenerator(this.CANVAS_WIDTH/this.TILE_WIDTH);
                i++
              }
              if(piece.y === y){
                y =  randomGenerator(this.CANVAS_HEIGHT/this.TILE_HEIGHT);
                i++
              }
            });
            player.appleCoordinates = {x:x,y:y}
            }
        }
    }
    controls(name,keyCode){
        const player = this.players.filter(elem=>elem.name === name)[0]
    
        if(keyCode === 37 && (player.direction !== 'RIGHT') && player.direction !== 'LEFT'){
          player.direction = 'LEFT';
          player.turned = 'LEFT';
          player.coordinates[0].x = Math.round(player.coordinates[0].x);
        }
        if(keyCode === 39 && (player.direction !== 'LEFT') && player.direction !== 'RIGHT'){
          // this.players[0].x += +1;
          player.direction = 'RIGHT';
          player.turned = 'RIGHT';
          player.coordinates[0].x = Math.round(player.coordinates[0].x);
        }
        if(keyCode === 38 && (player.direction !== 'DOWN') && player.direction !== 'UP'){
          // this.players[0].y += -1;
          player.direction = 'UP';
          player.turned = 'UP';
          player.coordinates[0].y = Math.round(player.coordinates[0].y);
        }
        if(keyCode === 40 && (player.direction !== 'UP') && player.direction !== 'DOWN'){
          // this.players[0].y += +1;
          player.direction = 'DOWN';
          player.turned = 'DOWN';
          player.coordinates[0].y = Math.round(player.coordinates[0].y);
        }
    }
    addPlayer(id,username){
        this.players.push(new this.Player(this,id,username,this.TILE_WIDTH,this.TILE_HEIGHT,this.CANVAS_WIDTH,this.CANVAS_HEIGHT))
    }
    dropPlayer(username){
        this.players = this.players.filter(player=>player.id !== id)
    }
    update(){
        this.players.forEach(player => {
            player.updade();
          });
    }
}