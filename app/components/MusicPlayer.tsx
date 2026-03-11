"use client";
import { useEffect, useRef, useState } from "react";
import tracks from "../../public/data/tracks.json";
import Button from "./Button";

const MusicPlayer = () => {
  const lineRefs = useRef<Array<SVGPathElement | null>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const currentTrack = tracks[currentTrackIndex];

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!analyzerRef.current) setupAudio();
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (index: number) => {
    let nextIndex = index;

    if (isShuffle) {
      let randomIndex = Math.floor(Math.random() * tracks.length);
      if (randomIndex === currentTrackIndex && tracks.length > 1) {
        randomIndex = (randomIndex + 1) % tracks.length;
      }
      nextIndex = randomIndex;
    }

    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }, 150);
  };

  const setupAudio = () => {
    if (analyzerRef.current || !audioRef.current) return;
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
      analyzerRef.current = analyzer;
    } catch (e) {
      console.error(e);
    }
  };

  const getOrganicPath = (
    baseY: number,
    amp: number,
    phase: number,
    comp: number
  ) => {
    const points = 8;
    const step = 1440 / points;
    const coords = [];
    for (let i = 0; i <= points; i++) {
      const x = i * step;
      const wave1 = Math.sin(phase + i * 0.8) * amp;
      const wave2 = Math.sin(phase * 1.2 + i * comp) * (amp * 0.3);
      coords.push({ x, y: baseY + wave1 + wave2 });
    }
    let d = `M 0 ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const cpX = (coords[i].x + coords[i + 1].x) / 2;
      d += ` C ${cpX} ${coords[i].y}, ${cpX} ${coords[i + 1].y}, ${
        coords[i + 1].x
      } ${coords[i + 1].y}`;
    }
    return d + ` L 1440 1000 L 0 1000 Z`;
  };

  useEffect(() => {
    let phase = 0;
    const update = () => {
      phase += 0.01;
      let bass = 0;
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        bass = (dataArray[0] + dataArray[1]) / 2;
      }
      const layers = [
        { y: 300, amp: 120, comp: 0.6 },
        { y: 450, amp: 160, comp: 0.9 },
        { y: 600, amp: 140, comp: 0.7 },
        { y: 750, amp: 100, comp: 1.2 },
      ];
      lineRefs.current.forEach((line, i) => {
        if (line)
          line.setAttribute(
            "d",
            getOrganicPath(
              layers[i].y,
              layers[i].amp + bass * 0.35,
              phase + i * 0.5,
              layers[i].comp
            )
          );
      });
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
    return () =>
      animationFrameRef.current
        ? cancelAnimationFrame(animationFrameRef.current)
        : undefined;
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0A0518] overflow-hidden flex items-center justify-center">
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => {
          if (isRepeat) {
            audioRef.current!.currentTime = 0;
            audioRef.current!.play();
          } else {
            changeTrack((currentTrackIndex + 1) % tracks.length);
          }
        }}
      />

      <div className="relative w-full max-w-100 md:max-w-none md:w-auto flex flex-col items-center">
        <div
          className="relative z-20 w-full md:w-200 flex flex-col md:flex-row backdrop-blur-3xl rounded-4xl md:rounded-[40px] shadow-2xl overflow-hidden translate-y-6 md:translate-y-16"
          style={{
            border: "0.5px solid hsla(0, 0%, 100%, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="w-full md:w-1/2 p-6 md:p-8 flex items-center justify-center md:aspect-square bg-[rgb(222,221,227,0.3)] md:bg-[rgb(222,221,227,0.5)] overflow-hidden">
            <img
              src={currentTrack.cover}
              className="w-full h-auto max-w-50 md:max-w-none rounded-2xl shadow-2xl object-contain transition-transform duration-500 hover:scale-105"
              alt={currentTrack.title}
            />
          </div>
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col gap-2 md:gap-6 justify-center text-center md:text-left backdrop-blur-md">
            <span className="text-[#B9AEE6] text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
              Now Playing
            </span>
            <h2 className="text-[#B9AEE6] text-xl md:text-3xl font-bold tracking-tight truncate">
              {currentTrack.title}
            </h2>
            <p className="text-[#B9AEE6] text-sm md:text-lg font-medium opacity-80">
              {currentTrack.artist}
            </p>
          </div>
        </div>
        <div
          className="relative z-10 w-full pt-12 md:pt-28 px-6 md:px-12 pb-8 md:pb-12 flex flex-col backdrop-blur-2xl rounded-4xl md:rounded-[60px] shadow-2xl border border-white/10"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
        >
          <div className="absolute inset-0 hidden md:flex pointer-events-none">
            <div className="w-1/2 h-full bg-[rgb(222,221,227,0.5)] rounded-l-4xl md:rounded-l-[60px]" />
            <div className="w-1/2 h-full" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 md:gap-10">
            <div className="w-full px-2 mt-4 md:mt-6">
              <div
                className="relative w-full h-2 cursor-pointer rounded-full bg-[#1a162b] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
                onClick={handleProgressChange}
              >
                <div
                  className="absolute h-full rounded-full bg-linear-to-r from-[#5d24d6] to-[#a855f7]"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    boxShadow: "0 0 15px rgba(126, 116, 237, 0.6)",
                  }}
                >
                  <div className="group absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                    <div className="absolute w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-full backdrop-blur-[2px] border border-white/10 shadow-[0_0_20px_rgba(145,119,246,0.15)] transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(145,119,246,0.4)]" />

                    <div className="absolute w-4 h-4 bg-black/40 rounded-full blur-sm translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className="relative w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(145,119,246,0.8),inset_0_1px_2px_rgba(255,255,255,1)]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 35% 35%, #9177f6 0%, #9177f6 50%, #3e269f 100%)",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-[#B9AEE6] mt-3 opacity-50 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:mt-6">
              <div className="flex items-center justify-center gap-6 md:order-2">
                <Button
                  onClick={() =>
                    changeTrack(
                      (currentTrackIndex - 1 + tracks.length) % tracks.length
                    )
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="rotate-180"
                  >
                    <path d="M7 6v12l10-6z" />
                  </svg>
                </Button>

                <button
                  onClick={togglePlay}
                  className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center group transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <div className="absolute w-[90%] h-[90%] bg-white/5 rounded-full backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 group-hover:bg-white/15 group-hover:border-white/30 group-hover:shadow-[0_0_25px_rgba(145,119,246,0.2)]" />
                  <div
                    className="relative w-[70%] h-[70%] rounded-full flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.4)] transition-all duration-300 group-hover:shadow-[0_8px_25px_rgba(145,119,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.5)]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 35% 35%, #9177f6 0%, #3e269f 100%)",
                    }}
                  >
                    {isPlaying ? (
                      <svg
                        width="28"
                        height="28"
                        className="text-white md:w-7.5 md:h-7.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg
                        width="28"
                        height="28"
                        className="text-white md:w-7.5 md:h-7.5 translate-x-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </button>

                <Button
                  onClick={() =>
                    changeTrack((currentTrackIndex + 1) % tracks.length)
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 6v12l10-6z" />
                  </svg>
                </Button>
              </div>
              <div className="hidden md:flex items-center justify-start gap-8 w-1/3 order-1 opacity-80">
                <Button
                  onClick={() => setIsShuffle(!isShuffle)}
                  isActive={isShuffle}
                  activeColor="#5d24d6"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setIsRepeat(!isRepeat)}
                  isActive={isRepeat}
                  activeColor="#5d24d6"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                  </svg>
                </Button>
              </div>
              <div className="hidden md:flex items-center justify-end gap-8 w-1/3 order-3 opacity-80">
                <Button>
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1v8l7-4z" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setIsLiked(!isLiked)}
                  isActive={isLiked}
                  activeColor="#ec4899"
                >
                  <svg
                    width="18"
                    height="18"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </Button>
              </div>
              <div className="flex md:hidden items-center justify-between px-2 mt-2 opacity-80">
                <Button
                  onClick={() => setIsShuffle(!isShuffle)}
                  isActive={isShuffle}
                  activeColor="#5d24d6"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setIsRepeat(!isRepeat)}
                  isActive={isRepeat}
                  activeColor="#5d24d6"
                >
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                  </svg>
                </Button>
                <Button>
                  <svg
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1v8l7-4z" />
                  </svg>
                </Button>
                <Button
                  onClick={() => setIsLiked(!isLiked)}
                  isActive={isLiked}
                  activeColor="#ec4899"
                >
                  <svg
                    width="18"
                    height="18"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="absolute z-10 bottom-0 left-1/3 text-white/30">
        Educational demo: Music and content used for functionality showcase
        only.
      </p>
      <div className="absolute inset-0 z-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 1000"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2D1160" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C026D3" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.3" />
            </linearGradient>
            <filter id="cleanGlow">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <g filter="url(#cleanGlow)" className="mix-blend-screen">
            <path
              ref={(el) => {
                lineRefs.current[0] = el;
              }}
              fill="url(#grad1)"
            />
            <path
              ref={(el) => {
                lineRefs.current[1] = el;
              }}
              fill="url(#grad2)"
              opacity="0.7"
            />
            <path
              ref={(el) => {
                lineRefs.current[2] = el;
              }}
              fill="#4F46E5"
              opacity="0.4"
            />
            <path
              ref={(el) => {
                lineRefs.current[3] = el;
              }}
              fill="#1E1B4B"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MusicPlayer;
