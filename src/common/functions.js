export const removeComments = (css) => {
  return css.replace(/\/\*(\r|\n|.)*\*\//g,"");
}

export const getText = (url) => {
  // read text from URL location
  const http = require('http'); // or 'https' for https:// URLs
  const fs = require('fs');

  const file = fs.createWriteStream("file.jpg");
  return http.get(url, function(response) {
    response.pipe(file);
  });
}