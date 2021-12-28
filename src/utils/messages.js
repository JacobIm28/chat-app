const genMessage = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime()
  }
}

const genLocMessage = (username, url) => {
  return {
    username,
    url, 
    createdAt: new Date().getTime()
  }
}

export default {
  genMessage,
  genLocMessage
}