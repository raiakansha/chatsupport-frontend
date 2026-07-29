import { Bot } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";


const ChatHome = () => {
  const navigate = useNavigate();

  const handleChatStartClick = () => {
    
    navigate("/chat");
  }

  return <div className="h-screen w-screen flex flex-col justify-center items-center gap-4">
    <Bot size={80} />
    <h1 className="text-4xl font-bold">Welcome to Chat Support</h1>
    <Button onClick={handleChatStartClick}  className={'cursor-pointer'} variant="outline">Start here</Button>
  </div>;
};

export default ChatHome;
