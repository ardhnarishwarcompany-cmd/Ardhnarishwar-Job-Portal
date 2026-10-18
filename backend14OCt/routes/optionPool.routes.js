import express from "express";
import { getAllOptions, upsertOptions, deleteOption } from "../controllers/optionPool.controller.js";

const router = express.Router();

router.get("/", getAllOptions);
router.post("/", upsertOptions);
router.post("/upsert", upsertOptions);
router.delete("/", deleteOption);

export default router;
