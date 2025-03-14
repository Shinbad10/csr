import { authService } from "../services/index.js";

export const login = async (req, res) => {
  try {
    const { Username, Password, Remember } = req.body;
    const response = await authService.login(Username, Password, Remember);
    res.json(response);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
