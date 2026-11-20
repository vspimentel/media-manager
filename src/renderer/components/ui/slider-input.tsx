import { useEffect, useState } from "react";
import { Slider } from "./slider";

const SliderInput = ({ value, min, max, onCommit }: { value: [number, number]; min: number; max: number; onCommit: (value: [number, number]) => void }) => {
    const [draft, setDraft] = useState<[number, number]>(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    return (
        <div className="space-y-3">
            <div className="flex justify-between text-xs text-white/55">
                <span>Year range</span>
                <span className="tabular-nums text-white/75">
                    {draft[0]} - {draft[1]}
                </span>
            </div>
            <Slider
                min={min} max={max} step={1}
                value={draft}
                onValueChange={(value) => { setDraft(value as [number, number]) }}
                onValueCommitted={(value) => { onCommit(value as [number, number]) }}
                className="**:data-[slot=slider-track]:bg-white/10 **:data-[slot=slider-range]:bg-cyan-200/65 **:data-[slot=slider-thumb]:border-cyan-100 **:data-[slot=slider-thumb]:bg-zinc-100"
            />
        </div>
    )
}

export default SliderInput;