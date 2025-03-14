import bcrypt from "bcryptjs";
import { employeeService } from "../services/index.js";

export const fetchEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getEmployees();
    const permissions = await employeeService.getPermissions();
    res.json({employees,permissions});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const fetchPermissions = async (req, res) => {
  try {
    const result = await employeeService.getPermissions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Thêm nhân viên + Lưu chức năng nhân viên
export const insertEmployee = async (req, res) => {
  try {
    const { employee, permissions } = req.body; // Lấy thông tin nhân viên và danh sách mã chức năng

    const saltRounds = 10; // Định số lần băm
    const hashedPassword = bcrypt.hashSync(employee.Password, saltRounds); 

    const newEmployee = {
      ...employee,
      Password: hashedPassword, // Gán mật khẩu đã mã hóa
    };
    await employeeService.insertEmployee(newEmployee);
    if (permissions && permissions.length > 0) {
      const functionData = permissions.map((maChucNang) => ({
        MaNV: employee.MaNV,
        MaChucNang: maChucNang,
      }));
      await employeeService.assignFunctions(employee.MaNV, functionData);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateEmployee = async (req, res) => {
  try {
    let employee = req.body; // Lấy dữ liệu từ request

    // Nếu có danh sách quyền, cập nhật chức năng
    if (employee.Permissions) {
      await employeeService.assignFunctions(employee.MaNV, employee.Permissions);
      delete employee.Permissions; // Xóa khỏi object trước khi update
    }

    // Nếu có mật khẩu mới, băm mật khẩu trước khi lưu
    if (employee.Password) {
      const saltRounds = 10;
      employee.Password = await bcrypt.hash(employee.Password, saltRounds);
    }

    // Cập nhật thông tin nhân viên
    await employeeService.updateEmployee(employee.MaNV, employee);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Xóa nhân viên
export const deleteEmployee = async (req, res) => {
  try {
    const rows = req.body
    await employeeService.deleteFunctions(rows.data);
    await employeeService.deleteEmployee(rows.data);
    res.status(200).json({ success: true});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
