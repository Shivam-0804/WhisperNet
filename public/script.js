const socket = io();
const messages = document.querySelector(".display_box");
const sendButton = document.querySelector(".send");
const messageInput = document.getElementById("message");
const contacts = document.querySelectorAll(".options");
const details = document.querySelector(".detail_box");
const addButton = document.getElementById("add");
const addSearch = document.getElementById("search");

let currentChat = null;
let receiverId = null;
let userId = null;
async function getSenderId() {
  try {
    const response = await axios.get("/api/user");
    return response.data.user._id;
  } catch (error) {
    console.error("Error fetching sender ID:", error);
    return null;
  }
}
const getUserId = async () => {
  return await getSenderId();
};

(async () => {
  userId = await getUserId();
  socket.emit("register", userId);
})();

socket.on("userStatus", (data) => {
  const online = document.getElementById("online");
  if (data.status === "online") {
    online.classList.remove("hide");
  } else if (data.status === "offline") {
    online.classList.add("hide");
  }
});

socket.on("connect", () => {
  console.log("Connected to Server");
});

socket.on("disconnect", () => {
  console.log("Disconneted from Server");
});

socket.on("message", async ({ message, senderId }) => {
  const messageElement = document.createElement("div");
  const userId = await getSenderId();
  if (userId === senderId) {
    messageElement.classList.add("msg_sent");
  } else {
    messageElement.classList.add("msg_received");
  }
  const messageDate = new Date(message.date);
  const date =
    messageDate.toLocaleString().split(" ")[1].slice(0, -3) +
    " " +
    messageDate.toLocaleString().split(" ")[2].toLowerCase();
  messageElement.innerHTML = `<div class="msg">${message.text}</div><div class="msg_time">${date} </div>`;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});

sendButton.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  const senderId = await getSenderId();

  if (message) {
    socket.emit("message", {
      text: message,
      chatId: currentChat,
      senderId: senderId,
      receiverId: receiverId,
    });
    messageInput.value = "";
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendButton.click();
  }
});

messageInput.addEventListener("input", () => {
  socket.emit("typing", { currentChat, receiverId });
  setTimeout(() => {
    socket.emit("stop-typing", { currentChat, receiverId });
  }, 3000);
});

socket.on("typing", ({ currentChat, currentId }) => {
  if (currentId === userId) {
    const typingElement = document.querySelector(".status");
    typingElement.innerHTML = `<div class="status">typing...</i></div>`;
    setTimeout(() => {
      typingElement.innerHTML = "";
    }, 3000);
  }
});

socket.on("stop-typing", ({ currentChat, currentId }) => {
  if (currentId === userId) {
    const typingElement = document.querySelector(".status");
    typingElement.innerHTML = "";
  }
});
function contactDetials() {
  contacts.forEach(async (element) => {
    element.addEventListener("click", async function (e) {
      e.preventDefault();
      const userId = await getSenderId();
      currentChat = element.attributes.chatId.value;
      receiverId = element.attributes.receiverId.value;
      socket.emit("register", receiverId);

      const d = await axios.post("/api/contactDetial", { id: receiverId });
      const imagePath = `/userImg/${d.data.user.user_name}.jpg`;
      const defaultImagePath = "/userImg/default.png";

      details.innerHTML = `<ul>
              <li id="back"><i class="fa-solid fa-arrow-left"></i></li>
              <li>
                <img src="${imagePath}" alt="" onerror="this.onerror=null; this.src='${defaultImagePath}'" />
              </li>
              <li>
                <div>${d.data.user.name}</div>
                <div class="status online"><i class="fa-solid fa-circle"></i>Online</div>
              </li>
            </ul>`;

      details.classList.remove("hide");

      const back = document.getElementById("back");
      back.addEventListener("click", function (e) {
        e.preventDefault();
        currentChat = null;
        receiverId = null;
        details.classList.add("hide");
        messages.innerHTML = "";
      });
      socket.emit("join", currentChat);
      socket.emit("history", { currentChat, userId, receiverId });
      socket.on("history", async (msg) => {
        messages.innerHTML = "";
        if (msg.data) {
          msg.data.forEach(async (message) => {
            const messageElement = document.createElement("div");
            if (userId === message.senderId) {
              messageElement.classList.add("msg_sent");
            } else {
              messageElement.classList.add("msg_received");
            }
            const messageDate = new Date(message.timestamp);
            const date =
              messageDate.toLocaleString().split(" ")[1].slice(0, -3) +
              " " +
              messageDate.toLocaleString().split(" ")[2].toLowerCase();
            messageElement.innerHTML = `<div class="msg">${message.message}</div><div class="msg_time">${date} </div>`;
            messages.appendChild(messageElement);
          });
          messages.scrollTop = messages.scrollHeight;
        }
      });
    });
  });
}

