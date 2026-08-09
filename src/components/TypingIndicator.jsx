import React from "react";

/**
 * TypingIndicator — animated three-dot bounce shown while the AI is streaming.
 */
const TypingIndicator = () => {
    return (
        <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3 shadow-sm">
                <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="typing-dot" style={{ animationDelay: "160ms" }} />
                <span className="typing-dot" style={{ animationDelay: "320ms" }} />
            </div>
        </div>
    );
};

export default TypingIndicator;
