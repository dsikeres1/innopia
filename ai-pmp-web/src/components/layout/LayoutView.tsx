import { PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { blockModel } from "../../../ex/block";
import { TabBar } from "./TabBar";
import { Footer } from "./Footer";

export function LayoutView(props: PropsWithChildren) {
  return (
    <div className="text-white">

      <div className="fixed inset-0 z-0 w-screen h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/bg-cinema.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 h-screen overflow-y-scroll scrollbar-hide bg-transparent backdrop-blur-sm">
        <TabBar />
        <main className="max-w-[1920px] mx-auto px-6 py-8">
          {props.children}
        </main>
        <Footer />
      </div>

      <BlockView />
    </div>
  );
}

const BlockView = observer(() => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        pointerEvents: blockModel.locked ? "auto" : "none",
        opacity: blockModel.locked ? 1 : 0,
        transition: "opacity 300ms 100ms",
      }}
      className="flex justify-center items-center bg-black/60 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
});