"use client";

import { useState } from "react";

type Layout = "alphanum" | "qwerty" | "alpha";

interface VirtualKeyboardProps {
  layout: Layout;
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
}

const NUMBERS = "1234567890".split("");
const ROW_TOP = "QWERTYUIOP".split("");
const ROW_MID = "ASDFGHJKL".split("");
const ROW_BOT = "ZXCVBNM".split("");

export default function VirtualKeyboard({
  layout,
  value,
  onChange,
  maxLength = 64,
}: VirtualKeyboardProps) {
  const isQwerty = layout === "qwerty";
  const isAlpha = layout === "alpha";
  const [shift, setShift] = useState(isQwerty || isAlpha);

  function press(ch: string) {
    if (value.length >= maxLength) return;
    const out = (isQwerty || isAlpha) && !shift ? ch.toLowerCase() : ch.toUpperCase();
    onChange(value + out);
    if (isQwerty && shift) setShift(false);
  }

  function back()  { onChange(value.slice(0, -1)); }
  function clear() { onChange(""); }
  function space() { if (value.length < maxLength) onChange(value + " "); }

  const stop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      className="w-full mx-auto flex flex-col gap-1.5 p-3 rounded-2xl select-none"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {(layout === "alphanum" || layout === "qwerty") && (
        <KeyRow>
          {NUMBERS.map((ch) => (
            <Key key={ch} label={ch} onPress={() => press(ch)} stop={stop} />
          ))}
        </KeyRow>
      )}
      <KeyRow>
        {ROW_TOP.map((ch) => (
          <Key key={ch} label={(isQwerty || isAlpha) && !shift ? ch.toLowerCase() : ch} onPress={() => press(ch)} stop={stop} />
        ))}
      </KeyRow>
      <KeyRow>
        {ROW_MID.map((ch) => (
          <Key key={ch} label={(isQwerty || isAlpha) && !shift ? ch.toLowerCase() : ch} onPress={() => press(ch)} stop={stop} />
        ))}
      </KeyRow>
      <KeyRow>
        {(isQwerty || isAlpha) && (
          <Key label="⇧" wide active={shift} onPress={() => setShift((s) => !s)} stop={stop} />
        )}
        {ROW_BOT.map((ch) => (
          <Key key={ch} label={(isQwerty || isAlpha) && !shift ? ch.toLowerCase() : ch} onPress={() => press(ch)} stop={stop} />
        ))}
        <Key label="⌫" wide onPress={back} stop={stop} />
      </KeyRow>
      <KeyRow>
        {(isQwerty || isAlpha) && <Key label="space" flex onPress={space} stop={stop} />}
        <Key label="Clear" wide danger onPress={clear} stop={stop} />
      </KeyRow>
    </div>
  );
}

function KeyRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5 justify-center">{children}</div>;
}

interface KeyProps {
  label: React.ReactNode;
  onPress: () => void;
  stop: (e: React.MouseEvent) => void;
  wide?: boolean;
  flex?: boolean;
  danger?: boolean;
  active?: boolean;
}

function Key({ label, onPress, stop, wide, flex, danger, active }: KeyProps) {
  return (
    <button
      type="button"
      onMouseDown={stop}
      onClick={onPress}
      className="rounded-xl font-bold text-lg active:scale-95 transition-transform"
      style={{
        background: active ? "#EB0A1E" : "var(--bg)",
        color: active ? "#fff" : danger ? "#f59e0b" : "var(--text)",
        border: `1px solid ${active ? "#EB0A1E" : "var(--border)"}`,
        height: "3.25rem",
        minWidth: "2.75rem",
        width: flex ? undefined : wide ? "5rem" : undefined,
        flex: flex ? 1 : "1 1 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {label}
    </button>
  );
}
