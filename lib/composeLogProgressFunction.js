const composeLogProgressFunction = (progressText) => {
  return (message, ...args) => {
    console.log('[' + progressText + '] ' + message + ':', ...args);
  }
}

module.exports = { composeLogProgressFunction }
