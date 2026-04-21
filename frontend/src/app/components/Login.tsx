import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Activity, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { login, resolveInitialRouteAfterLogin } from "../../services/authService";

export function Login() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      const initialRoute = await resolveInitialRouteAfterLogin(user.id);
      navigate(initialRoute);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message
        || (status === 401 || status === 403
          ? "Email hoặc mật khẩu không đúng hoặc tài khoản đã bị xóa!"
          : status === 502 || status === 503 || status === 504
            ? "Hệ thống đang khởi động lại, vui lòng thử lại sau vài giây."
            : err?.message
              || "Đăng nhập thất bại, vui lòng thử lại sau vài giây." );
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}

        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FitLife Pro
          </h1>

        </Link>

        <Card className="shadow-2xl border-none">

          <CardHeader>

            <CardTitle className="text-2xl text-center">
              Đăng nhập
            </CardTitle>

            <p className="text-center text-gray-500 mt-2">
              Chào mừng trở lại! Hãy tiếp tục hành trình của bạn.
            </p>

          </CardHeader>

          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}

              <div>

                <Label htmlFor="email">Email</Label>

                <div className="relative mt-1">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <Label htmlFor="password">Mật khẩu</Label>

                <div className="relative mt-1">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >

                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}

                  </button>

                </div>

              </div>

              {/* REMEMBER */}

              <div className="flex items-center justify-between text-sm">

                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-600">Ghi nhớ đăng nhập</span>
                </label>

                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Quên mật khẩu?
                </a>

              </div>

              {/* LOGIN BUTTON */}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >

                {loading ? "Đang đăng nhập..." : "Đăng nhập"}

              </Button>

            </form>

            {/* REGISTER LINK */}

            <p className="text-center text-sm text-gray-600 mt-6">

              Chưa có tài khoản?{" "}

              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >

                Đăng ký ngay

              </Link>

            </p>

          </CardContent>

        </Card>

      </div>
    </div>
  );
}