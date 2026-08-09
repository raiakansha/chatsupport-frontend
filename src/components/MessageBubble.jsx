import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * MessageBubble — renders a single chat message.
 * Bot messages use ReactMarkdown so that Anaya's structured responses
 * (ticket details, bullet lists, bold text, code) render properly.
 */
export const MessageBubble = ({ author, at, children }) => {
    const isUser = author === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isUser
                        ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white"
                        : "bg-muted text-foreground"
                }`}
            >
                {isUser ? (
                    /* User message — plain text */
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                        {children}
                    </p>
                ) : (
                    /* Bot message — rendered Markdown */
                    <div className="markdown-body text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {children}
                        </ReactMarkdown>
                    </div>
                )}
                <div
                    className={`mt-1 text-[10px] ${
                        isUser ? "text-white/60 text-right" : "text-muted-foreground"
                    }`}
                >
                    {at}
                </div>
            </div>
        </div>
    );
};
