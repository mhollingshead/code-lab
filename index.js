let firepadRef, editor;
let theme = "light";

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
    firebase.initializeApp(firebaseConfig);

    firepadRef = firebase.database().ref();

    editor = ace.edit('firepad');
    editor.session.setMode("ace/mode/javascript");

    // document.querySelector('#code-id').innerText = '/' + makeid(8);

    const firepad = Firepad.fromACE(firepadRef, editor);
    document.querySelector('.powered-by-firepad').remove();

    firepad.on('ready', () => {
        const id = "User " + makeid(6);
        firepad.setUserId(id)
        document.querySelector("#username").value = id;
        // Change display name
        document.querySelector("#user-change").addEventListener('submit', e => {
            e.preventDefault();
            const name = e.target.username.value;
            if (name) firepad.setUserId(name);
        });
        // Evaluate code
        document.querySelector('#eval').addEventListener('click', () => {
            eval(editor.getValue());
        });
        // Clear console
        document.querySelector('#clear').addEventListener('click', () => {
            document.querySelector('#log').innerHTML = "";
        });
    })

    firepadRef.child('users').on('value', users => {
        document.querySelector('#user-list').innerHTML = "";
        let i = 0;
        // Display active user list
        users.forEach((user, ind) => {
            const div = document.createElement('div');
            div.classList.add('user');
            const avi = document.createElement('div');
            avi.classList.add('avatar');
            avi.style.backgroundColor = user.val().color;
            div.appendChild(avi);
            const p = document.createElement('p');
            p.innerText = Object.keys(users.val())[i].replace("-MfC5", "");
            div.appendChild(p);
            document.querySelector('#user-list').appendChild(div);
            i++;
        })
    });
}

function toggleTheme() {
    document.querySelectorAll('*').forEach(el => el.classList.toggle('dark'));
    if (theme === "light") {
        editor.setTheme("ace/theme/tomorrow_night");
        theme = "dark";
    } else {
        editor.setTheme("ace/theme/textmate");
        theme = "light";
    }
}

// Generate initial user IDs
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Override default console.log and redirect logs to our console
(function () {
    var old = console.log;
    var logger = document.getElementById('log');
    console.log = function () {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == 'object') {
                logger.innerHTML += `
                    <div class="op">
                        <div class="carrot">
                            <span class="material-icons-outlined">
                                navigate_before
                            </span>
                        </div>
                        <pre class="output">${(JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i])}</pre>
                    </div>
                `;
            } else {
                logger.innerHTML += `
                    <div class="op">
                        <div class="carrot">
                            <span class="material-icons-outlined">
                                navigate_before
                            </span>
                        </div>
                        <pre class="output">${arguments[i]}</pre>
                    </div>
                `;
            }
            logger.scrollTop = logger.scrollHeight;
        }
    }
})();