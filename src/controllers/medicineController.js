import { medicineService } from "../services/index.js";

export const fetchMedicines = async (req, res) => {
  try {
    const result = await medicineService.getMedicines();
    res.json( result );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const insertMedicine = async (req, res) => {
  const rows = req.body
  try {
    await medicineService.insertMedicine(rows);
     res.status(200).json({ success: true});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updateMedicine = async (req, res) => {
  const updatedData  = req.body;
  try {
    await medicineService.updateMedicine(updatedData.MaThuoc, updatedData);
     res.status(200).json({ success: true});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  const rows = req.body
  try {
    await medicineService.deleteMedicine(rows.data);
     res.status(200).json({ success: true});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
