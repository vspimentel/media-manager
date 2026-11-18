import { Button } from "#components/ui/button";
import { Clapperboard, Minus, Square, X, Copy, Film } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

const WindowTitlebar = () => {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        window.electron.windowIsMaximized().then(setIsMaximized).catch(() => setIsMaximized(false));
    }, []);

    const toggleMaximize = async () => {
        const maximized = await window.electron.windowToggleMaximize();
        setIsMaximized(maximized);
    };

    return (
        <header className="relative z-100 flex h-10 shrink-0 items-center border-b border-white/[0.07] bg-zinc-950/85 px-3 text-white/65 shadow-sm backdrop-blur-xl" style={{ WebkitAppRegion: "drag" } as CSSProperties}>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-md border border-cyan-200/15 bg-cyan-200/8 text-cyan-100/75">
                    <Film size={13} />
                </div>
                <span className="truncate text-[11px] font-medium tracking-wide text-white/60">
                    FRAME <span className="ml-1 font-normal text-white/30">Media manager</span>
                </span>
            </div>
            <div className="flex h-full items-center" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Minimize window" title="Minimize" onClick={() => window.electron.windowMinimize()} className="h-full w-11 rounded-none text-white/50 hover:bg-white/10 hover:text-white">
                    <Minus size={14} />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={isMaximized ? "Restore window" : "Maximize window"} title={isMaximized ? "Restore" : "Maximize"} onClick={toggleMaximize} className="h-full w-11 rounded-none text-white/50 hover:bg-white/10 hover:text-white">
                    {isMaximized ? <Copy size={12} /> : <Square size={12} />}
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Close window" title="Close" onClick={() => window.electron.windowClose()} className="h-full w-12 rounded-none text-white/50 hover:bg-rose-500/20 hover:text-rose-100">
                    <X size={15} />
                </Button>
            </div>
        </header>
    );
};

export default WindowTitlebar;
