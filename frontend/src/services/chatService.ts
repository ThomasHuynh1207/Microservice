import api from "../api/api";

export const sendChatMessage = async (message: string): Promise<string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để sử dụng chat AI.");
  }

  const res = await api.post("/chat", { message });
  return res.data as string;
};
