import express from 'express'
import path from 'path'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Filter from 'bad-words'
import utils from './utils/messages.js'
import userUtils from './utils/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = userUtils.addUser({
      id: socket.id,
      username,
      room,
    })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit('message', utils.genMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', utils.genMessage(`${user.username} has joined`))
    io.to(user.room).emit('roomData', {
      room: user.room, 
      users: userUtils.getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()

    const user = userUtils.getUser(socket.id)

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed')
    }

    io.to(user.room).emit('message', utils.genMessage(user.username, message))
    callback()
  })

  socket.on('sendLocation', (location, callback) => {
    const user = userUtils.getUser(socket.id)
    io.to(user.room).emit('locationMessage', utils.genLocMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
    callback()
  })

  socket.on('disconnect', () => {
    const user = userUtils.removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', utils.genMessage('Admin', `${user.username} has left`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: userUtils.getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log('Server is up on port 3000')
})