contactDetials();

addButton.addEventListener("click", async function (e) {
  e.preventDefault();
  const userName = addSearch.value.trim();
  if (userName) {
    const response = await axios.post("/api/addContact", {
      user_name: userName,
    });
    if (response.data.status === "success") {
      location.reload();
    }
  }
});

const home = document.getElementById("main_back");
home.addEventListener("click", function () {
  window.location.href = "/home";
});

const options = document.querySelectorAll(".options");

options.forEach((option) => {
  const menuItems = option.querySelectorAll(".menu");

  menuItems.forEach(async (menu) => {
    menu.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = option.querySelector(".dropdown");
      if (dropdown) {
        dropdown.classList.toggle("hide");
      }

      const chat = option.querySelector("#chat");
      const remove = option.querySelector("#remove");
      chat.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log("chat");
        openContactDetails(option);
        dropdown.classList.add("hide");
      });

      remove.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        let id = option.getAttribute("receiverId");
        const response = await axios.post("/api/removeContact", {
          contactId: id,
        });
        if (response.data.status === "success") {
          location.reload();
        }
      });

      options.forEach((opt) => {
        if (opt !== option) {
          const otherDropdown = opt.querySelector(".dropdown");
          if (otherDropdown) {
            otherDropdown.classList.add("hide");
          }
        }
      });
    });
  });
});

async function openContactDetails(option) {
  const userId = await getSenderId();
  currentChat = option.attributes.chatId.value;
  receiverId = option.attributes.receiverId.value;
  socket.emit("register", receiverId);

  const d = await axios.post("/api/contactDetial", { id: receiverId });
  const imagePath = `/userImg/${d.data.user.user_name}.jpg`;
  const defaultImagePath = "/userImg/default.png";

  details.innerHTML = `<ul>
          <li id="back"><i class="fa-solid fa-arrow-left"></i></li>
          <li>
            <img src="${imagePath}" alt="" onerror="this.onerror=null; this.src='${defaultImagePath}'" />
          </li>
          <li>
            <div>${d.data.user.name}</div>
            <div class="status online"><i class="fa-solid fa-circle"></i>Online</div>
          </li>
        </ul>`;

  details.classList.remove("hide");

  const back = document.getElementById("back");
  back.addEventListener("click", function (e) {
    e.preventDefault();
    currentChat = null;
    receiverId = null;
    details.classList.add("hide");
    messages.innerHTML = "";
  });
  socket.emit("join", currentChat);
  socket.emit("history", { currentChat, userId, receiverId });
  socket.on("history", async (msg) => {
    messages.innerHTML = "";
    if (msg.data) {
      msg.data.forEach(async (message) => {
        const messageElement = document.createElement("div");
        if (userId === message.senderId) {
          messageElement.classList.add("msg_sent");
        } else {
          messageElement.classList.add("msg_received");
        }
        const messageDate = new Date(message.timestamp);
        const date =
          messageDate.toLocaleString().split(" ")[1].slice(0, -3) +
          " " +
          messageDate.toLocaleString().split(" ")[2].toLowerCase();
        messageElement.innerHTML = `<div class="msg">${message.message}</div><div class="msg_time">${date} </div>`;
        messages.appendChild(messageElement);
      });
      messages.scrollTop = messages.scrollHeight;
    }
  });
}
