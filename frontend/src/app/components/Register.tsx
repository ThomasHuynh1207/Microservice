import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Activity, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { register } from "../../services/authService";

export function Register() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    localStorage.removeItem("token");

    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      alert("Đăng ký thành công!");
      navigate("/onboarding");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Đăng ký thất bại! Email có thể đã tồn tại.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

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
              Đăng ký tài khoản
            </CardTitle>

            <p className="text-center text-gray-500 mt-2">
              Bắt đầu hành trình thay đổi cuộc sống của bạn
            </p>

          </CardHeader>

          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NAME */}

              <div>
                <Label htmlFor="name">Họ và tên</Label>

                <div className="relative mt-1">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <Input
                    id="name"
                    type="text"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                </div>
              </div>

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

                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 6 ký tự
                </p>

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <Label htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </Label>

                <div className="relative mt-1">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />

                </div>

              </div>

              {/* BUTTON */}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >

                {loading ? "Đang đăng ký..." : "Đăng ký miễn phí"}

              </Button>

            </form>

            <p className="text-center text-sm text-gray-600 mt-6">

              Đã có tài khoản?{" "}

              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >

                Đăng nhập ngay

              </Link>

            </p>

          </CardContent>

        </Card>

      </div>
    </div>
  );
}