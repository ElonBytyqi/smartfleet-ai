"use client";

import { useEffect, useState } from "react";

export function ZuluClock() {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-[13px] tabular-nums">
      {time}
    </span>
  );
}


// "use client";

// import { useEffect, useState } from "react";

// export function ZuluClock() {
//   const [time, setTime] = useState<string>("--:--:--");

//   useEffect(() => {
//     const tick = () =>
//       setTime(new Date().toISOString().slice(11, 19));
//     tick();
//     const id = setInterval(tick, 1000);
//     return () => clearInterval(id);
//   }, []);

//   return (
//     <span className="font-mono text-[13px] tabular-nums">
//       {time}
//       <span className="ml-1 text-muted-foreground">Z</span>
//     </span>
//   );
// }