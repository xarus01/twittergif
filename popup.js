var encoder;

chrome.extension.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
//    message.innerText = request.source;
    parser=new DOMParser();
    htmlDoc=parser.parseFromString(request.source, "text/html");
    var vid = document.createElement("video");
    vid.id = "video";
    vid.src = htmlDoc.getElementsByClassName("animated-gif")[0].src;
    vid.style.position = "absolute";
    vid.style.marginTop = "-999999px";
    message.appendChild(vid);
    var canv = document.createElement("canvas");
    canv.id = "bitmap";
    canv.style.position = "absolute";
    canv.style.marginTop = "-999999px";
    message.appendChild(canv);

    (function() {
      var v = document.getElementById("video");
      v.pause();
      var canvas = document.getElementById('bitmap');
      var context = canvas.getContext('2d');

      var cw,ch;
      
      v.crossOrign = "Anonymous";

      v.addEventListener('play', function(){
        cw = v.clientWidth;
        ch = v.clientHeight;
        canvas.width = cw;
        canvas.height = ch;

        encoder = new GIFEncoder();
        encoder.setRepeat(0); //0  -> loop forever
                            //1+ -> loop n times then stop
        encoder.setDelay(100); //go to next frame every n milliseconds
        encoder.start();
        v.play();
        draw(v,context,cw,ch);
      },false);
      v.play();
    })();
  }
});

function draw(v,c,w,h) {
  if(v.paused || v.ended) {
    encoder.finish();
    var binary_gif = encoder.stream().getData() //notice this is different from the as3gif package!
    var data_url = 'data:image/gif;base64,'+encode64(binary_gif);
    var img = document.createElement("img");
    img.src = data_url;

    var a = document.createElement("a");
    a.href = data_url;
    a.download = "twitter_gif.gif"
    a.text = "Click to download!"

    document.body.appendChild(img);

    message.innerText = "";
    message.appendChild(a);
    return false;
  }

  c.drawImage(v,0,0,w,h);
  encoder.addFrame(c);

  setTimeout(draw,20,v,c,w,h);
}

function onWindowLoad() {

  var message = document.querySelector('#message');
  chrome.tabs.getSelected(null,function(tab) {
    var tab = tab.url;
    if(tab.indexOf("twitter.com/") != -1) {
      chrome.tabs.executeScript(null, {
        file: "getPagesSource.js"
      }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.extension.lastError) {
          message.innerText = 'There was an error : \n' + chrome.extension.lastError.message;
        }
      });
    } else {
      message.innerText = 'Please open animated-gif included tweet (click date on each tweet)\ni.e. https://twitter.com/[username]/status/[some numbers]';
    }
  });
}

window.onload = onWindowLoad;