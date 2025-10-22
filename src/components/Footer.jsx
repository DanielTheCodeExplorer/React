import { useState, useEffect } from "react";

function Footer() {

	const [mode, setMode] = useState("Grand Scheme")

	useEffect(() => {
		const saved = localStorage.getItem("viewMode");
		if (saved) setMode(saved)
	}, [])

	useEffect(() => {
		localStorage.setItem("viewMode", mode);
	}, [mode])

	const btnBase = "border border-[#2b325e] rounded-full px-3 min-w-[180px] flex items-center justify-center";
	const active = "bg-[#2b325e] text-white";
	const inactive = "bg-transparent";

  return (
    <footer className='bg-[#151934] py-3 flex justify-between text-[#cbd1f6]'>
        {/* Left section */}
        <ul className="flex flex-col items-center w-1/2 gap-2">
          
			<li className="text-center mt-2">VIEW MODE</li>

			<li className="flex gap-2 mt-2">

				<ul>
					<li>
						<button
						onClick={() => setMode('Grand Scheme')}
						aria-pressed={mode==="Grand Scheme"}
						className={`${btnBase} ${mode==='Grand Scheme' ? active : inactive}`}>
							Grand Scheme
						</button>
					</li>

					<li>
						<button
						onClick={() => setMode('Nigeria Focus')}
						aria-pressed={mode==="Grand Scheme"}
						className={`${btnBase} ${mode==='Nigeria Focus' ? active : inactive}`}>
						Nigeria Focus
						</button>
					</li>
				</ul>
			</li>
        </ul>

        {/* Right section */}
		<div className="flex flex-col gap-2 w-1/2 ml-10">

			<span className="text-center mt-2">FILTER</span>

			<div className="flex flex-wrap gap-2 justify-center">
				<button className="border border-[#2b325e] rounded-full flex items-center min-w-[180px] px-4 justify-center hover:bg-[#2b325e] transition">
				Fiber Optic Cables
				</button>
				<button className="border border-[#2b325e] rounded-full flex items-center min-w-[180px] px-4 justify-center hover:bg-[#2b325e] transition">
				Cellular Towers
				</button>
				<button className="border border-[#2b325e] rounded-full flex items-center min-w-[180px] px-4 justify-center hover:bg-[#2b325e] transition">
				Radio Waves
				</button>
				<button className="border border-[#2b325e] rounded-full flex items-center min-w-[180px] px-4 justify-center hover:bg-[#2b325e] transition">
				Copper Cables
				</button>
			</div>
		</div>
    </footer>
  );
}

export default Footer;
