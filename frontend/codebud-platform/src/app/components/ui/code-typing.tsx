"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

/* ── CodeTyping ───────────────────────────────────────────────────── */
/* Embeddable typewriter with syntax-highlighted code snippets        */

const codeSnippets = [
    {
        label: "React Component",
        lines: [
            { text: "function ", cls: "text-blue-400" },
            { text: "Welcome", cls: "text-yellow-400" },
            { text: "()", cls: "text-white/70" },
            { text: " {", cls: "text-white/70" },
            { text: "", cls: "", newLine: true },
            { text: "  return ", cls: "text-purple-400" },
            { text: "(", cls: "text-white/70" },
            { text: "", cls: "", newLine: true },
            { text: '    <', cls: "text-white/40" },
            { text: "div", cls: "text-rose-400" },
            { text: ' className="app"', cls: "text-emerald-300" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "      <", cls: "text-white/40" },
            { text: "h1", cls: "text-rose-400" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "        Hello, ", cls: "text-emerald-300" },
            { text: "MYCODEBUD", cls: "text-yellow-400 font-bold" },
            { text: " 🐝", cls: "text-white" },
            { text: "", cls: "", newLine: true },
            { text: "      </", cls: "text-white/40" },
            { text: "h1", cls: "text-rose-400" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "      <", cls: "text-white/40" },
            { text: "Button", cls: "text-blue-400" },
            { text: ' variant="brand"', cls: "text-emerald-300" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "        Start Learning", cls: "text-emerald-300" },
            { text: "", cls: "", newLine: true },
            { text: "      </", cls: "text-white/40" },
            { text: "Button", cls: "text-blue-400" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "    </", cls: "text-white/40" },
            { text: "div", cls: "text-rose-400" },
            { text: ">", cls: "text-white/40" },
            { text: "", cls: "", newLine: true },
            { text: "  )", cls: "text-white/70" },
            { text: "", cls: "", newLine: true },
            { text: "}", cls: "text-white/70" },
        ],
    },
    {
        label: "Python API",
        lines: [
            { text: "from ", cls: "text-purple-400" },
            { text: "mycodebud ", cls: "text-yellow-400" },
            { text: "import ", cls: "text-purple-400" },
            { text: "learn, ai", cls: "text-blue-400" },
            { text: "", cls: "", newLine: true },
            { text: "", cls: "", newLine: true },
            { text: "# Initialize your learning path", cls: "text-white/25" },
            { text: "", cls: "", newLine: true },
            { text: "student ", cls: "text-white/80" },
            { text: "= ", cls: "text-white/50" },
            { text: "learn", cls: "text-blue-400" },
            { text: ".", cls: "text-white/50" },
            { text: "create", cls: "text-yellow-400" },
            { text: "(", cls: "text-white/50" },
            { text: "", cls: "", newLine: true },
            { text: '  path', cls: "text-rose-400" },
            { text: "=", cls: "text-white/50" },
            { text: '"full-stack"', cls: "text-emerald-300" },
            { text: ",", cls: "text-white/50" },
            { text: "", cls: "", newLine: true },
            { text: "  pace", cls: "text-rose-400" },
            { text: "=", cls: "text-white/50" },
            { text: '"adaptive"', cls: "text-emerald-300" },
            { text: ",", cls: "text-white/50" },
            { text: "", cls: "", newLine: true },
            { text: "  mentor", cls: "text-rose-400" },
            { text: "=", cls: "text-white/50" },
            { text: "ai", cls: "text-blue-400" },
            { text: ".", cls: "text-white/50" },
            { text: "MyCodeBuddy", cls: "text-yellow-400" },
            { text: "()", cls: "text-white/50" },
            { text: "", cls: "", newLine: true },
            { text: ")", cls: "text-white/50" },
            { text: "", cls: "", newLine: true },
            { text: "", cls: "", newLine: true },
            { text: "student", cls: "text-white/80" },
            { text: ".", cls: "text-white/50" },
            { text: "start", cls: "text-yellow-400" },
            { text: "()", cls: "text-white/50" },
            { text: "  ", cls: "text-white/50" },
            { text: "# → Level up! 🚀", cls: "text-white/25" },
        ],
    },
];

interface CodeToken {
    text: string;
    cls: string;
    newLine?: boolean;
}

export function CodeTyping() {
    const [snippetIdx, setSnippetIdx] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const snippet = codeSnippets[snippetIdx];

    const totalChars = snippet.lines.reduce(
        (sum, tok) => sum + (tok.newLine ? 1 : tok.text.length),
        0,
    );

    useEffect(() => {
        if (!isTyping) return;

        intervalRef.current = setInterval(() => {
            setCharCount((c) => {
                if (c >= totalChars) {
                    setIsTyping(false);
                    setTimeout(() => {
                        setSnippetIdx((i) => (i + 1) % codeSnippets.length);
                        setCharCount(0);
                        setIsTyping(true);
                    }, 3000);
                    return c;
                }
                return c + 1;
            });
        }, 40);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isTyping, totalChars]);

    // Render tokens up to charCount
    let rendered = 0;
    const lines: React.ReactNode[][] = [[]];

    for (const token of snippet.lines) {
        if (token.newLine) {
            rendered++;
            if (rendered <= charCount) {
                lines.push([]);
            } else {
                break;
            }
            continue;
        }

        const remaining = charCount - rendered;
        if (remaining <= 0) break;

        const visibleLen = Math.min(token.text.length, remaining);
        const visibleText = token.text.slice(0, visibleLen);
        rendered += token.text.length;

        lines[lines.length - 1].push(
            <span key={`${rendered}-${token.text}`} className={token.cls}>
                {visibleText}
            </span>,
        );
    }

    return (
        <div className="p-4 sm:p-5 font-mono text-[11px] sm:text-[13px] leading-5 sm:leading-6 min-h-[220px] sm:min-h-[260px]">
            {lines.map((lineTokens, i) => (
                <div key={i} className="flex">
                    <span className="text-white/15 w-5 sm:w-7 text-right mr-3 sm:mr-4 select-none text-[10px] sm:text-[11px]">
                        {i + 1}
                    </span>
                    <span>
                        {lineTokens}
                        {i === lines.length - 1 && isTyping && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    ease: "easeInOut",
                                }}
                                className="inline-block w-[7px] h-[14px] sm:h-[16px] bg-yellow-400 ml-px translate-y-[2px]"
                            />
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}
