import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <div>
          <h1 className="mt-64 text-white text-8xl p-4 mt-24 relative">Pictoblitz</h1>

          <div className="absolute top-10 right-5 justify-center">
            <div className="flex flex-row gap-10">
              <button className="p-4 bg-cyan-600 text-white">Login</button>
              <button className="p-4 last:bg-cyan-600 text-white">Profile</button>
            </div>

          </div>

          <div className="flex flex-col mt-20 gap-10 justify-center items-center">
            <button className="p-4 w-fit h-[50px] bg-cyan-600 text-white text-xl">Play</button>
            <button className="p-4 w-fit h-[50px] bg-cyan-600 text-white text-xl">Create Room</button>
          </div>





        </div>
    </div>
  );
}
