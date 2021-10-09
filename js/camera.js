class Camera
{
  constructor ()
  {
    let video = document.createElement ('video');
    video.muted = true;
    this.video = video;
  }

  init (constraints)
  {
    this.constraints = constraints;
    let promise = new Promise (resolve => {
      this.video.addEventListener ('loadedmetadata', resolve);
    }).then (() => {
      //console.log ('webcam.js:', 'loadedmetadata');
      this.video.play ();
    });

    navigator.mediaDevices.getUserMedia (constraints).
      then (stream => {
        let tracks = stream.getVideoTracks ();
        //console.log (tracks);
        console.log ('webcam.js:', tracks[0].label);
        stream.onremovetrack = () => {
          console.log ('webcam.js:', 'onremovetrack');
        };
        this.video.srcObject = stream;
      }).
      catch (error => {
        console.error ('webcam.js:', error);
      });

    //document.body.appendChild (video);
    return promise;
  }
}

function CONSTRAINTS (d, ratio)
{
  const R = {aspectRatio: {ideal: ratio}};

  if (d.deviceId)
    return {video: {deviceId: {exact: d.deviceId}, ...R}, audio: false};

  if (d.groupId)
    return {video: {groupId: {exact: d.groupId}, ...R}, audio: false};

  return {video: R, audio: false};
}

Camera.ENUMERATE = function (ratio)
{
  return navigator.mediaDevices.enumerateDevices ().
    then (devices => {
      let cameras = [];
      let promises = [];
      devices.filter (d => d.kind == 'videoinput').forEach (d => {
        //console.log (d);
        let camera = new Camera ();
        cameras.push (camera);
        promises.push (camera.init (CONSTRAINTS (d, ratio)));
      });
      return Promise.all (promises).then (() => cameras);
    }).
    catch (error => {
      console.log (error.name + ': ' + error.message);
    });
}

export default Camera;

