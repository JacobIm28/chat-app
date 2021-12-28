const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  //Height of new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight
  
  // Height of messages cotnainer
  const containerHeight = $messages.scrollHeight

  // How far hae I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('locationMessage', (message) => {
  console.log(message)
  $messages.insertAdjacentHTML(
    'beforeend',
    Mustache.render(locationTemplate, {
      username: message.username, 
      url: message.url,
      createdAt: moment(message.createdAt).format('h:mm a'),
    }),
  )
  autoscroll()
})

socket.on('message', (message) => {
  console.log(message)
  $messages.insertAdjacentHTML(
    'beforeend',
    Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format('h:mm a'),
    })
  )
  autoscroll()
})

socket.on('roomData', ({room, users}) => {
  document.querySelector('#sidebar').innerHTML = Mustache.render(sidebarTemplate, {
    room,
    users
  })
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')

  socket.emit('sendMessage', e.target.elements.message.value, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if (error) {
      return console.log(error)
    }
    console.log('delivered')
  })
})

$sendLocation.addEventListener('click', (e) => {
  if (!navigator.geolocation) {
    return alert('Your browser does not support geolocation')
  }

  $sendLocation.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocation.removeAttribute('disabled')
        console.log('Location shared')
      },
    )
  })
})

socket.emit('join', { username, room }, (error) => {
  if(error){
    alert(error)
    location.href = '/'
  }
})
