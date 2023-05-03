

var roomKey = '';

let headersList = {
  Accept: "*/*",
  "User-Agent": "Thunder Client (https://www.thunderclient.com)",
  "Content-Type": "application/json",
  "x-api-key": "VwTZ4AGTxme9snANex9tep3NwvVMGfYd",
};

let bodyContent = JSON.stringify({
  title: "Huddle0Test",
  hostWallets: ["0x0C1Ed6059E09C63Ed0D9f0Bd918e13AEF5820Fde"],
});

async function CreateRoom() {
  let response = await fetch(
    "https://iriko.testing.huddle01.com/api/v1/create-room",
    {
      method: "POST",
      body: bodyContent,
      headers: headersList,
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
        //RoomKey = data
        roomKey = JSON.stringify(data.data.roomId)
       // console.log(JSON.stringify(data.data.roomId))
    })
    .catch((err) => {
      console.error(err);
    });

  return roomKey
}

export { CreateRoom };
