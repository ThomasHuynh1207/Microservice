import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { sendChatMessage } from "../../services/chatService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const coachResponses: { [key: string]: string } = {
  default: "Xin chào! Tôi là trợ lý fitness AI của bạn. Tôi có thể giúp bạn với kế hoạch tập luyện, dinh dưỡng, và động lực. Bạn cần hỗ trợ gì hôm nay?",
  
  motivation: "💪 Bạn đang làm rất tốt! Hãy nhớ rằng mỗi bước nhỏ đều đưa bạn đến gần hơn với mục tiêu. Sự kiên trì là chìa khóa thành công. Keep going!",
  
  workout: "🏋️ Tôi khuyên bạn nên kết hợp cả cardio và strength training. Ví dụ:\n\n• Thứ 2, 4, 6: Tập tạ (ngực, lưng, chân)\n• Thứ 3, 5, 7: Cardio 30 phút (chạy bộ, đạp xe)\n• Chủ nhật: Nghỉ ngơi\n\nBạn muốn chi tiết hơn về phần nào?",
  
  diet: "🥗 Để đạt mục tiêu, hãy tập trung vào:\n\n• Protein: 1.6-2.2g/kg cân nặng\n• Carbs phức hợp: yến mạch, gạo lứt, khoai lang\n• Chất béo lành mạnh: cá hồi, bơ, hạt\n• Uống đủ nước: 2-3 lít/ngày\n\nBạn có câu hỏi cụ thể về dinh dưỡng không?",
  
  calories: "🔥 Dựa trên thông tin của bạn, tôi ước tính:\n\n• TDEE (Total Daily Energy Expenditure): ~2200 kcal\n• Giảm cân: 1700-1900 kcal/ngày\n• Duy trì: 2100-2300 kcal/ngày\n• Tăng cân: 2500-2700 kcal/ngày\n\nBạn muốn điều chỉnh gì không?",
  
  tired: "😴 Cảm thấy mệt mỏi là dấu hiệu cơ thể cần nghỉ ngơi. Hãy:\n\n• Ngủ đủ 7-9 tiếng mỗi đêm\n• Giảm cường độ tập xuống 50-60%\n• Bổ sung thêm protein và nước\n• Xem xét có một ngày rest day\n\nSức khỏe là ưu tiên số 1!",
  
  cardio: "🏃 Cardio tốt cho tim mạch và đốt cháy calories. Một số gợi ý:\n\n• LISS (Low Intensity): Đi bộ 30-60 phút\n• MISS (Medium): Chạy bộ nhẹ 20-30 phút\n• HIIT (High Intensity): Sprint 20 giây, nghỉ 40 giây x 10-15 lượt\n\nBắt đầu từ từ và tăng dần nhé!",
  
  protein: "🍗 Protein rất quan trọng cho cơ bắp! Nguồn protein tốt:\n\n• Động vật: Gà, cá hồi, trứng, sữa\n• Thực vật: Đậu, đậu phụ, tempeh, quinoa\n• Bổ sung: Whey protein, plant protein\n\nNhớ phân bổ đều protein qua các bữa ăn!",
  
  beginner: "👋 Chào mừng bạn đến với hành trình fitness! Lời khuyên cho người mới:\n\n• Bắt đầu từ 2-3 buổi/tuần\n• Tập đúng tư thế quan trọng hơn tập nặng\n• Khởi động 5-10 phút trước khi tập\n• Nghỉ ngơi đầy đủ giữa các buổi\n\nBạn có kinh nghiệm tập gì chưa?",
};

export function FitnessCoach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: coachResponses.default,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("động lực") || lowerMessage.includes("motivation")) {
      return coachResponses.motivation;
    } else if (lowerMessage.includes("tập") || lowerMessage.includes("workout") || lowerMessage.includes("luyện")) {
      return coachResponses.workout;
    } else if (lowerMessage.includes("ăn") || lowerMessage.includes("diet") || lowerMessage.includes("dinh dưỡng")) {
      return coachResponses.diet;
    } else if (lowerMessage.includes("calorie") || lowerMessage.includes("calo")) {
      return coachResponses.calories;
    } else if (lowerMessage.includes("mệt") || lowerMessage.includes("tired") || lowerMessage.includes("nghỉ")) {
      return coachResponses.tired;
    } else if (lowerMessage.includes("cardio") || lowerMessage.includes("chạy")) {
      return coachResponses.cardio;
    } else if (lowerMessage.includes("protein") || lowerMessage.includes("đạm")) {
      return coachResponses.protein;
    } else if (lowerMessage.includes("mới") || lowerMessage.includes("beginner") || lowerMessage.includes("bắt đầu")) {
      return coachResponses.beginner;
    } else {
      return "Tôi hiểu bạn đang quan tâm đến vấn đề này! Bạn có thể hỏi tôi về:\n\n• Kế hoạch tập luyện\n• Dinh dưỡng & calories\n• Động lực và mindset\n• Protein và chế độ ăn\n• Cardio và tập thể lực\n\nBạn muốn biết về chủ đề nào?";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const aiResponse = await sendChatMessage(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const fallbackMessage = error instanceof Error && error.message
        ? error.message
        : getResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const quickQuestions = [
    "Tôi cần động lực",
    "Kế hoạch tập cho người mới",
    "Nên ăn gì để giảm cân?",
    "Tập cardio hay tạ?",
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Fitness Coach AI
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Trợ lý fitness & dinh dưỡng thông minh
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-full h-fit">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === "user" ? "text-blue-200" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {message.role === "user" && (
                <div className="bg-blue-600 p-2 rounded-full h-fit">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Câu hỏi gợi ý:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(question);
                  }}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
