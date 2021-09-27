function LOAD (media, path)
{
  let promise = new Promise (resolve => {
    media.addEventListener ('canplaythrough', resolve);
  });

  media.src = path;
  return promise;
}

function ONCLICK (media, callback)
{
  return e => {
    console.log (e.offsetX, e.offsetY);

    let canvas = document.createElement ('canvas');
    let w = canvas.width  = media.clientWidth;
    let h = canvas.height = media.clientHeight;

    let context = canvas.getContext ('2d');
    context.drawImage (media, 0, 0, w, h);
    let [r, g, b] = context.getImageData (e.offsetX, e.offsetY, 1, 1).data;

    callback (r, g, b);
  };
}

export {LOAD, ONCLICK};

