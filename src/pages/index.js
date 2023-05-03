import React, { useEffect, useState, useRef } from "react";

import { useEventListener, useHuddle01 } from "@huddle01/react";
import { Audio, Video } from "@huddle01/react/components";

import { CreateRoom } from "../handler/CreateRoom";
import Image from "next/image";
/* Uncomment to see the Xstate Inspector */
// import { Inspect } from '@huddle01/react/components';

import {
  useAudio,
  useLobby,
  useMeetingMachine,
  usePeers,
  useRoom,
  useVideo,
} from "@huddle01/react/hooks";

import Button from "../components/Button";

//appwrite
import { Client, Databases, ID, Query } from "appwrite";

export default function Home() {
  // function sleep(ms) {
  //   return new Promise((resolve) => setTimeout(resolve, ms));
  // }

  // console.log(JSON.stringify(CreateRoom()))
  function getRoomID() {
    CreateRoom().then((res) => {
      console.log(res.slice(1, -1));
      //setRoomId(res)
      return res;
    });
  }

  //console.log(getRoomID());

  const videoRef = useRef(null);

  const { state, send } = useMeetingMachine();
  // Event Listner

  useEventListener("lobby:joined", () => {
    setRenderState(3);
    if (fetchVideoStream.isCallable) {
      fetchVideoStream();
    }
  });

  useEventListener("lobby:cam-on", () => {
    if (state.context.camStream && videoRef.current)
      videoRef.current.srcObject = state.context.camStream;

    if (fetchAudioStream.isCallable) {
      fetchAudioStream();
    }
  });

  useEventListener("lobby:mic-on", async () => {
    if (joinRoom.isCallable) {
      joinRoom();
    }
  });

  useEventListener("room:peer-left", async () => {
    console.log(">>>>>>>...  USER LEFT >>>>>>>>>>");
  });

  // useEventListener("room:joined", async () => {
  //   await sleep(2000);
  //   if(produceAudio.isCallable){
  //     produceAudio();
  //   }
  //   if(produceVideo.isCallable){
  //     produceVideo();
  //   }
  // })

  const { initialize, isInitialized } = useHuddle01();
  const { joinLobby } = useLobby();
  const {
    fetchAudioStream,
    produceAudio,
    stopAudioStream,
    stopProducingAudio,
    stream: micStream,
  } = useAudio();
  const {
    fetchVideoStream,
    produceVideo,
    stopVideoStream,
    stopProducingVideo,
    stream: camStream,
  } = useVideo();
  const { joinRoom, leaveRoom, isRoomJoined } = useRoom();

  const { peers, peerIds } = usePeers();

  // Ui states
  const [renderState, setRenderState] = useState(0); // 0: Room, 1: Finder , 2: Joining, 3: VideoCall
  const [findStatus, setFindStatus] = useState("Finding your Match");
  const [roomId, setRoomId] = useState("");

  const [primaryColor, setPrimaryColor] = useState("#004e92");
  const [secondaryColor, setSecondaryColor] = useState("#002c5b");

  //appwrite
  const client = new Client();
  client
    .setEndpoint("https://mixnmatch.fun/v1")
    .setProject("642aac578c4ef4b7389f");
  const databases = new Databases(client);
  const handleFind = async () => {
    setRenderState(1);
    const promise = databases.listDocuments(
      "642aad97d74cda71a59f",
      "642aada1ecbcf2abe8cd",
      [Query.equal("status", true), Query.limit(1)]
    );

    promise.then(
      function (response) {
        console.log(response); // Success
        if (response.documents.length > 0) {
          const room = response.documents[0].$id;
          databases.updateDocument(
            "642aad97d74cda71a59f",
            "642aada1ecbcf2abe8cd",
            room,
            {
              status: false,
            }
          );
          setRoomId(room);
          setRenderState(2);
        } else {
          CreateRoom().then((res) => {
            const createRoom = databases.createDocument(
              "642aad97d74cda71a59f",
              "642aada1ecbcf2abe8cd",
              res.slice(1, -1),
              {
                status: true,
              }
            );
            createRoom.then(
              function (response) {
                console.log("Room Created  " + response.$id); // Success
                setFindStatus(
                  "Hold tight..! Waiting more Paticipants to come online"
                );
                setRoomId(response.$id);
                const subscribe = client.subscribe(
                  [
                    "databases.642aad97d74cda71a59f.collections.642aada1ecbcf2abe8cd.documents." +
                      response.$id,
                  ],
                  (response) => {
                    console.log("subscribed ---> " + response);
                    setRenderState(2);
                    subscribe();
                  }
                );
              },
              function (error) {
                console.log(error); // Failure
                setRenderState(0);
              }
            );
            return res;
          });
        }
      },
      function (error) {
        console.log(error); // Failure
        setRenderState(0);
      }
    );
  };

  const handleJoin = async () => {
    if (state.matches("Idle")) {
      initialize("KL1r3E1yHfcrRbXsT4mcE-3mK60Yc3YR");
      console.log("->>>>>****>>>>>>>    initialized");
    }
    if (joinLobby.isCallable) {
      joinLobby(roomId);
      console.log("->>>>>****>>>>>>>    joinedLobby");
    }
  };

  function revealFace() {
    if (produceAudio.isCallable) {
      produceAudio(micStream);
    }

    if (produceAudio.isCallable) {
      produceVideo(camStream);
    }
  }
  function exitRoom() {
    if (leaveRoom.isCallable) {
      leaveRoom();
      setRenderState(0)
    }
  }

  function Skip() {
    if (leaveRoom.isCallable) {
      leaveRoom();
      handleFind();
    }
  }
  //////////////// Render Components ////////////////
  const renderRoom = () => {
    return (
      <div className="flex justify-center text-3xl items-center h-screen">
        <center>
          <Button onClick={handleFind}>Find Strangers</Button>
        </center>
      </div>
    );
  };
  const renderFinder = () => {
    return (
      <div className="flex justify-center text-3xl items-center h-screen text-white">
        <center>
          <h1>{findStatus}</h1>
        </center>
      </div>
    );
  };
  const renderJoining = () => {
    handleJoin();
    return (
      <div className="flex justify-center text-3xl items-center h-screen text-white">
        <center>
          <h1>Got a Match, Joining...</h1>
        </center>
      </div>
    );
  };

  const renderVideoCall = () => {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="fixed top-0 right-0">
          <button onClick={exitRoom} className="bg-red-500 text-white text-2xl px-6 py-2 rounded-lg">
            x
          </button>
        </div>
        {/* 
        <div>
          <Button
            disabled={!state.matches("Idle")}
            onClick={() => initialize("KL1r3E1yHfcrRbXsT4mcE-3mK60Yc3YR")}
          >
            INIT
          </Button>

          <br />
          <br />
          <h2 className="text-3xl text-red-500 font-extrabold">Initialized</h2>
          <Button
            disabled={!joinLobby.isCallable}
            onClick={() => {
              joinLobby("yxe-nnje-htc");
            }}
          >
            JOIN_LOBBY
          </Button>

          <br />
          <h2 className="text-3xl text-green-600 font-extrabold">Room</h2>
          <div className="flex gap-4 flex-wrap">
            <Button
              disabled={!produceAudio.isCallable}
              onClick={() => produceAudio(micStream)}
            >
              PRODUCE_MIC
            </Button>

            <Button
              disabled={!produceVideo.isCallable}
              onClick={() => produceVideo(camStream)}
            >
              PRODUCE_CAM
            </Button>

            <Button
              disabled={!stopProducingAudio.isCallable}
              onClick={() => stopProducingAudio()}
            >
              STOP_PRODUCING_MIC
            </Button>

            <Button
              disabled={!stopProducingVideo.isCallable}
              onClick={() => stopProducingVideo()}
            >
              STOP_PRODUCING_CAM
            </Button>

            <Button disabled={!leaveRoom.isCallable} onClick={leaveRoom}>
              LEAVE_ROOM
            </Button>
          </div>
        </div> */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="pr-8 pb-1 pl-8  md:pl-16 mx-auto ">
            <div className="relative">
              <video
                className="md:h-96 w-full h-56  object-cover border-yellow-500 border-double border-4 rounded-2xl"
                ref={videoRef}
                autoPlay
                muted
              ></video>
              {produceVideo.isCallable && (
                <div className="absolute top-0 left-0 md:h-96 h-56 w-full backdrop-filter backdrop-blur-md flex items-center justify-center flex-col">
                  {/* <div className="text-white text-xl mb-4">
                    
                  </div> */}
                  <button
                    onClick={revealFace}
                    className="bg-yellow-500 text-black px-4 py-2 rounded"
                  >
                    Reveal Face
                  </button>
                </div>
              )}
            </div>
            {/* <div class="inline-block bg-yellow-500 rounded-xl py-1 px-4 -mt-32 -mr-8">
              <div class="text-white text-md font-extrabold">
                Trust Score :{" "}
              </div>
            </div> */}
          </div>
          <div className="text-right pr-8 pb-1 pl-8  md:pr-16  mx-auto ">
            <div className="relative">
              {peers[peerIds[0]] && peers[peerIds[0]].cam && (
                <>
                  <Video
                    className="md:h-96 w-full h-56  object-cover border-yellow-500 border-double border-4 rounded-2xl"
                    peerId={peerIds[0]}
                    track={peers[peerIds[0]].cam}
                  ></Video>
                  {/* <div class="inline-block bg-yellow-500 rounded-xl py-1 px-4 -mt-8 -ml-8">
                    <div class="text-white text-md font-extrabold">
                      Trust Score :{" "}
                    </div>
                  </div> */}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4">
            {Object.values(peers)
              .filter((peer) => peer.mic)
              .map((peer) => (
                <Audio
                  key={peer.peerId}
                  peerId={peer.peerId}
                  track={peer.mic}
                />
              ))}
          </div>
        </div>
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <button onClick={Skip} className="bg-red-500 font-extrabold text-white px-4 py-2 rounded-lg">
            Skip &gt;&gt;&gt;{" "}
          </button>
        </div>
      </div>
    );
  };

  const renderSwitch = (states) => {
    switch (states) {
      case 0:
        return renderRoom();
      case 1:
        return renderFinder();
      case 2:
        return renderJoining();
      case 3:
        return renderVideoCall();
      default:
        return renderRoom();
    }
  };

  useEffect(() => {
    console.log(peerIds.length);
  }, [peerIds]);

  return (
    <>
      <div class="fixed top-0 left-0">
        <div className="p-4" >
          <Image
          className="rounded-2xl"
            src="/Whoisthis.jpg"
            alt="alt text"
            width={150}
            height={50}
          />
        </div> 
      </div>
      {renderSwitch(renderState)}
    </>
  );
}
