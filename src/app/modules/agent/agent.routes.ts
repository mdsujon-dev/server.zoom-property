import express from "express";
import { AgentController } from "./agent.controller";
import { createAgentZodSchema, updateAgentZodSchema } from "./agent.validation";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { UserRole } from "../auth/auth.interface";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(createAgentZodSchema),
  AgentController.createAgent
);

router.get("/", AgentController.getAllAgents);

router.get("/:id", AgentController.getSingleAgent);

router.patch(
  "/:id",
  auth(),
  validateRequest(updateAgentZodSchema),
  AgentController.updateAgent
);

router.delete(
  "/:id",
  auth(),
  AgentController.deleteAgent
);

export const AgentRoutes = router;
