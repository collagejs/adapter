import "./style.css";
import App from "./App.vue";
import { buildPiece } from "./buildPiece.ts";
import { mountPiece } from "@collagejs/core";

const piece = buildPiece(App, {
    props: {
        msg: "Hello, world!",
    },
});

const greetingLines = [
    "Welcome to CollageJS with Vue!",
    "App.vue is mounted by CollageJS",
    "You can update the message after mounting",
    "Hello, world!",
];

let currentLineIndex = 0;

// const target = document.getElementById("app")!.attachShadow({ mode: "open" });
const target = document.getElementById("app")!;

const mountedPiece = await mountPiece(
    piece,
    target,
);
setInterval(() => {
    mountedPiece.update({ msg: greetingLines[currentLineIndex] });
    currentLineIndex = (currentLineIndex + 1) % greetingLines.length;
}, 4000);
