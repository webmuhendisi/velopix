import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate?: Date | null;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) {
      // Default: 12 hours
      setTimeLeft({ hours: 12, minutes: 0, seconds: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: "Saat", value: timeLeft.hours },
    { label: "Dakika", value: timeLeft.minutes },
    { label: "Saniye", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <span className="text-xs md:text-sm font-bold text-primary">Kalan Süre:</span>
      <div className="flex items-center gap-1 md:gap-2">
        {timeUnits.map((unit, idx) => (
          <motion.div key={unit.label} className="flex items-center gap-1 md:gap-2">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg px-2 md:px-3 py-1 min-w-[3rem] md:min-w-[3.5rem]">
              <span className="text-sm md:text-base font-bold text-primary">
                {String(unit.value).padStart(2, "0")}
              </span>
            </div>
            {idx < timeUnits.length - 1 && (
              <span className="text-primary font-bold">:</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
