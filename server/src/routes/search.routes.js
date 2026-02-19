import { globalSearch } from "../controllers/search.controller.js";
import protect from "../middlewares/auth.middleware.js";
import express from "express";

const router = express.Router();

router.use(protect);

router.get("/", globalSearch);

export default router;
