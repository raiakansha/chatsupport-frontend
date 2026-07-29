import axios from "axios";

const baseURl = "http://localhost:8080/api/v1";

export const sendMessageToServer = async (messages, conversationId) => {
    const response = await axios.post(`${baseURl}/chatsupport`, messages, {
        headers: {
            ConversationId: conversationId,
        },
    });

    return response.data;
}