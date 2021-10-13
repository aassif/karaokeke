function LOAD (media, path, offset = 0)
{
  return fetch (path).
    then (response => response.blob ()).
    then (blob => {
      let promise = new Promise (resolve => {
        media.addEventListener ('canplaythrough', resolve);
      })
      media.src = URL.createObjectURL (blob);
      media.currentTime = offset;
      return promise;
    });
}

function DISPOSE (media)
{
  let url = media.src;
  media.pause ();
  media.src = '';
  URL.revokeObjectURL (url);
}

function ONCLICK (media, callback)
{
  return e => {
    let canvas = document.createElement ('canvas');
    let w = canvas.width  = media.clientWidth;
    let h = canvas.height = media.clientHeight;

    let context = canvas.getContext ('2d');
    context.drawImage (media, 0, 0, w, h);
    let [r, g, b] = context.getImageData (e.offsetX, e.offsetY, 1, 1).data;

    callback ([r, g, b]);
  };
}

export {LOAD, DISPOSE, ONCLICK};

