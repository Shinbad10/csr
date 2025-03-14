import db from "../config/knex.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (Username, Password, Remember) => {
  // Kiểm tra người dùng có tồn tại không
  const user = await db("NhanVien").where({ Username }).first();
  if (!user || !(await bcrypt.compare(Password, user.Password))) {
    return { success: false, message: "Tài khoản hoặc mật khẩu không đúng!" };
  }
  // Lấy danh sách quyền của nhân viên
  const permissions = await db("ChucNangNhanVien")
    .where({ MaNV: user.MaNV })
    .join("ChucNang", "ChucNangNhanVien.MaChucNang", "=", "ChucNang.MaChucNang")
    .select("ChucNangNhanVien.*", "ChucNang.TenChucNang");

  delete user.Password; // Xóa password trước khi gửi về client

  // Tạo payload cho JWT
  const payload = { user, permissions };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: !Remember ? "4h" : "3d",
  });

  return { success: true, accessToken: token };
};
