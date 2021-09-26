class Webcam
{
  constructor (constraints)
  {
    let video = document.createElement ('video');
    video.muted = true;
    this.video = video;

    this.ready = new Promise (resolve => {
      //console.log ('webcam.js:', 'loadedmetadata');
      video.addEventListener ('loadedmetadata', resolve);
      video.play ();
    });

    navigator.mediaDevices.getUserMedia (constraints).
      then (stream => {
        let tracks = stream.getVideoTracks ();
        console.log (tracks);
        console.log ('webcam.js:', tracks[0].label);
        stream.onremovetrack = () => {
          console.log ('webcam.js:', 'onremovetrack');
        };
        video.srcObject = stream;
      }).
      catch (error => {
        switch (error.name)
        {
          case 'ConstraintNotSatisfiedError':
            let w = constraints.video.width.exact;
            let h = constraints.video.height.exact;
            console.error ('webcam.js: ', error.name, w + '×' + h);
            break;

          case 'PermissionDeniedError' :
            console.error ('webcam.js: ', error.name);
            break;

          default:
            console.error (error.name, error);
        }
    });

    //document.body.appendChild (video);
  }
}

export default Webcam;

