const composeProgressText = (current, total) => {
  const percent = Math.round(current / total * 100);
  return percent + '% ' + current.toLocaleString() + '/' + total.toLocaleString();
}

module.exports = { composeProgressText }
