// Event listener calling chrome api to get the current page details and injecting script.
let btn1 = document.querySelector('.startExam');
btn1.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // extension will only work for the links mentioned below
    if(tab.url === "https://www.javatpoint.com/java-mcq") {
        let div1 = document.getElementById("popuphtml");
        div1.style.display = "none";
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: fullScreen,
        });
    }
    else {
        alert("Extension only works for https://www.javatpoint.com/java-mcq");
    }
});


// Injected script in the current dom page
async function fullScreen() {

    // Requesting full screen mode for current tab
    let el = document.documentElement;
    if (el.requestFullscreen) {
        el.requestFullscreen();
    }
    

    // storing mic status initially
    localStorage.setItem("MicStatus", true);
   
    
    // function to count the number to tab change accord during exam if count increases more than 2 than exam gets automatically end
    let count = 0;      
    (function () {
        document.addEventListener('visibilitychange', function (e) {
            e.stopPropagation();
            count++;
            if (Math.ceil((count / 2)) >= 3) {
                window.location = window.location.href;
            }
            alert("Number of Tab changed " + Math.ceil((count / 2)));
        })
    })();
    
    
    // function to check the status of audio and video
    let flag = true;
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true }) 
        .then(function (stream) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
            
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;
            
            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
            scriptProcessor.onaudioprocess = function () {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                const arraySum = array.reduce((a, value) => a + value, 0);
                const average = arraySum / array.length;
                console.log(Math.round(average));
                if (Math.round(average) < 10) {
                    flag = false;
                }
                
                
                // checking whether user exited the full screen mode
                // If user exited the full screen mode than showing warning and displayig full screen button to get back to full screen
                if (document.fullscreenElement === null) {
                    let liid = document.getElementById("toggle");
                    liid.style.display = "inline-block";
                    let wid = document.getElementById("warning");
                    wid.style.display = "inline-block";
                } 
                else {
                    let liid = document.getElementById("toggle");
                    liid.style.display = "none";
                    let wid = document.getElementById("warning");
                    wid.style.display = "none";
                }
            };
        })
        .catch(function (err) {
            console.error(err);
            return;
        });
        
        
        //  storing the status of mic in local storage
        if (flag === false) {
            localStorage.setItem("MicStatus", false);
        }
        
        // checking the camera status
        detectWebcam(function (hasWebcam) {
            console.log(hasWebcam);
            console.log('Webcam: ' + (hasWebcam ? 'yes' : 'no'));
            (hasWebcam ? (localStorage.setItem("CameraStatus", true)) : (localStorage.setItem("CameraStatus", false)))
        })
        function detectWebcam(callback) {
            let md = navigator.mediaDevices;
            if (!md || !md.enumerateDevices) return callback(false);
            md.enumerateDevices().then(devices => {
                callback(devices.some(device => 'videoinput' === device.kind));
            })
        }
        
        // checking the internet status
        chkInternetStatus();
        function chkInternetStatus() {
            if (navigator.onLine) {
                localStorage.setItem("InternetStatus", true);
                console.log("Hurray! You're online!!!");
            } else {
                localStorage.setItem("InternetStatus", false);
                console.log("Oops! You're offline. Please check your network connection...");
            }
        }
        
        // preventing the user from directly closing the exam
        window.onbeforeunload = confirmExit;
        function confirmExit() {
            return "You have attempted to leave this page. Are you sure?";
        }
        
        // disable the copy past and shortkey keys
        document.body.addEventListener('keydown', event => {
            if (event.ctrlKey && 'cvxspwuaz'.indexOf(event.key) !== -1) {
                event.preventDefault()
            }
        });
        
        
        // if the tab is not full screen than pressing any key will make the window full screen
        document.body.onkeydown = function (e) {
            if (document.fullscreenElement === null) {
                let el = document.documentElement;
                if (el.requestFullscreen) {
                    el.requestFullscreen();
                }
            } 
        }
        
        
    // Inserting Endtest Button, Waring Paragraph and Full Screen button    
    let fscreen = 'none';
    document.body.innerHTML = `<Header Class="Site-Header" style="border-bottom: 1px solid #ccc;display: flex;justify-content: space-between;position: sticky;width: 100%;top: 0px;left: 0;background-color: white">
    <Div Class="Site-Identity" >
    <H1 style="font-size: 1.5em;/* margin: 0.6em 0; */margin-left: 10px;display: inline-block;margin-top: 10px;"><A Href="#" style="text-decoration: none; color: #000;">My Test Window</A></H1>
    </Div>
    <Nav Class="Site-Navigation" style="margin-right: 10px;">
    <Ul Class="Nav" style="margin: 0; padding: 0;">
    <Li id="warning" style="display: inline-block;">
    <p style="font-weight: bold; border-radius: 10px; font-size: 16px; color: red;"> ** kindly return to full screen mode **</p>
    </Li>
    <Li style="display: inline-block;/* margin: 1.4em 1em 1em 1em; */margin-top: 10px;">
    <button id="endExam" type="submit" style="background-color: red; padding: 5px; border-radius: 10px; font-size: 16px; color: white;"> End Exam </button>
    </Li>
    <Li id="toggle" style="display: none;/* margin: 1.4em 1em 1em 1em; */margin-top: 10px;">
    <button id="fscreen" type="submit" style="background-color: green; padding: 5px; border-radius: 10px; font-size: 16px; color: white;"> Enter Full Screen </button>
    </Li>
    </Ul>
    </Nav>
    </Header>
    <div id ="mydiv">
    <iframe src=${window.location.href} style='display: block;position: absolute;width: 100%; height: 100%; top: 60px;left: 0;'></iframe>
    </div>
    
    `
    // End exam button listner
    let btn = document.getElementById("endExam");
    btn.addEventListener('click', () => {
        alert("Exam Success completed, Deatils are Saved");
        window.location = window.location.href;
    });

    // Displaying warning if user exits the full screen mode
    let fbtn = document.getElementById("fscreen");
    fbtn.addEventListener('click', () => {
        let el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        }
        let liid = document.getElementById("toggle");
        liid.style.display = "none";
        let wid = document.getElementById("warning");
        wid.style.display = "none";
    })
}