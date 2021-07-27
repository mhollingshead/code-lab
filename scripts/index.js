let firepadRef, editor, sessionId, theme = "light";
let firepadWrapper, firepadElement, users, con, log, drag;

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
    editor.setOption("showPrintMargin", false);
    editor.setOption("wrap", true);

    // Display proper instance id
    _('#code-id').innerText = '#' + sessionId;

    // Init new firepad from ace editor
    const firepad = Firepad.fromACE(firepadRef, editor);
    // Remove watermark
    document.querySelector('.powered-by-firepad').remove();

    // Post-render settings / event listeners
    firepad.on('ready', () => {
        // Set new user id until changed
        const id = "User " + makeId(6);
        _("#username").value = id;
        firepad.setUserId(id);

        // Set initial editor height;
        initDraggableHeight();

        // Toggle light and dark theme styles
        _('#theme-toggle').addEventListener('click', () => {
            if (theme === "light") {
                editor.setTheme("ace/theme/tomorrow_night");
                theme = "dark";
            } else {
                editor.setTheme("ace/theme/textmate");
                theme = "light";
            }
            document.querySelectorAll('*').forEach(el => el.classList.toggle('dark'));
        })

        // Change display name
        _("#user-change").addEventListener('submit', e => {
            e.preventDefault();
            const name = e.target.username.value;
            if (name) firepad.setUserId(name);
        });
        _('#code-id').addEventListener('click', () => {
            // Add temporary element to body
            const tmp = document.createElement('input');
            tmp.value = window.location.href;
            document.body.appendChild(tmp);

            // Select + copy it, then remove it
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);

            // Handle aria label
            const idArea = _("#code-id");
            idArea.ariaLabel = "Copied to clipboard!";
            const revertAriaLabel = () => idArea.ariaLabel = "Copy sharable link";
            idArea.addEventListener('mouseout', () => setTimeout(revertAriaLabel, 500));
        });
        // Hijack the console
        _('#eval').addEventListener('click', () => {
            try {
                // Evaluate code
                eval(editor.getValue());
            } catch(e) {
                // Handle errors
                logError(e.message);
            }
        });
        // Clear console
        _('#clear').addEventListener('click', () => {
            _('#log').innerHTML = "";
        });
    })

    // Display active user list when users are updated
    firepadRef.child('users').on('value', users => {
        _('#user-list').innerHTML = "";
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
            _('#user-list').appendChild(div);
            i++;
        })
    });
}

