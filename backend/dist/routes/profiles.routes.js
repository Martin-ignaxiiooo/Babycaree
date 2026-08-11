"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const profiles_controller_1 = require("../controllers/profiles.controller");
const router = (0, express_1.Router)();
// Rutas Públicas
router.get("/public/:id", profiles_controller_1.getPublicBabyProfile);
// Rutas Protegidas
router.use(auth_middleware_1.verifyToken);
router.get("/me", profiles_controller_1.getMe);
router.patch("/me", profiles_controller_1.updateMe);
router.patch("/me/password", profiles_controller_1.updatePassword);
router.post("/babies", profiles_controller_1.createBabyProfile);
router.get("/babies", profiles_controller_1.getMyBabies);
router.delete("/babies/:id", profiles_controller_1.deleteBabyProfile);
exports.default = router;
