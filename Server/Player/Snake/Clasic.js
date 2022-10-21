exports.Player = class Player{

    constructor(game,id,name,TILE_WIDTH,TILE_HEIGHT,CANVAS_WIDTH,CANVAS_HEIGHT){
  
      this.coordinates = [{x:0,y:0,direction:'RIGHT'}] 
      this.appleCoordinates = undefined;
      // this.speed = 0.15; 
      this.speed = 1;
  
      this.game = game;
      this.direction = 'RIGHT';
      this.turned = null;
      this.eated = false;

      this.id = id;

      this.name = name

      this.TILE_WIDTH = TILE_WIDTH 
      this.TILE_HEIGHT = TILE_HEIGHT
      this.CANVAS_WIDTH = CANVAS_WIDTH
      this.CANVAS_HEIGHT = CANVAS_HEIGHT 
    }
  
    
    updade=()=>{
  
      this.move();
      
      if(this.appleCoordinates && this.coordinates[0].x === this.appleCoordinates.x && this.coordinates[0].y === this.appleCoordinates.y){
        this.eated = true;
        this.game.spawnApple(this.id);
        console.log('eated')
      }
      else if(!this.appleCoordinates){
        this.game.spawnApple(this.id)
      }
      this.hitCheck()
    };
  
    hitCheck = () => {
      const head = this.coordinates[0]
      for(var i = 1; i< this.coordinates.length ; i++){
        if(this.coordinates[i].x === head.x && head.y === this.coordinates[i].y){
          console.log('u hitted')
        }
      };
      if(head.x > this.CANVAS_WIDTH/this.TILE_WIDTH -1) head.x = 0;
      if(head.x < 0) head.x = this.CANVAS_WIDTH/this.TILE_WIDTH -1;
  
      if(head.y > this.CANVAS_HEIGHT/this.TILE_HEIGHT -1) head.y = 0;
      if(head.y < 0) head.y = this.CANVAS_HEIGHT/this.TILE_HEIGHT -1;
    }
  
    move = () => {
      var obj = {};
      if(this.direction === 'UP'){
        obj = {x:this.coordinates[0].x ,y:this.coordinates[0].y - this.speed,direction:'UP'};
      }
      if(this.direction === 'DOWN'){
        obj = {x:this.coordinates[0].x ,y:this.coordinates[0].y + this.speed,direction:'DOWN'};
      }
      if(this.direction === 'LEFT'){
        obj = {x:this.coordinates[0].x - this.speed ,y:this.coordinates[0].y,direction:'LEFT'};
      }
      if(this.direction === 'RIGHT'){
        obj = {x:this.coordinates[0].x + this.speed ,y:this.coordinates[0].y,direction:'RIGHT'};}
  
      if(this.turned){
        obj['turned'] = this.turned;
        this.turned = null;
      }
  
      this.coordinates.unshift(obj);
  
      if(!this.eated){
        this.coordinates.pop();
      }
      this.eated = false
    }
  
    calculateCoord = (value) => {
      return (Math.floor(value/this.TILE_WIDTH)*this.TILE_WIDTH)
    }
  
    eate = () => {
      this.eated = true;
      this.game.spawnApple();
    }
}

exports.Game = this.Game;