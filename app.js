const express = require("express");
const cors = require('cors')
const cookieParser=require('cookie-parser')
const mysql = require('mysql')
const path = require("path");
const { firebase, firebaseConfig } = require("./utils/firebaseStuff")
firebase.initializeApp(firebaseConfig)
const config = require("./config/production.json")
const session = require("express-session");
const mysqlStore = require('express-mysql-session')(session);
const sessionConnection = mysql.createConnection(config.Session.options)
const app = express();
const server = require('http').createServer(app)
const WebSocket = require('ws')
const wss = new WebSocket.Server({server:server})
app.use(cookieParser())
app.use(cors({ origin:['*','http://localhost:3000','http://localhost:3000/'],methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],credentials:true}))
const allowedOrigins = ['*','http://localhost:3000','http://localhost:3000/'];
app.use(function(req, res, next) {
  let origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin); // restrict it to the required domain
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.options('*', cors()) // include before other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const publicDirectoryPath = path.join(__dirname, "/public");
app.use(express.static(publicDirectoryPath));

let sessionOptions = config.Session.options
sessionOptions['createDatabaseTable']=false
sessionOptions['schema']=config.Session.schema
const sessionStore = new mysqlStore(sessionOptions,sessionConnection);
app.set('trust proxy', true)

app.use(
  session({
    name:'sid',
    resave: false,
    secret: "appSecretSessionTextP2p2r421412412",
    cookie: {
      sameSite:'strict',
      maxAge: 1000*60*60,
      secure: false
    },
    store: sessionStore,
    saveUninitialized: false,
  })
);
app.set("view engine", "ejs");

const port = process.env.PORT || 4000;
wss.on('connection',function connection(ws){
  console.log('new client connected')
  ws.send('welcome new client')
  ws.on('message',function incoming(message){
    console.log('received',message)
    wss.clients.forEach(function each(client){
      if(client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
})

app.use("/app", require("./routes"));

app.get("/", (req, res) => {
  res.render("entryPage");
});

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
