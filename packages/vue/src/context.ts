import type { MountPiece } from "@collagejs/core";
import type { InjectionKey } from "vue";

export const mountPieceContextKey = Symbol() as InjectionKey<MountPiece>;
