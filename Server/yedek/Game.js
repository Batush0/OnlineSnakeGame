const { Player } = require("./Player");

const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;

const CANVAS_WIDTH = TILE_WIDTH * 17;//30;//10;
const CANVAS_HEIGHT = TILE_HEIGHT * 17;//30;//8; 

//TODO? dönme zıbırtısı
//TODO? elma kordinatları max canvas böleni genişliğindeyse ---(CANVAS_WIDTH/TILE_WIDTH) ===> (544/17) ===> 544--- herhangi bir nesne gözükmemekte



exports.Game = class Game  extends SnakeGame{

  constructor(){

    this.players=[];

    // this.appleCoordinates = undefined;
    this.owner = undefined;
    this.roomId = undefined;
    this.onPlay = false;

    this.playerLimit = 5
    this.private = undefined 

    this.condition = false;
    this.duration = 0;
    this.startAt = Date.now();
  }

  
  spawnApple = (name) => {
    const player = this.players.filter(elem=>elem.name === name)[0]
    if(player.eated || !player.appleCoordinates){
        const randomGenerator=(max)=>{
          return Math.floor(Math.random() * (max))
        }
        var x = randomGenerator(CANVAS_WIDTH/TILE_WIDTH);
        var y = randomGenerator(CANVAS_HEIGHT/TILE_HEIGHT);
        
        for(var i = 0; i < 1; i++){
          if(x === (Math.floor(player.coordinates[0].x/TILE_WIDTH)*TILE_WIDTH)){
            i++;
            x = randomGenerator(CANVAS_WIDTH/TILE_WIDTH);
            continue;
          }
          if(y === (Math.floor(player.coordinates[0].y/TILE_WIDTH)*TILE_WIDTH)){
            i++;
            y = randomGenerator(CANVAS_HEIGHT/TILE_HEIGHT);
            continue;
          }
        }
        
        if(x === 0) randomGenerator(CANVAS_WIDTH/TILE_WIDTH);
        if(y === 0) randomGenerator(CANVAS_HEIGHT/TILE_HEIGHT);
        
        
        for(var i = 0;i < 1;i ++){
        player.coordinates.forEach(piece => {
          if(piece.x === x){
            x =  randomGenerator(CANVAS_WIDTH/TILE_WIDTH);
            i++
          }
          if(piece.y === y){
            y =  randomGenerator(CANVAS_HEIGHT/TILE_HEIGHT);
            i++
          }
        });
        player.appleCoordinates = {x:x,y:y}
        }
        // console.log('apple has spawned on '+ this.appleCoordinates.x + '    ' + this.appleCoordinates.y + ' for ' + player.id)
    }
  }

  controls = (name,keyCode) => {
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

  addPlayer = (id,name) => {
    this.players.push(new Player(this,id,name))
  }

  removePlayer = (id) => {
    this.players = this.players.filter(player=>player.id !== id)
  }
 
  update=()=>{ 
    this.players.forEach(player => {
      player.updade();
    });
  };
}