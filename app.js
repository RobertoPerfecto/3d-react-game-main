const express = require('express');
require('dotenv').config;
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const cors = require('cors');
app.use(cors());
const MAX_PLAYERS = process.env.MAX_PLAYERS || 4;
const stage_PREPARATION = "PREPARATION";
const stage_HIDING = "HIDING";
const stage_PLAYING = "PLAYING";
const stage_HIDER_WIN = "HIDER_WIN";
const stage_SEEKER_WIN = "SEEKER_WIN";
const HIDER = "HIDER";
const SEEKER = "SEEKER";
const SPECTATOR = "SPECTATOR";
const SERVER_TICK_TIME = 25;

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

server.listen(PORT, () => {
    console.log('listening on: ' + PORT);
});

app.use(express.static('./frontend/build'));

const rooms = [];

io.on('connection', (socket) => {
    console.log('Connection establised with a user ' + socket.id);
    let socketRoom;

    socket.on('join_room', (room) => {
        socket.join(room);
        socketRoom = room;
        let rm = rooms.find(r => r.name == room);
        if(!rm) {
            rm = {
                name: room,
                messages: [],
                players: [],
                world: generateWorld(),
                gameStage: stage_PREPARATION,
                hidingTimer: 40000,
                playingTimer: 120000,
            }
            rooms.push(rm);
        }
        if (rm.gameStage === stage_PREPARATION){
            rm.players.push({
                id: socket.id,
                playerMovement: {},
                position: [0, -2.8, 0],
                model: getRandomModel(),
               // type: 'HIDDER',
                rotation: 0,
                type: HIDER,
            });
            if (rm.players.length === MAX_PLAYERS) {
                startGame(rm);
            }
        }
        else {
            // TODO: TELL THE CLIENT THAT HE/SHE CAN NOT CONNECT TO THE ROOM!!!
            socket.emit("error", "This room is full!");
        }
    });

    socket.on('player_move', ({playerMovement, rotation}) => {
        const room = rooms.find(r => r.name === socketRoom);
        if(room) {
            const player = room.players.find(p => p.id === socket.id);
            if(player) {
                player.playerMovement = playerMovement;
                player.rotation = rotation;
            }
        }
    });
    socket.on('catch_spell', () => {
        const room = rooms.find(r => r.name === socketRoom);
        if(room) {
            const player = room.players.find(p => p.id === socket.id);
            if(player.type === SEEKER && room.gameStage === stage_PLAYING) {
                const x = player.position[0];
                const z = player.position[2];
                room.players.forEach(p => {
                    if (p.type === SEEKER){ 
                        return;
                    }
                    if (isCatched(p, x, z)) {
                        p.type = SEEKER;
                        p.model = 'Cube';
                    }
                });
                let isAllPlayerCatched = true;
                room.players.forEach(p => {
                    if (p.type === HIDER){ 
                        isAllPlayerCatched = false;
                    }
                });
                if (isAllPlayerCatched) {
                    room.gameStage = stage_SEEKER_WIN;
                }
            }
        }
    });

});

const models = ['Mushroom_1', 'Mushroom_2', 'Mushroom_3', 'Mushroom_4'];

function getRandomModel() {
    const index = Math.floor(Math.random() * models.length);
    return models[index];
}

function generateWorld() {
    const world = [];
    for(let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * 1000) - 500;
        const z = Math.floor(Math.random() * 1000) - 500;
        const object = {
            id: i,
            position: [x, -2.8, z],
            model: getRandomModel(),
        }
        world.push(object);
    }
    return world;
}

function startGame(rm) {
    rm.gameStage = stage_HIDING;
    const seekerIndex = Math.floor(Math.random() * MAX_PLAYERS);
    rm.players[seekerIndex].type = SEEKER;
    rm.players[seekerIndex].model = "Cube";
}

setInterval(serverTick, SERVER_TICK_TIME);

function serverTick() {
    rooms.forEach(r => {
        updatePlayerPos(r.players);
        updateRoomTime(r);
        //TODO: send only players
        io.to(r.name).emit('server_tick', r);
    });
}

function updatePlayerPos(players) {
    players.forEach(p => {
        if(p.playerMovement.left) {
            p.position[0] += Math.sin(p.rotation - Math.PI/2);
            p.position[2] += Math.cos(p.rotation - Math.PI/2);
        }
        if(p.playerMovement.right) {
            p.position[0] += Math.sin(p.rotation + Math.PI/2);
            p.position[2] += Math.cos(p.rotation + Math.PI/2);
        }
        if(p.playerMovement.up) {
            p.position[0] -= Math.sin(p.rotation);
            p.position[2] -= Math.cos(p.rotation);
        }
        if(p.playerMovement.down) {
            p.position[0] += Math.sin(p.rotation);
            p.position[2] += Math.cos(p.rotation);
        }
    });
}

function updateRoomTime(r) {
    switch (r.gameStage) {
        case stage_HIDING: return updateHidingTime(r);
        case stage_PLAYING: return updatePlayingTime(r);
        default: return;
    }
}

function updateHidingTime(r) {
    r.hidingTimer -= SERVER_TICK_TIME;
    if (r.hidingTimer <= 0) {
        r.gameStage = stage_PLAYING;
    }
}

function updatePlayingTime(r) {
    r.playingTimer -= SERVER_TICK_TIME;
    if (r.playingTimer <= 0) {
        r.gameStage = stage_HIDER_WIN;
    }
}

function isCatched(player, x, z) {
    const pX = player.position[0];
    const pZ = player.position[2];
    const rad = 50;
    return (pX < x + rad && pX > x - rad && pZ < z + rad && pZ > z - rad);
}