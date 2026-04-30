import express from "express";
import {
  createMenu,
  getMenus,
  getMenuItemById,
  updateMenu,
  deleteMenu,
} from "../controllers/menuController.js";

const router = express.Router();

router.post("/", createMenu);
router.get("/", getMenus);
router.get("/:id", getMenuItemById);
router.put("/:id", updateMenu);
router.delete("/:id", deleteMenu);

export default router;
