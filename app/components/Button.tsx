const Button = ({
  children,
  onClick,
  isActive,
  activeColor = "#9177f6",
}: any) => (
  <button
    onClick={onClick}
    className="relative w-12 h-12 flex items-center justify-center group transition-all duration-300 ease-out hover:scale-115 active:scale-90"
  >
    {/* Аура (Glass Aura) — тепер реагує на hover */}
    <div
      className={`absolute w-10 h-10 rounded-full backdrop-blur-[2px] border transition-all duration-300
        ${
          isActive
            ? "bg-white/10 border-white/30 shadow-[0_0_15px_rgba(145,119,246,0.3)]"
            : "bg-white/5 border-white/10 opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
        } 
        group-hover:bg-white/20 group-hover:border-white/40 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
    />

    {/* Внутрішня кулька — додаємо яскравість на ховері */}
    <div
      className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_2px_5px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] 
        ${
          isActive
            ? "scale-105"
            : "grayscale-[0.5] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
        }
      `}
      style={{
        backgroundImage: isActive
          ? `radial-gradient(circle at 35% 35%, #9177f6 0%, ${activeColor} 100%)`
          : "radial-gradient(circle at 35% 35%, #4a4458 0%, #1a162b 100%)",
        color: isActive ? "white" : "rgba(255,255,255,0.4)",
      }}
    >
      {/* Контейнер для іконки, щоб вона теж підсвічувалася */}
      <div
        className={`transition-colors duration-300 ${
          !isActive && "group-hover:text-white"
        }`}
      >
        {children}
      </div>
    </div>
  </button>
);

export default Button;
