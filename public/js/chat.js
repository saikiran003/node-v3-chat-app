const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messgaeFormInput = document.querySelector('input')
const $messgaeFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector("#messages")

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoScroll = () => {
    // New Message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of the message container
    const containertHeight = $messages.scrollHeight

    //How far have I Scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containertHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render( locationMessageTemplate, {
        username: message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
   const html = Mustache.render(sidebarTemplate, {
        room,
        users
   })

   document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messgaeFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message , (error) => {

        $messgaeFormButton.removeAttribute('disabled')
        $messgaeFormInput.value = ''
        $messgaeFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})



$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        let latitude = position.coords.latitude
        let longitude = position.coords.longitude
        socket.emit('sendLocation', { latitude, longitude }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})