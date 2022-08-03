import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import * as bodyParser from "express";

const app = express();
const httpServer = createServer(app);
httpServer.listen(3000)

let connected = [];

app.set('view engine', 'ejs')


// middlewares
app.use('/assets', express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const sessionMiddleware = session({
    secret: "changeit",
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);

app.get('/', (req, res) => {
    res.render('pages/home')
})
app.get('/chat', (req, res) => {
    res.render('pages/chat', { connected: connected })
})
app.post("/login", (req, res) => {
    req.session.authenticated = true
    req.session.pseudo = req.body.pseudo
    res.redirect("/chat")
});

const io = new Server(httpServer);

// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// only allow authenticated users
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.authenticated) {
        next();
    } else {
        next(new Error("unauthorized"));
    }
});



io.on('connection', (socket) => {
    let name = socket.request.session.pseudo
    console.log('a user connected');
    connected.push(name)
    io.emit('user connect', (name))


    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
    socket.on('disconnect', () => {
        console.log('a user disconnected')
        var index = connected.indexOf(name);
        if (index !== -1) {
            connected.splice(index, 1);
        }

        io.emit('user disconnect', (name))
    });
});


