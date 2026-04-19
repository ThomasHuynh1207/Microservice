import { Link } from "react-router";
import { Activity, Apple, Calendar, Bot, TrendingUp, Users, Award, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FitLife Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="http://localhost:3001">
              <Button variant="outline">Admin</Button>
            </a>
            <Link to="/login">
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Dùng thử miễn phí
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            🎉 Trợ lý fitness AI thông minh nhất Việt Nam
          </span>
        </div>
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Biến đổi cơ thể,{" "}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Thay đổi cuộc sống
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Kế hoạch tập luyện & dinh dưỡng được cá nhân hóa hoàn toàn với sự hỗ trợ của AI. 
          Theo dõi tiến độ, nhận động lực và đạt được mục tiêu của bạn.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg">
              Bắt đầu miễn phí
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              Xem demo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
          <div>
            <p className="text-4xl font-bold text-blue-600">50K+</p>
            <p className="text-gray-600 mt-1">Người dùng</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-purple-600">1M+</p>
            <p className="text-gray-600 mt-1">Bài tập</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-pink-600">95%</p>
            <p className="text-gray-600 mt-1">Hài lòng</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Tính năng nổi bật</h2>
          <p className="text-xl text-gray-600">Mọi thứ bạn cần để đạt được mục tiêu fitness</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Theo dõi vận động</h3>
              <p className="text-gray-600">
                Ghi nhận mọi hoạt động: chạy bộ, gym, yoga và hơn thế nữa. Theo dõi calories và tiến độ.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Apple className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dinh dưỡng thông minh</h3>
              <p className="text-gray-600">
                Tính toán calories, protein, carbs và fat. Gợi ý khẩu phần ăn phù hợp với mục tiêu.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lập thực đơn tự động</h3>
              <p className="text-gray-600">
                AI tạo thực đơn cá nhân hóa theo mục tiêu: giảm cân, tăng cơ hoặc duy trì.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-pink-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Coach AI</h3>
              <p className="text-gray-600">
                Chatbot thông minh hỗ trợ 24/7, tư vấn kế hoạch tập và động lực.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Tại sao chọn FitLife Pro?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg mt-1">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Kế hoạch cá nhân hóa 100%</h3>
                    <p className="text-gray-600">
                      AI phân tích thông tin của bạn để tạo kế hoạch phù hợp nhất, không giống ai.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-2 rounded-lg mt-1">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Cộng đồng hỗ trợ</h3>
                    <p className="text-gray-600">
                      Kết nối với hàng ngàn người cùng hành trình, chia sẻ kinh nghiệm và động lực.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg mt-1">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Kết quả được chứng minh</h3>
                    <p className="text-gray-600">
                      95% người dùng đạt mục tiêu trong vòng 3 tháng với sự kiên trì.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-semibold">Hoạt động hôm nay</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Bước chân</span>
                    <span className="font-bold text-blue-600">8,945 / 10,000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Calories đốt</span>
                    <span className="font-bold text-orange-600">465 / 750</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Thời gian tập</span>
                    <span className="font-bold text-purple-600">45 phút</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng bắt đầu chưa?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia cùng 50,000+ người đang thay đổi cuộc sống của họ
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
              Đăng ký miễn phí ngay
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-blue-100 mt-4">Không cần thẻ tín dụng • Hủy bất cứ lúc nào</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">FitLife Pro</span>
              </div>
              <p className="text-sm">
                Trợ lý fitness & dinh dưỡng AI thông minh nhất Việt Nam
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Tính năng</a></li>
                <li><a href="#" className="hover:text-white">Giá cả</a></li>
                <li><a href="#" className="hover:text-white">Ứng dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Công ty</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 FitLife Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
