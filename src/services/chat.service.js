import axios from "axios";

const baseURL = "http://localhost:8080/api/v1";

/** Non-streaming fallback */
export const sendMessageToServer = async (message, conversationId) => {
    const response = await axios.post(`${baseURL}/chatsupport`, message, {
        headers: {
            "Content-Type": "application/json",
            ConversationId: conversationId,
        },
    });
    return response.data;
};

/**
 * Streaming version — uses the Spring AI /stream endpoint (text/event-stream / SSE).
 * Calls onChunk(token) for every SSE data line received.
 *
 * @param {string} message      - user message text
 * @param {string} conversationId - unique conversation UUID
 * @param {function} onChunk    - called with each token string from the stream
 * @returns {Promise<void>}
 */
export const streamMessageFromServer = async (message, conversationId, onChunk) => {
    const response = await fetch(`${baseURL}/chatsupport/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ConversationId": conversationId,
            "Accept": "text/event-stream",
        },
        body: JSON.stringify(message),
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from the buffer
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (line.startsWith("data:")) {
                // Strip the "data:" prefix and any leading space
                const token = line.slice(5); // "data:" is 5 chars
                if (token !== "[DONE]") {
                    onChunk(token);
                }
            }
            // Ignore empty lines and "event:" lines
        }
    }

    // Flush any remaining buffer content
    if (buffer.startsWith("data:")) {
        const token = buffer.slice(5);
        if (token && token !== "[DONE]") {
            onChunk(token);
        }
    }
};