// Connect to the propper database
function getExampleRef() {
    var ref = firebase.database().ref();
    var hash = window.location.hash.replace(/#/g, '-');
    if (hash) {
        // If db specified in url exists, connect to it
        ref = ref.child(hash);
        sessionId = ref.key.substr(1);
    } else {
        // Else generate new location.
        ref = ref.push();
        // add it as a hash to the URL.
        window.location = window.location + '#' + ref.key.substr(1); 
        sessionId = ref.key.substr(1);
    }
    return ref;
}

// Override default console.log and redirect logs to our pseudo console
legacy = console.log;
(function () {
    const logger = _('#log');
    console.log = function () {
        for (let i = 0; i < arguments.length; i++) {
            legacy(arguments[i]);
            // If its an object, stringify
            const pre = document.createElement('pre')
            pre.classList.add('output');
            pre.id = `log_${document.querySelectorAll('.output').length}`;
            pre.innerHTML = formatLogItem(arguments[i]);
            logger.innerHTML += `
                <div class="op">
                    <div class="carrot">
                        <span class="m-i">
                            navigate_before
                        </span>
                    </div>
                    ${pre.outerHTML}
                </div>
            `;
            if (theme === "dark") {
                document.querySelectorAll(`#${pre.id} *`).forEach(child => {
                    child.classList.toggle('dark');
                })
            }
            // Scroll to bottom of the console on new logs
            logger.scrollTop = logger.scrollHeight;
        }
    }
})()

// Log errors to console with necessary styling
function logError(e) {
    const logger = _('#log');
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

function formatLogItem(arg, depth) {
    depth = depth || 0;
    if (arg === undefined) {
        // undefined -> string
        return `<span class='hljs-ind'>undefined</span>`;
    } else if (arg === null) {
        // null -> string
        return `<span class='hljs-ind'>null</span>`;
    } else if (arg instanceof Date || arg instanceof Promise || arg instanceof Response) {
        // object instance -> string
        return String(arg);
    }
    else if (arg instanceof Element || arg instanceof HTMLDocument) {
        // html -> highlight
        return hljs.highlight(arg.outerHTML, {language: 'html'}).value;
    } else if (typeof arg === 'object') {
        // Recursive formatting for arrays and objects
        if (Array.isArray(arg)) {
            if (arg.length === 0) return `<span class='hljs-info'>(0)</span> <span class='hljs-ind'>[]</span>`;
            // Render 4 elements: the dropdown link, the array length, the single-line display
            // of the array, and the expanded version of the array. Clicking the dropdown link
            // toggles which display is visible.
            return `<span onclick='expandArr(this)' class='expand'>arrow_right</span><span class='hljs-info'>(${arg.length})</span> [<span>${
                arg.reduce((res, obj, ind) => {
                    // Call formatLogItem for each item in the array (with increased depth)
                    return res+`${formatLogItem(obj, depth + 1)}${ind === (arg.length-1) ? ']</span>' : ', '}`;
                }, "")
            }<span style='display: none'>\n${
                arg.reduce((res, obj, ind) => {
                    // Call formatLogItem for each item in the array (with increased depth)
                    return res+`${'  '.repeat(depth+1)}<span class='hljs-ind'>${ind}</span>: ${formatLogItem(obj, depth + 1)}${ind === (arg.length-1) ? '\n' : ',\n'}`;
                }, "")
            }${'  '.repeat(depth)}]</span>`;
        } else {
            if (Object.keys(arg).length === 0) return `<span class='hljs-ind'>{}</span>`
            // Render 3 elements: the dropdown link, the single-line display of the object, and
            // the expanded version of the object. Clicking the dropdown link toggles which 
            // display is visible.
            return `<span onclick='expandObj(this)' class='expand'>arrow_right</span>{<span>${
                Object.values(arg).reduce((res, val, ind, arr) => {
                    // Call formatLogItem for each key/value pair in the object (with increased
                    // depth)
                    return res+`<span class='hljs-ind'>${Object.keys(arg)[ind]}</span>: ${formatLogItem(val, depth + 1)}${ind === (arr.length-1) ? '}' : ', '}`;
                }, "")
            }</span><span style='display: none'>\n${
                Object.values(arg).reduce((res, val, ind, arr) => {
                    // Call formatLogItem for each key/value pair in the object (with increased
                    // depth)
                    return res+`${'  '.repeat(depth+1)}<span class='hljs-ind'>${Object.keys(arg)[ind]}</span>: ${formatLogItem(val, depth + 1)}${ind === (arr.length-1) ? '\n' : ',\n'}`;
                }, "")
            }${'  '.repeat(depth)}}</span>`;
        }
    } else if (typeof arg === 'function') {
        // function -> string -> format object keys -> highlight
        return hljs.highlight(arg.toString().replace(/"+\w+":/g, match => match.replace(/\w+/g, "$&").replaceAll('"', "")), {language: 'javascript'}).value;
    } else {
        // highlight strings within objects
        if (depth > 0 && typeof arg === 'string') return hljs.highlight(`"${arg.toString()}"`, {language: 'javascript'}).value;
        // value -> highlight booleans / numbers
        return (typeof arg == 'boolean' || typeof arg == 'number') ? hljs.highlight(arg.toString(), {language: 'javascript'}).value : arg;
    }
}

function expandArr(e) {
    const minifiedArr = e.nextSibling.nextSibling.nextSibling;
    const expandedArr = e.nextSibling.nextSibling.nextSibling.nextSibling;
    minifiedArr.style.display = "none";
    expandedArr.style.display = "inline";
    e.innerText = 'arrow_drop_down';
    e.onclick = () => minimizeArr(e, minifiedArr, expandedArr);
}
function minimizeArr(e, minifiedArr, expandedArr) {
    minifiedArr.style.display = "inline";
    expandedArr.style.display = "none";
    e.innerText = 'arrow_right';
    e.onclick = () => expandArr(e);
}
function expandObj(e) {
    const minifiedObj = e.nextSibling.nextSibling;
    const expandedObj = e.nextSibling.nextSibling.nextSibling;
    minifiedObj.style.display = "none";
    expandedObj.style.display = "inline";
    e.innerText = 'arrow_drop_down';
    e.onclick = () => minimizeObj(e, minifiedObj, expandedObj);
}
function minimizeObj(e, minifiedObj, expandedObj) {
    minifiedObj.style.display = "inline";
    expandedObj.style.display = "none";
    e.innerText = 'arrow_right';
    e.onclick = () => expandObj(e);
}

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

function _(query) {
    return document.querySelector(query);
}

const handleMouseMove = e => {
    e.preventDefault();
    if (e.clientY < window.innerHeight - 47 && e.clientY > 150) {
        const calculatedHeight = window.innerHeight - e.clientY;
        con.style.height = `${calculatedHeight}px`;
        firepadElement.style.height = `calc(100vh - (75px + ${calculatedHeight}px))`;
        firepadWrapper.style.height = `calc(100vh - (75px + ${calculatedHeight}px))`;
        users.style.height = `calc(100vh - (75px + ${calculatedHeight}px))`;
        log.style.height = `calc(${calculatedHeight}px - 47px)`;
        editor.resize();
    }
}

function initDraggableHeight() {
    firepadWrapper = document.querySelector('.firepad');
    firepadElement = document.querySelector('#firepad');
    users = document.querySelector('#users');
    drag = document.querySelector('#drag');
    con = document.querySelector('#console');
    log = document.querySelector('#log');
    firepadElement.style.height = `${window.innerHeight - 375}px`;
    firepadWrapper.style.height = `${window.innerHeight - 375}px`;
    drag.addEventListener('mousedown', () => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', handleMouseMove);
        })
    });
}