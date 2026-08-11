"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bitacora_service_1 = require("./bitacora.service");
const adminAuth_middleware_1 = require("../../middlewares/adminAuth.middleware");
const router = (0, express_1.Router)();
// Only admin_general and auditor can view the audit log
router.get("/", (0, adminAuth_middleware_1.requireRole)(["admin_general", "auditor"]), bitacora_service_1.getBitacora);
exports.default = router;
