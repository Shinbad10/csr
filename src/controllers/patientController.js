import { patientService } from "../services/index.js";

export const fetchPatients = async (req, res) => {
  try {
    const result = await patientService.getPatients();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const fetchPatientsbyCampaign = async (req, res) => {
  const {MaDotKham} = req.params
  try {
    const patients = await patientService.getPatientsByCampaign(MaDotKham);
    res.status(200).json({ success: true
      , patients:patients
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
