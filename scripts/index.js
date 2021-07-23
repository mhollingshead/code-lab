let firepadRef, editor, sessionId, theme = "light";

function init() {
    const firebaseConfig = {
        apiKey: "AIzaSyC-e_QQhO4VeWBGXXpKbLiK5IeCuVfxTQQ",
        authDomain: "code-lab-7d5de.firebaseapp.com",
        projectId: "code-lab-7d5de",
        storageBucket: "code-lab-7d5de.appspot.com",
        messagingSenderId: "565227559162",
        appId: "1:565227559162:web:234f19240da6856bd91143",
        measurementId: "G-51SRDB15X4",
        databaseURL: "https://code-lab-7d5de-default-rtdb.firebaseio.com/"
    };

    // Init firebase instance using configs
    firebase.initializeApp(firebaseConfig);

    // Connect to new or existing project instance db
    firepadRef = getExampleRef();

    // Init default ace editor
    editor = ace.edit('firepad');
    editor.session.setMode("ace/mode/javascript");

    // Display proper instance id
    document.querySelector('#code-id').innerText = '#' + sessionId;

    // Init new firepad from ace editor
    const firepad = Firepad.fromACE(firepadRef, editor);
    // Remove watermark
    document.querySelector('.powered-by-firepad').remove();

    // Post-render settings / event listeners
    firepad.on('ready', () => {
        // Set new user id until changed
        const id = "User " + makeId(6);
        document.querySelector("#username").value = id;
        firepad.setUserId(id)

        // Toggle light and dark theme styles
        document.querySelector('#theme-toggle').addEventListener('click', () => {
            document.querySelectorAll('*').forEach(el => el.classList.toggle('dark'));
            if (theme === "light") {
                editor.setTheme("ace/theme/tomorrow_night");
                theme = "dark";
            } else {
                editor.setTheme("ace/theme/textmate");
                theme = "light";
            }
        })

        // Change display name
        document.querySelector("#user-change").addEventListener('submit', e => {
            e.preventDefault();
            const name = e.target.username.value;
            if (name) firepad.setUserId(name);
        });
        document.querySelector('#code-id').addEventListener('click', () => {
            // Add temporary element to body
            const tmp = document.createElement('input');
            tmp.value = window.location.href;
            document.body.appendChild(tmp);

            // Select + copy it, then remove it
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);

            // Handle aria label
            const idArea = document.getElementById("code-id");
            idArea.ariaLabel = "Copied to clipboard!";
            const revertAriaLabel = () => idArea.ariaLabel = "Copy sharable link";
            idArea.addEventListener('mouseout', () => setTimeout(revertAriaLabel, 500));
        });
        // Hijack the console
        document.querySelector('#eval').addEventListener('click', () => {
            try {
                // Evaluate code
                eval(editor.getValue());
            } catch(e) {
                // Handle errors
                logError(e.message);
            }
        });
        // Clear console
        document.querySelector('#clear').addEventListener('click', () => {
            document.querySelector('#log').innerHTML = "";
        });
    })

    // Display active user list when users are updated
    firepadRef.child('users').on('value', users => {
        document.querySelector('#user-list').innerHTML = "";
        let i = 0;
        users.forEach(user => {
            const div = document.createElement('div');
            div.classList.add('user');
            const avi = document.createElement('div');
            avi.classList.add('avatar');
            avi.style.backgroundColor = user.val().color;
            div.appendChild(avi);
            const p = document.createElement('p');
            p.innerText = Object.keys(users.val())[i];
            div.appendChild(p);
            document.querySelector('#user-list').appendChild(div);
            i++;
        })
    });
}

// Connect to the propper database
function getExampleRef() {
    var ref = firebase.database().ref();
    var hash = window.location.hash.replace(/#/g, '');
    if (hash) {
        // If db specified in url exists, connect to it
        ref = ref.child(hash);
        sessionId = ref.key;
    } else {
        // Else generate new location.
        ref = ref.push();
        // add it as a hash to the URL.
        window.location = window.location + '#' + ref.key; 
        sessionId = ref.key;
    }
    return ref;
}

// Override default console.log and redirect logs to our pseudo console
const legacy = console.log;
(function () {
    const logger = document.getElementById('log');
    console.log = function () {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == 'object') {
                // If its an object, stringify
                logger.innerHTML += `
                    <div class="op">
                        <div class="carrot">
                            <span class="m-i">
                                navigate_before
                            </span>
                        </div>
                        <pre class="output">${(JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i])}</pre>
                    </div>
                `;
            } else {
                // Else, log value
                logger.innerHTML += `
                    <div class="op">
                        <div class="carrot">
                            <span class="m-i">
                                navigate_before
                            </span>
                        </div>
                        <pre class="output">${arguments[i]}</pre>
                    </div>
                `;
            }
            // Scroll to bottom of the console on new logs
            logger.scrollTop = logger.scrollHeight;
        }
    }
})()

// Log errors to console with necessary styling
function logError(e) {
    const logger = document.getElementById('log');
    const themeClass = (theme === "dark") ? "dark" : "";
    logger.innerHTML += `
        <div class="op error ${themeClass}">
            <div class="carrot error ${themeClass}">
                <span class="m-i">
                    error
                </span>
            </div>
            <pre class="output error ${themeClass}">${e}</pre>
        </div>
    `;
};

// Generate initial user IDs
function makeId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}