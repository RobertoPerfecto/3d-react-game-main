import { Canvas } from '@react-three/fiber'
import classes from './Game.module.css';
import Player from './Player/Player';
import Plane from './Plane/Plane';
import Timer from './Timer/Timer';
import { OrbitControls, Stars } from '@react-three/drei'
import RoomForm from './RoomForm/RoomForm';
import { useEffect, useRef, useState } from 'react';
import { useLoader } from "@react-three/fiber";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false
};


function Game(props) {
  const socket = props.socket;
  const [room, setRoom] = useState({players:[], world: []});
  const [cameraPosition, setCameraPosition] = useState([0,0,0]);
  const [currentPlayer, setCurrentPlayer] = useState({});
  const orbitControlsRef = useRef();
  const stage_PREPARATION = "PREPARATION";
  const stage_HIDING = "HIDING";
  const stage_PLAYING = "PLAYING";
  const stage_HIDER_WIN = "HIDER_WIN";
  const stage_SEEKER_WIN = "SEEKER_WIN";
  const HIDER = "HIDER";
  const SEEKER = "SEEKER";  

  useEffect(() => {
    socket.on('server_tick', room => {
      setRoom(room);
      const curP = room.players.find(p => p.id === socket.id);
      setCurrentPlayer(curP);
      setCameraPosition(curP.position);
    });
    socket.on('error', err => {
      alert("ERROR: " + err);
    })
  }, [socket]);

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    window.addEventListener('keypress', pressHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
      window.removeEventListener('keypress', pressHandler);
    }
  }, []);

  const downHandler = (event) => {
    switch(event.keyCode) {
      case 87: playerMovement.up = true; break;
      case 68: playerMovement.right = true; break;
      case 65: playerMovement.left = true; break;
      case 83: playerMovement.down = true; break;
      default: return;
    }
    const rotation = orbitControlsRef.current.getAzimuthalAngle(); 
    socket.emit('player_move', {playerMovement, rotation});
  }

  const upHandler = (event) => {
    switch(event.keyCode) {
      case 87: playerMovement.up = false; break;
      case 68: playerMovement.right = false; break;
      case 65: playerMovement.left = false; break;
      case 83: playerMovement.down = false; break;
      default: return;
    }
    const rotation = orbitControlsRef.current.getAzimuthalAngle();
    socket.emit('player_move', {playerMovement, rotation});
  }

  const pressHandler = (event) => {
//    if (currentPlayer.type === SEEKER && room.gameStage === stage_PLAYING) {
      if (event.keyCode === 101) {
        socket.emit('catch_spell');
      }
  //  }
  }

  const models = new Map();
  models.set('Mushroom_1', useLoader(FBXLoader, process.env.PUBLIC_URL + 'models/Mushroom_1.fbx')); 
  models.set('Mushroom_2', useLoader(FBXLoader, process.env.PUBLIC_URL + 'models/Mushroom_2.fbx'));
  models.set('Mushroom_3', useLoader(FBXLoader, process.env.PUBLIC_URL + 'models/Mushroom_3.fbx'));
  models.set('Mushroom_4', useLoader(FBXLoader, process.env.PUBLIC_URL + 'models/Mushroom_4.fbx'));
  // models.set('Apple_1', useLoader(FBXLoader, process.env.PUBLIC_URL + 'models/Apple_1.fbx'));

  const getObj = (name) => {
      const object = models.get(name);
      return object.clone();
  }   
  if (room.gameStage === stage_HIDING && currentPlayer.type === SEEKER) {
    return (
      <div className={classes.blackScreen}>
        <Timer gameStage={room.gameStage} timer={room.hidingTimer} color="white" />
        <h1> YOU ARE SEEKER</h1>
      </div>
    )
  }
  if (room.gameStage === stage_SEEKER_WIN) {
    return (
      <div className={classes.blackScreen}>
        <h1>SEEKER WIN</h1>
      </div>
    )
  }
  if (room.gameStage === stage_HIDER_WIN) {
    return (
      <div className={classes.blackScreen}>
        <h1>HIDERS WIN</h1>
      </div>
    )
  }
  return (
    <div className={classes.canvasContainer}>
      {!room.name ?  <RoomForm socket={socket}/> : null}
      {room.gameStage === stage_HIDING ?  <Timer gameStage={room.gameStage} timer={room.hidingTimer} color="black" /> : null}
      {room.gameStage === stage_PLAYING ?  <Timer gameStage={room.gameStage} timer={room.playingTimer} color="black" /> : null}
        <Canvas flat linear>
            <color attach="background" args={['lightblue']} />
            <OrbitControls ref={orbitControlsRef} target={cameraPosition} position={cameraPosition} minDistance={7.5} maxDistance={15} minZoom={0.1} maxZoom={0.5} />
            {/* <Stars/> */}
            <ambientLight intensity={0.9}/>
            <pointLight position={[5, 10, 0]} />
            { room.players.map(p => <Player getObj={getObj} position={p.position} key={p.id} model={p.model} type={p.type} />) }
            <Plane world={room.world} getObj={getObj} />
        </Canvas>
    </div>
  );
}

export default Game;
