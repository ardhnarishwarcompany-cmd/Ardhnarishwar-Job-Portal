import connection from "../utils/db.js";

const query = (sql, params = []) => connection.promise().query(sql, params);

/**
 * Fetch all options grouped by category: { [category]: string[] }
 */
export const getAllOptions = async (req, res) => {
  try {
    const [rows] = await query("SELECT category, value FROM option_pool ORDER BY value ASC");
    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      if (!grouped[row.category].includes(row.value)) {
        grouped[row.category].push(row.value);
      }
    });
    return res.status(200).json({
      success: true,
      options: grouped,
    });
  } catch (error) {
    console.error("Error fetching options from pool:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch option pool",
      error: error.message,
    });
  }
};

/**
 * Bulk upsert entries into option_pool
 * Accepts body: { items: [ { category, value } ] } or { category: 'categoryName', values: ['val1', 'val2'] }
 */
export const upsertOptions = async (req, res) => {
  try {
    const { items, category, values } = req.body;
    const toInsert = [];

    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item.category && item.value && typeof item.value === "string" && item.value.trim()) {
          toInsert.push({ category: item.category, value: item.value.trim() });
        }
      });
    }

    if (category && Array.isArray(values)) {
      values.forEach((v) => {
        if (typeof v === "string" && v.trim()) {
          toInsert.push({ category, value: v.trim() });
        }
      });
    }

    if (toInsert.length === 0) {
      return res.status(200).json({ success: true, message: "No valid options to insert" });
    }

    for (const item of toInsert) {
      const norm = item.value.toLowerCase();
      await query(
        "INSERT IGNORE INTO option_pool (category, value, normalized_value) VALUES (?, ?, ?)",
        [item.category, item.value, norm]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Options upserted successfully",
    });
  } catch (error) {
    console.error("Error upserting option pool items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upsert option pool items",
      error: error.message,
    });
  }
};

/**
 * Delete option from option_pool
 */
export const deleteOption = async (req, res) => {
  try {
    const category = req.body.category || req.query.category;
    const value = req.body.value || req.query.value;

    if (!category || !value) {
      return res.status(400).json({
        success: false,
        message: "Category and value are required to delete an option",
      });
    }

    const norm = String(value).trim().toLowerCase();
    await query("DELETE FROM option_pool WHERE category = ? AND (normalized_value = ? OR value = ?)", [
      category,
      norm,
      String(value).trim(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Option deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting option from pool:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete option",
      error: error.message,
    });
  }
};

/**
 * Helper function for backend controllers to save field entries upon submit
 */
export const saveFieldValuesToPool = async (fieldMap) => {
  try {
    // fieldMap example: { country: 'India', skills: ['React', 'Node'], jobTitle: 'Software Engineer' }
    for (const [category, rawVal] of Object.entries(fieldMap)) {
      if (!rawVal) continue;
      const valList = Array.isArray(rawVal)
        ? rawVal
        : typeof rawVal === "string" && rawVal.includes(",") && ["skills", "language", "languages"].includes(category)
        ? rawVal.split(",").map((s) => s.trim())
        : [rawVal];

      for (const val of valList) {
        if (typeof val === "string" && val.trim() && val.trim() !== "Add Manually") {
          const trimmed = val.trim();
          const norm = trimmed.toLowerCase();
          await query(
            "INSERT IGNORE INTO option_pool (category, value, normalized_value) VALUES (?, ?, ?)",
            [category, trimmed, norm]
          );
        }
      }
    }
  } catch (err) {
    console.error("Error in saveFieldValuesToPool helper:", err.message);
  }
};
